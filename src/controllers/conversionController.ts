import { Request, Response } from "express";
import fs from "fs";
import { promises as fsPromises } from "fs";
import path from "path";
import { IUser } from "../models/User";
import { convertImage } from "../services/imageService";
import { convertVideo, validateVideoFile, getVideoDuration } from "../services/videoService";
import { pdfToImages, imagesToPdf } from "../services/pdfService";
import Conversion from "../models/Conversion";

interface AuthRequest extends Request {
  user?: IUser;
  file?: Express.Multer.File;
}

export const convertFile = async (req: AuthRequest, res: Response) => {
  console.log("🔍 Conversion request received:", {
    hasFile: !!req.file,
    file: req.file ? {
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      path: req.file.path
    } : 'No file',
    body: req.body,
    user: req.user ? { id: req.user._id, role: req.user.role } : 'No user'
  });

  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  // ✅ IMPROVED: Better file validation
  if (!fs.existsSync(req.file.path)) {
    console.log("❌ Uploaded file not found at path:", req.file.path);
    return res.status(400).json({ message: "Uploaded file not found" });
  }

  // ✅ NEW: Validate file is not empty
  if (req.file.size === 0) {
    fsPromises.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ message: "Uploaded file is empty (0 bytes)" });
  }

  const role = req.user?.role || "guest";
  const size = req.file.size;

  // ✅ UPDATED LIMITS - Guest: 100MB, User: 800MB, Admin: Unlimited
  const limits: Record<string, number> = {
    guest: 100 * 1024 * 1024,    // 100 MB for guest users
    user: 800 * 1024 * 1024,    // 800 MB for logged-in users
    admin: Infinity,            // Unlimited for admin
  };

  if (size > limits[role]) {
    fsPromises.unlink(req.file.path).catch(() => {});
    return res.status(400).json({
      message: `Upload failed: ${role === 'guest' ? 'Guest' : 'User'} users can only upload up to ${limits[role] / (1024 * 1024)} MB.`,
    });
  }

  const ext = path.extname(req.file.originalname).toLowerCase();
  const baseName = path.basename(req.file.originalname, ext);
  const outputDir = "uploads";
  fs.mkdirSync(outputDir, { recursive: true });

  const targetFormat = (req.body.targetFormat || "").toLowerCase();
  
  if (!targetFormat) {
    fsPromises.unlink(req.file.path).catch(() => {});
    return res.status(400).json({ message: "Target format is required" });
  }

  let outputFile = "";
  let convertedFormat = targetFormat;
  const originalFormat = ext.replace(".", "");

  // ✅ Same quality for all users since it's free
  const quality = 85;

  console.log("🔄 Starting conversion:", { originalFormat, targetFormat, quality });

  try {
    // ✅ Images
    if ([".png", ".jpg", ".jpeg", ".webp", ".heic", ".svg"].includes(ext)) {
      const format = targetFormat as "png" | "jpg" | "jpeg" | "webp";
      outputFile = path.join(outputDir, `${baseName}-converted.${format}`);
      await convertImage(req.file.path, outputFile, format, quality);
      convertedFormat = format;
    }
    // ✅ Video / GIF
    else if ([".gif", ".mp4", ".mov", ".avi", ".webm"].includes(ext)) {
      const format = targetFormat as "gif" | "mp4";
      outputFile = path.join(outputDir, `${baseName}-converted.${format}`);
      
      console.log("🎬 Processing video file...");
      
      try {
        const isValid = await validateVideoFile(req.file.path);
        if (!isValid) {
          console.log("⚠️ Video validation failed, but attempting conversion anyway...");
        }
      } catch (validationError) {
        console.log("⚠️ Video validation error, but attempting conversion:", validationError);
      }

      if (format === "gif") {
        try {
          const duration = await getVideoDuration(req.file.path);
          console.log(`⏱️ Video duration: ${duration.toFixed(2)} seconds`);
          if (duration > 30) {
            throw new Error("Video too long for GIF conversion. Maximum 30 seconds allowed.");
          }
        } catch (durationError) {
          console.log("⚠️ Could not get video duration, but attempting conversion:", durationError);
        }
      }

      console.log(`🎬 Starting video conversion: ${originalFormat} → ${format}`);
      await convertVideo(req.file.path, outputFile, format, quality);
      console.log("✅ Video conversion completed successfully");
      convertedFormat = format;
    }
    // ✅ PDF
    else if (ext === ".pdf") {
      const pdfOutputDir = path.join(outputDir, baseName);
      fs.mkdirSync(pdfOutputDir, { recursive: true });
      const images = await pdfToImages(req.file.path, pdfOutputDir);
      outputFile = path.join(outputDir, `${baseName}-converted.pdf`);
      await imagesToPdf(images, outputFile);
      convertedFormat = "pdf";
    }
    else {
      fsPromises.unlink(req.file.path).catch(() => {});
      return res.status(400).json({ message: "Unsupported file type" });
    }

    // ✅ Check if output file was created
    if (!fs.existsSync(outputFile)) {
      throw new Error("Conversion failed - output file was not created");
    }

    // ✅ Save conversion history
    if (req.user) {
      await Conversion.create({
        user: req.user._id,
        fileName: req.file.originalname,
        originalFormat,
        convertedFormat,
        size,
        date: new Date(),
      });
    }

    console.log("✅ Conversion successful, sending file to client");
    
    // ✅ Send file to user
    res.download(outputFile, `${baseName}-converted.${convertedFormat}`, async (err) => {
      // Cleanup files
      try {
        if (fs.existsSync(req.file!.path)) await fsPromises.unlink(req.file!.path);
        if (outputFile && fs.existsSync(outputFile)) await fsPromises.unlink(outputFile);
      } catch (cleanupError) {
        console.error("Cleanup error:", cleanupError);
      }
      
      if (err) {
        console.error("Download error:", err);
        if (!res.headersSent) {
          res.status(500).json({ message: "Download failed" });
        }
      }
    });

  } catch (err: any) {
    console.error("❌ Conversion error:", err);
    
    // Cleanup on error
    try {
      if (fs.existsSync(req.file!.path)) await fsPromises.unlink(req.file!.path);
      if (outputFile && fs.existsSync(outputFile)) await fsPromises.unlink(outputFile);
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError);
    }

    // ✅ IMPROVED: Better error messages for client
    let errorMessage = err.message || "Conversion failed";
    
    if (err.message.includes("VipsJpeg") || err.message.includes("premature") || err.message.includes("JPEG")) {
      errorMessage = "The image file appears to be corrupted or incomplete. Please try with a different image.";
    } else if (err.message.includes("empty")) {
      errorMessage = "The uploaded file is empty. Please select a valid file.";
    } else if (err.message.includes("unsupported") || err.message.includes("format")) {
      errorMessage = "The file format is not supported or the file is corrupted.";
    } else if (err.message.includes("too long")) {
      errorMessage = err.message; // Keep original message for video duration
    } else if (err.message.includes("FFmpeg") || err.message.includes("conversion")) {
      errorMessage = "Video conversion failed. The file format may not be supported.";
    }

    if (!res.headersSent) {
      res.status(500).json({ message: errorMessage });
    }
  }
};