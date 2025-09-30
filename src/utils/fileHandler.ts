import multer from "multer";
import fs from "fs";
import path from "path";

// Use relative path instead of absolute path to avoid issues
const uploadDir = "uploads"; // ✅ Changed from absolute path
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

export const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 }, // ✅ Increased to 500MB for videos
});

export const deleteFile = (filePath: string) => {
  fs.unlink(filePath, (err) => {
    if (err) {
      console.error("❌ Failed to delete file:", filePath, err);
    } else {
      console.log(`🗑️ File deleted: ${filePath}`);
    }
  });
};