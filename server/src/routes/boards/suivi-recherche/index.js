import express from "express";

import bibliometrieRoutes from "./routes/bibliometrie.js";

const router = new express.Router();

router.use(bibliometrieRoutes);

export default router;
