import express from "express";

import synthesisRoutes from "./synthesis/index.js";
import synthesis_by_destinationRoutes from "./synthesis-by-destination/index.js";
import synthesis_by_panelRoutes from "./synthesis-by-panel/index.js";
import panel_fundingRoutes from "./panel-funding/index.js";
import evolutionRoutes from "./evolution/index.js";
import evolution_by_domainRoutes from "./evolution-by-domain/index.js";
import evolution_by_panelRoutes from "./evolution-by-panel/index.js";
import main_entitiesRoutes from "./main-entities/index.js";
import main_entities_by_domainRoutes from "./main-entities-by-domain/index.js";
import filtersRoutes from "./filters/index.js";
import gender_by_destinationRoutes from "./gender-by-destination/index.js";
import gender_evolutionRoutes from "./gender-evolution/index.js";
import gender_by_domainRoutes from "./gender-by-domain/index.js";

const router = new express.Router();

router.use(synthesisRoutes);
router.use(synthesis_by_destinationRoutes);
router.use(synthesis_by_panelRoutes);
router.use(panel_fundingRoutes);
router.use(evolutionRoutes);
router.use(evolution_by_domainRoutes);
router.use(evolution_by_panelRoutes);
router.use(main_entitiesRoutes);
router.use(main_entities_by_domainRoutes);
router.use(filtersRoutes);
router.use(gender_by_destinationRoutes);
router.use(gender_evolutionRoutes);
router.use(gender_by_domainRoutes);

export default router;
