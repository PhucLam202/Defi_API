import express, { Router } from "express";
import yieldsRoutes from "./yields.js";
import stablecoinRoutes from "./stablecoin.js";

const router: express.Router = Router();
router.use("/yields", yieldsRoutes);
router.use("/stablecoins", stablecoinRoutes);

export default router;
