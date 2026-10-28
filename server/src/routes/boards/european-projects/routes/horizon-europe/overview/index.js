import express from "express";

import synthesis_focusRoutes from "./synthesis-focus/index.js";
import funded_objectivesRoutes from "./funded-objectives/index.js";
import pillars_funding_proportionRoutes from "./pillars-funding-proportion/index.js";
import programs_fundingRoutes from "./programs-funding/index.js";
import programs_funding_proportionRoutes from "./programs-funding-proportion/index.js";
import topics_fundingRoutes from "./topics-funding/index.js";
import topics_funding_proportionRoutes from "./topics-funding-proportion/index.js";
import destination_fundingRoutes from "./destination-funding/index.js";
import destination_funding_proportionRoutes from "./destination-funding-proportion/index.js";
import fundingRoutes from "./funding/index.js";
import funding_proportionRoutes from "./funding-proportion/index.js";
import pillars_funding_evo_3_yearsRoutes from "./pillars-funding-evo-3-years/index.js";
import programs_funding_evo_3_yearsRoutes from "./programs-funding-evo-3-years/index.js";
import funding_evoRoutes from "./funding-evo/index.js";
import destinations_funding_evo_3_yearsRoutes from "./destinations-funding-evo-3-years/index.js";
import projects_types_1Routes from "./projects-types-1/index.js";
import projects_types_2Routes from "./projects-types-2/index.js";
import projects_types_3Routes from "./projects-types-3/index.js";

const router = new express.Router();

router.use(synthesis_focusRoutes);
router.use(funded_objectivesRoutes);
router.use(pillars_funding_proportionRoutes);
router.use(programs_fundingRoutes);
router.use(programs_funding_proportionRoutes);
router.use(topics_fundingRoutes);
router.use(topics_funding_proportionRoutes);
router.use(destination_fundingRoutes);
router.use(destination_funding_proportionRoutes);
router.use(fundingRoutes);
router.use(funding_proportionRoutes);
router.use(pillars_funding_evo_3_yearsRoutes);
router.use(programs_funding_evo_3_yearsRoutes);
router.use(funding_evoRoutes);
router.use(destinations_funding_evo_3_yearsRoutes);
router.use(projects_types_1Routes);
router.use(projects_types_2Routes);
router.use(projects_types_3Routes);

export default router;
