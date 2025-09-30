import { PDFDocument } from "pdf-lib";
import fs from "fs";
import path from "path";

/**
 * Extract pages from PDF and save them as new PDFs
 * (⚠️ Note: pdf-lib does not convert directly to images.
 *           If you need PNGs, use a client-side library or an API.)
 */
export const pdfToPages = async (inputPath: string, outputDir: string) => {
  fs.mkdirSync(outputDir, { recursive: true });

  const data = await fs.promises.readFile(inputPath);
  const pdfDoc = await PDFDocument.load(data);

  const results: string[] = [];

  for (let i = 0; i < pdfDoc.getPageCount(); i++) {
    const newPdf = await PDFDocument.create();
    const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
    newPdf.addPage(copiedPage);

    const pdfBytes = await newPdf.save();
    const outFile = path.join(outputDir, `page-${i + 1}.pdf`);
    fs.writeFileSync(outFile, pdfBytes);

    results.push(outFile);
  }

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
