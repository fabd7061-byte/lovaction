import { env } from "./config/env.js";
import app from "./app.js";
import { connectDB, disconnectDB } from "./config/db.js";
import { seedDatabase } from "./utils/seed.js";

async function start() {
  console.log("\n  LOVACTION MINISTRIES — API");
  console.log(`  Environment: ${env.nodeEnv}\n`);

  await connectDB();

  if (env.seedDemoData) {
    try {
      await seedDatabase();
    } catch (err) {
      console.error("Demo seeding failed:", err);
    }
  }

  const server = app.listen(env.port, () => {
    console.log(`  API ready at http://localhost:${env.port}/api`);
    console.log(`  Client expected at ${env.clientUrl}\n`);
  });

  const shutdown = async (signal) => {
    console.log(`\n  ${signal} received — shutting down.`);
    server.close(async () => {
      await disconnectDB();
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

start().catch((err) => {
  console.error("Unable to start server:", err);
  process.exit(1);
});
