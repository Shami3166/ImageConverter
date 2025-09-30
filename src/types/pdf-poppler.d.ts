declare module "pdf-poppler" {
  export interface ConvertOptions {
    format?: string;     // "png" | "jpeg" | etc.
    out_dir?: string;    // output directory
    out_prefix?: string; // prefix for file names
    page?: number;       // single page (omit for all pages)
    scale?: number;      // quality/scale factor
  }

  export function convert(file: string, options: ConvertOptions): Promise<void>;
}
