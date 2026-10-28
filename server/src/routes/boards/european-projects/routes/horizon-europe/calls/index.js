import express from "express";

import callsRoutes from "./calls/index.js";

const router = new express.Router();

router.use(callsRoutes);

export default router;
