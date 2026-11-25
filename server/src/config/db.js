import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { env } from "./env.js";

let memoryServer = null;

/**
 * Connects to MongoDB. In development, if MONGODB_URI is not provided,
 * an embedded MongoDB instance is started with a persistent data folder
 * so the project runs with zero external setup.
 */
export async function connectDB() {
  let uri = env.mongoUri;

  if (!uri) {
    const { MongoMemoryServer } = await import("mongodb-memory-server");
    const dbPath = path.resolve(process.cwd(), ".data", "mongoose");
    fs.mkdirSync(dbPath, { recursive: true });

    memoryServer = await MongoMemoryServer.create({
      instance: {
        dbPath,
        storageEngine: "wiredTiger",
      },
    });
    uri = memoryServer.getUri();
    console.log("  Embedded MongoDB running (persistent data in server/.data)");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(uri, { dbName: "lovaction" });
  console.log(`  MongoDB connected: ${mongoose.connection.host}`);

  return uri;
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
