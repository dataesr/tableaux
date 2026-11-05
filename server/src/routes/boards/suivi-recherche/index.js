import express from "express";

import bibliometrieRoutes from "./routes/bibliometrie.js";
import ercRoutes from "./routes/erc.js";
import financementsRoutes from "./routes/financements.js";

const router = new express.Router();

router.use(bibliometrieRoutes);
router.use(ercRoutes);
router.use(financementsRoutes);

export default router;
