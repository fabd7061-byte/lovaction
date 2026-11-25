import dotenv from "dotenv";

dotenv.config();

const isProduction = process.env.NODE_ENV === "production";

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  isProduction,
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || "",
  jwtSecret:
    process.env.JWT_SECRET ||
    (isProduction ? "" : "lovaction-dev-secret-change-me-in-production"),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  uploadDir: process.env.UPLOAD_DIR || "uploads",
  seedDemoData: process.env.SEED_DEMO_DATA !== "false",
};

if (!env.jwtSecret) {
  console.error("FATAL: JWT_SECRET must be set in production.");
  process.exit(1);
}
