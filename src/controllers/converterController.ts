

import { Request, Response } from "express";
export const getAllConverters = async (req: Request, res: Response) => {
  try {
    const converters = [
      {
        title: "PNG to JPG",
        description: "Convert PNG images to high-quality JPG format.",
        url: "png-to-jpg",
        sourceFormat: "png",
        targetFormat: "jpg",
        sourceMimeType: "image/png",
        targetMimeType: "image/jpeg",
      },
      {
        title: "JPG to PNG",
        description: "Convert JPG images to lossless PNG format.",
        url: "jpg-to-png",
        sourceFormat: "jpg",
        targetFormat: "png",
        sourceMimeType: "image/jpeg",
        targetMimeType: "image/png",
      },
      {
        title: "PNG to WebP",
        description: "Convert PNG to modern WebP format for smaller file sizes.",
        url: "png-to-webp",
        sourceFormat: "png",
        targetFormat: "webp",
        sourceMimeType: "image/png",
        targetMimeType: "image/webp",
      },
      {
        title: "WebP to PNG",
        description: "Convert WebP images back to PNG format.",
        url: "webp-to-png",
        sourceFormat: "webp",
        targetFormat: "png",
        sourceMimeType: "image/webp",
        targetMimeType: "image/png",
      },
      {
        title: "JPG to WebP",
        description: "Convert JPG images to efficient WebP format.",
        url: "jpg-to-webp",
        sourceFormat: "jpg",
        targetFormat: "webp",
        sourceMimeType: "image/jpeg",
        targetMimeType: "image/webp",
      },
      {
        title: "WebP to JPG",
        description: "Convert WebP images to universal JPG format.",
        url: "webp-to-jpg",
        sourceFormat: "webp",
        targetFormat: "jpg",
        sourceMimeType: "image/webp",
        targetMimeType: "image/jpeg",
      },
      {
        title: "SVG to PNG",
        description: "Convert scalable SVG vectors to PNG raster images.",
        url: "svg-to-png",
        sourceFormat: "svg",
        targetFormat: "png",
        sourceMimeType: "image/svg+xml",
        targetMimeType: "image/png",
      },
      {
        title: "SVG to JPG",
        description: "Convert SVG vectors to JPG raster images.",
        url: "svg-to-jpg",
        sourceFormat: "svg",
        targetFormat: "jpg",
        sourceMimeType: "image/svg+xml",
        targetMimeType: "image/jpeg",
      },
   
      {
        title: "HEIC to JPG",
        description: "Convert iPhone HEIC photos to universal JPG format.",
        url: "heic-to-jpg",
        sourceFormat: "heic",
        targetFormat: "jpg",
        sourceMimeType: "image/heic",
        targetMimeType: "image/jpeg",
      },
      {
        title: "HEIC to PNG",
        description: "Convert HEIC images to lossless PNG format.",
        url: "heic-to-png",
        sourceFormat: "heic",
        targetFormat: "png",
        sourceMimeType: "image/heic",
        targetMimeType: "image/png",
      }
    ];

     console.log(`📋 Sending ${converters.length} converters`);
    res.json(converters);
  } catch (error) {
    console.error("❌ Error in getAllConverters:", error);
    res.status(500).json({ message: "Server error fetching converters" });
  }
};