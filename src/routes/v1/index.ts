import express, { Router } from "express";
import yieldsRoutes from "./yields";

const router: express.Router = Router();
router.use("/yields", yieldsRoutes);

// Health check endpoint
router.get("/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
