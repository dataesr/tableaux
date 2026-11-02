import express from "express";

import bibliometrieRoutes from "./routes/bibliometrie.js";
import financementsRoutes from "./routes/financements.js";

const router = new express.Router();

router.use(bibliometrieRoutes);
router.use(financementsRoutes);

export default router;
