import express from "express";

import get_entitiesRoutes from "./get-entities/index.js";
import get_suggested_entitiesRoutes from "./get-suggested-entities/index.js";
import get_collaborationsRoutes from "./get-collaborations/index.js";
import get_collaborations_by_countryRoutes from "./get-collaborations-by-country/index.js";
import get_collaborations_by_entityRoutes from "./get-collaborations-by-entity/index.js";

const router = new express.Router();

router.use(get_entitiesRoutes);
router.use(get_suggested_entitiesRoutes);
router.use(get_collaborationsRoutes);
router.use(get_collaborations_by_countryRoutes);
router.use(get_collaborations_by_entityRoutes);

export default router;
