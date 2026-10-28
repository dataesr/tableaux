import express from "express";

import top_10_funding_rankingRoutes from "./top-10-funding-ranking/index.js";
import top_10_beneficiariesRoutes from "./top-10-beneficiaries/index.js";
import funding_evo_3_yearsRoutes from "./funding-evo-3-years/index.js";

const router = new express.Router();

router.use(top_10_funding_rankingRoutes);
router.use(top_10_beneficiariesRoutes);
router.use(funding_evo_3_yearsRoutes);

export default router;
