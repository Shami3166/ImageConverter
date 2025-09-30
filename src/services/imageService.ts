import sharp from "sharp";
import fs from "fs/promises";

export const convertImage = async (
  inputPath: string,
  outputPath: string,
  format: "png" | "jpg" | "jpeg" | "webp",
  quality: number
) => {
  try {
    console.log(`🔄 Converting image: ${inputPath} → ${outputPath} (${format}, quality: ${quality})`);

    // ✅ Validate input file exists and is readable
    try {
      await fs.access(inputPath);
      const stats = await fs.stat(inputPath);
      if (stats.size === 0) {
        throw new Error("Input file is empty (0 bytes)");
      }
      console.log(`📁 Input file size: ${stats.size} bytes`);
    } catch (error) {
      throw new Error(`Cannot access input file: ${(error instanceof Error ? error.message : String(error))}`);
    }

    let sharpInstance: sharp.Sharp;

    try {
      // ✅ Create sharp instance with error handling
      sharpInstance = sharp(inputPath);
      
      // ✅ Validate the image is readable by sharp
      const metadata = await sharpInstance.metadata();
      console.log(`📊 Image metadata: ${metadata.width}x${metadata.height}, format: ${metadata.format}`);
      
      if (!metadata.width || !metadata.height) {
        throw new Error("Invalid image dimensions");
      }
    } catch (error) {
      throw new Error(`Cannot read image file: ${(error instanceof Error ? error.message : String(error))}`);
    }

    // ✅ Use a different sharp method based on the desired output format
    if (format === "jpeg" || format === "jpg") {
      await sharpInstance
        .jpeg({ 
          quality,
          mozjpeg: true // Better compression
        })
        .toFile(outputPath);
    } else if (format === "webp") {
      await sharpInstance
        .webp({ 
          quality,
          effort: 4 // Balance between speed and compression
        })
        .toFile(outputPath);
    } else if (format === "png") {
      await sharpInstance
        .png({
          compressionLevel: 9, // Maximum compression
          quality: 100 // PNG uses 0-100 range
        })
        .toFile(outputPath);
    } else {
      throw new Error(`Unsupported output format: ${format}`);
    }

    // ✅ Verify output file was created
    try {
      const outputStats = await fs.stat(outputPath);
      if (outputStats.size === 0) {
        throw new Error("Output file is empty");
      }
      console.log(`✅ Conversion successful. Output size: ${outputStats.size} bytes`);
    } catch (error) {
      throw new Error(`Output file verification failed: ${(error instanceof Error ? error.message : String(error))}`);
    }

    return outputPath;

  } catch (error: any) {
    console.error("❌ Image conversion error:", error);
    
    // ✅ Clean up output file if it was partially created
    try {
      await fs.unlink(outputPath).catch(() => {});
    } catch (cleanupError) {
      console.error("Cleanup error:", cleanupError);
    }
    
    // ✅ Better error messages for common issues
    if (error.message.includes('VipsJpeg') || error.message.includes('JPEG') || error.message.includes('premature')) {
      throw new Error("The JPEG image appears to be corrupted or incomplete. Please try with a different image file.");
    }
    
    if (error.message.includes('Input file contains unsupported image format')) {
      throw new Error("The image format is not supported or the file is corrupted.");
    }
    
    if (error.message.includes('empty')) {
      throw new Error("The uploaded file is empty. Please select a valid image file.");
    }
    
    throw new Error(`Image conversion failed: ${error.message}`);
  }
};