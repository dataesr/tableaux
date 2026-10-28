import express from "express";

import HEcallsRoutes from "./routes/horizon-europe/calls/index.js";
import HEbeneficiariesRoutes from "./routes/horizon-europe/entities/beneficiaries/index.js";
import HEtypeBeneficiariesRoutes from "./routes/horizon-europe/entities/type-beneficiaries/index.js";
import HEcollaborationsRoutes from "./routes/horizon-europe/collaborations/index.js";
import ercRoutes from "./routes/erc.js";
import evolutionPcriRoutes from "./routes/evolution-pcri.js";
import filtersRoutes from "./routes/filters.js";
import mscaRoutes from "./routes/msca.js";
import HEoverviewRoutes from "./routes/horizon-europe/overview/index.js";
import paysageRoutes from "./routes/paysage.js";
import HEpositioningRoutes from "./routes/horizon-europe/positioning/index.js";
import projectstypesRoutes from "./routes/projects-types.js";

const router = new express.Router();

router.use(filtersRoutes);

// horizon-europe
router.use(HEoverviewRoutes);
router.use(HEpositioningRoutes);
router.use(HEcollaborationsRoutes);
router.use(HEcallsRoutes);
router.use(HEbeneficiariesRoutes);
router.use(HEtypeBeneficiariesRoutes);

router.use(projectstypesRoutes);
router.use(evolutionPcriRoutes);
router.use(ercRoutes);
router.use(mscaRoutes);
router.use(paysageRoutes);

export default router;
