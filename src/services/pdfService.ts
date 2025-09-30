import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";
//@ts-ignore
import * as poppler from "pdf-poppler";

// ✅ tell Node where Poppler is (your path)
process.env.PATH = process.env.PATH + ";C:\\Users\\Lahori Computers\\Downloads\\poppler-25.07.0\\Library\\bin";

/**
 * Convert PDF pages into PNG images
 */
export const pdfToImages = async (inputPath: string, outputDir: string) => {
  fs.mkdirSync(outputDir, { recursive: true });

  const opts: poppler.ConvertOptions = {
    format: "png",
    out_dir: outputDir,
    out_prefix: path.basename(inputPath, path.extname(inputPath)),
    scale: 1024, // better quality
  };

  await poppler.convert(inputPath, opts);

  const results = fs
    .readdirSync(outputDir)
    .filter((f) => f.endsWith(".png"))
    .map((f) => path.join(outputDir, f));

  return results;
};

/**
 * Combine images back into a single PDF
 */
export const imagesToPdf = async (images: string[], outputPath: string) => {
  const pdfDoc = await PDFDocument.create();

  for (const imgPath of images) {
    const imageBytes = fs.readFileSync(imgPath);
    let embeddedImage;

    if (imgPath.toLowerCase().endsWith(".jpg") || imgPath.toLowerCase().endsWith(".jpeg")) {
      embeddedImage = await pdfDoc.embedJpg(imageBytes);
    } else {
      embeddedImage = await pdfDoc.embedPng(imageBytes);
    }

    const page = pdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
    page.drawImage(embeddedImage, {
      x: 0,
      y: 0,
      width: embeddedImage.width,
      height: embeddedImage.height,
    });
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);
};
