import express from "express";

import { db } from "../../../../services/mongo.js";

const router = new express.Router();

router.route("/suivi-recherche/financements").get(async (req, res) => {
  const { entite } = req.query
  const fundings = await db
    .collection("biblio_projects")
    .aggregate([
      { $match: { rors: entite } },
      {
        $group: {
          _id: { year: "$year", type: "$type" },
          count: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          type: "$_id.type",
          year: "$_id.year",
          count: 1,
        },
      },
      { $sort: { year: 1 } },
    ])
    .toArray();
  res.json(fundings);
});

export default router;
