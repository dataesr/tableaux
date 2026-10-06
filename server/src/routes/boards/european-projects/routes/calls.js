import express from "express";
import { db } from "../../../../services/mongo.js";

const router = new express.Router();

const COLLECTION_NAME = "european-projects_call-availability";

/**
 * Route de récupération des appels à projets
 * filtre possible sur action_code pour ERC et MSCA princupalement
 */
router.route("/european-projects/calls").get(async (req, res) => {
  const filters = {};
  // filtre permanent
  filters.call_status = "closed";

  if (req.query.action_code) {
    filters.action_code = req.query.action_code;
  }

  try {
    const data = await db
      .collection(COLLECTION_NAME)
      .aggregate([
        {
          $match: { ...filters },
        },
        {
          $project: {
            _id: 0,
            action_code: 1,
            calltitle: 1,
            call_id: 1,
            call_year: 1,
            expectedGrants: 1,
            nb_proj_successful: 1,
            status: 1,
          },
        },
        {
          $sort: {
            call_year: 1,
            status: -1,
          },
        },
      ])
      .toArray();

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
