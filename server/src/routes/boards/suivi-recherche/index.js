import express from "express";

import bibliometrieRoutes from "./routes/bibliometrie.js";
import ercRoutes from "./routes/erc.js";
import innovationRoutes from "./routes/innovation.js";
import prixRoutes from "./routes/prix.js";

const router = new express.Router();

router.use(bibliometrieRoutes);
router.use(ercRoutes);
router.use(innovationRoutes);
router.use(prixRoutes);

export default router;
