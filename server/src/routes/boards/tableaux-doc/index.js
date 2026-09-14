import express from "express";

import overviewRoutes from "./routes/overview.js";

const router = new express.Router();

router.use(overviewRoutes);

export default router;
