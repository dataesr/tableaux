import express from "express";

import main_beneficiaries_pct_50Routes from "./main-beneficiaries-pct-50/index.js";
import beneficiaries_by_roleRoutes from "./beneficiaries-by-role/index.js";

const router = new express.Router();

router.use(main_beneficiaries_pct_50Routes);
router.use(beneficiaries_by_roleRoutes);

export default router;
