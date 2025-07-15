import app from "./app";
import { config } from "./config";
import { logger } from "./utils/logger";

const server = app.listen(config.port, () => {
  logger.info(
    `🚀 Server running on port ${config.port} in ${config.nodeEnv} mode`
  );
});
process.on("SIGINT", () => {
  logger.info("SIGINT received, shutting down gracefully");
  server.close(() => {
    logger.info("Process terminated");
    process.exit(0);
  });
});
