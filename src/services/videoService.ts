import ffmpeg from "fluent-ffmpeg";
import fs from "fs";

export const convertVideo = async (
  inputPath: string,
  outputPath: string,
  format: "gif" | "mp4",
  quality: number = 80
): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Check if input file exists
    if (!fs.existsSync(inputPath)) {
      return reject(new Error("Input file not found"));
    }

    console.log(`🎬 Starting ${format} conversion:`, { inputPath, outputPath, quality });

    const command = ffmpeg(inputPath);

    if (format === "gif") {
      // ✅ MP4 to GIF conversion
      command
        .outputOptions([
          '-vf', 'fps=10,scale=640:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse',
          '-loop', '0'
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg GIF conversion started:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('GIF Processing: ' + (progress.percent || 0) + '% done');
        })
        .on('end', () => {
          console.log('✅ GIF conversion finished');
          resolve();
        })
        .on('error', (err) => {
          console.error('❌ GIF conversion error:', err);
          reject(new Error(`GIF conversion failed: ${err.message}`));
        })
        .run();
        
    } else if (format === "mp4") {
      // ✅ GIF to MP4 conversion
      const crf = Math.max(1, Math.min(51, 51 - Math.floor(quality / 2)));
      
      command
        .outputOptions([
          '-c:v', 'libx264',
          '-pix_fmt', 'yuv420p',
          '-movflags', '+faststart',
          '-preset', 'medium',
          '-crf', crf.toString()
        ])
        .output(outputPath)
        .on('start', (commandLine) => {
          console.log('FFmpeg MP4 conversion started:', commandLine);
        })
        .on('progress', (progress) => {
          console.log('MP4 Processing: ' + (progress.percent || 0) + '% done');
        })
        .on('end', () => {
          console.log('✅ MP4 conversion finished');
          resolve();
        })
        .on('error', (err) => {
          console.error('❌ MP4 conversion error:', err);
          reject(new Error(`MP4 conversion failed: ${err.message}`));
        })
        .run();
    } else {
      reject(new Error(`Unsupported format: ${format}`));
    }
  });
};

export const validateVideoFile = async (filePath: string): Promise<boolean> => {
  return new Promise((resolve) => {
    // First check if file exists
    if (!fs.existsSync(filePath)) {
      console.log('❌ Video file not found:', filePath);
      resolve(false);
      return;
    }

    console.log('🔍 Validating video file:', filePath);
    
    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        console.error('❌ Video validation failed:', err.message);
        resolve(false);
      } else {
        console.log('✅ Video validation passed:', {
          format: metadata.format.format_name,
          duration: metadata.format.duration,
          size: metadata.format.size
        });
        resolve(true);
      }
    });
  });
};

export const getVideoDuration = (filePath: string): Promise<number> => {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(filePath)) {
      return reject(new Error("Video file not found"));
    }

    ffmpeg.ffprobe(filePath, (err, metadata) => {
      if (err) {
        reject(new Error(`Could not read video duration: ${err.message}`));
      } else {
        const duration = metadata.format.duration || 0;
        console.log(`⏱️ Video duration: ${duration} seconds`);
        resolve(duration);
      }
    });
  });
};