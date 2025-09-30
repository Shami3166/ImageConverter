import fs from "fs";
import path from "path";
import cron from "node-cron";
import { logger } from "./logger";

const UPLOADS_DIR = path.join(__dirname, "../../uploads");

cron.schedule("0 */12 * * *", () => {
  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    for (const file of files) {
      const filePath = path.join(UPLOADS_DIR, file);
      const stats = fs.statSync(filePath);

      const expireTime = Date.now() - 24 * 60 * 60 * 1000;
      if (stats.mtimeMs < expireTime) {
        fs.unlinkSync(filePath);
        logger.info(`🗑️ Deleted old file: ${file}`);
      }
    }
  } catch (err) {
    logger.error(`Cleanup error: ${(err as Error).message}`);
  } finally {
    // future: could add monitoring or alert system here
  }
});
