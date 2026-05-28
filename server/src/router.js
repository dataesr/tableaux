import express from "express";

import accessibilityRouter from "./routes/boards/accessibility/index.js";
import adminRouter from "./routes/admin/index.js";
import facultyMembersRouter from "./routes/boards/faculty-members/index.js";
import atlasRouter from "./routes/boards/atlas/index.js";
import elasticSearchRouter from "./routes/elasticsearch.js";
import europeanProjectsRouter from "./routes/boards/european-projects/index.js";
import initRouter from "./routes/init.js";
import outcomesRouter from "./routes/boards/outcomes/index.js";
import searchRouter from "./routes/search.js";
import tableauxRouter from "./routes/tableaux.js";
import contactRouter from "./routes/contact.js";
import geoRouter from "./routes/geo.js";
import graduatesRouter from "./routes/boards/graduates/index.js";
import datasuprDocRouter from "./routes/boards/datasupr-doc/index.js";
import structuresFinanceRouter from "./routes/boards/structures-finance/index.js";
import valorisationRechercheInnovationRouter from "./routes/boards/valorisation-recherche-innovation/index.js";
import templateRouter from "./routes/boards/template/index.js";

const router = new express.Router();

router.use(accessibilityRouter);
router.use(adminRouter);
router.use(facultyMembersRouter);
router.use(atlasRouter);
router.use(contactRouter);
router.use(elasticSearchRouter);
router.use(europeanProjectsRouter);
router.use(initRouter);
router.use(outcomesRouter);
router.use(searchRouter);
router.use(tableauxRouter);
router.use(geoRouter);
router.use(graduatesRouter);
router.use(templateRouter);
router.use(valorisationRechercheInnovationRouter);
router.use(structuresFinanceRouter);
router.use(datasuprDocRouter);

export default router;
