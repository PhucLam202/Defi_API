import express, { Router } from "express";
import yieldsRoutes from "./yields";
import stablecoinRoutes from "./stablecoin";

const router: express.Router = Router();
router.use("/yields", yieldsRoutes);
router.use("/stablecoins", stablecoinRoutes);

export default router;
