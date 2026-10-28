import express from "express";

import top10_countries_by_type_of_beneficiariesRoutes from "./top10-countries-by-type-of-beneficiaries/index.js";
import type_beneficiaries_evolutionRoutes from "./type-beneficiaries-evolution/index.js";

const router = new express.Router();

router.use(top10_countries_by_type_of_beneficiariesRoutes);
router.use(type_beneficiaries_evolutionRoutes);

export default router;
