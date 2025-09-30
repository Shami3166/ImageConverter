import dotenv from "dotenv";
import { connectDB } from "./config/db";
import { seedAdmin } from "./config/seedAdmin";
import { logger } from "./utils/logger";
import "./utils/cleanup";
import app from "./app";

dotenv.config();

const PORT = process.env.PORT || 5000;

// ✅ Database connection + Seed Admin
connectDB()
  .then(async () => {
    await seedAdmin();
    logger.info("✅ Admin user checked/seeded");

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    logger.error(`❌ DB Connection Failed: ${err.message}`);
    process.exit(1);
  });
