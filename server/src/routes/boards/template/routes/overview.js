import express from "express";
// import { db } from "../../../../services/mongo.js";
import { checkQuery } from "../../../utils.js";
import { readFixture } from "../data/fixtures.js";

const router = new express.Router();

router.route("/template/overview/test").get(async (req, res) => {
  const filters = checkQuery(req.query, ["name"], res);

  res.json({
    status: 200,
    filters,
  });
});

// Example fixture-backed route: response envelope = { data, provenance }.
// Promotion replaces readFixture(...) with the approved data access and keeps
// the path and the response shape unchanged.
router.route("/template/overview/funded-labs").get(async (req, res) => {
  const { provenance, items } = await readFixture("funded-labs");

  res.json({ data: items, provenance });
});

export default router;