import sharp from "sharp";

export const convertImage = async (
  inputPath: string,
  outputPath: string,
  format: "png" | "jpg" | "jpeg" | "webp",
  quality: number
) => {
  // Use a different sharp method based on the desired output format and apply the quality setting.
  const sharpInstance = sharp(inputPath);
  
  if (format === "jpeg" || format === "jpg") {
    await sharpInstance.jpeg({ quality }).toFile(outputPath);
  } else if (format === "webp") {
    await sharpInstance.webp({ quality }).toFile(outputPath);
  } else if (format === "png") {
    // PNG is lossless and does not have a quality setting like JPEG/WebP.
    // Instead, we can adjust the compression level, but for simplicity, we'll
    // just pass it through without a quality change.
    await sharpInstance.png().toFile(outputPath);
  } else {
    // Fallback for other formats
    await sharpInstance.toFormat(format).toFile(outputPath);
  }
};
