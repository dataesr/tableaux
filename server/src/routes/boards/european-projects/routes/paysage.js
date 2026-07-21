import express from "express";

import { dbPaysage } from "../../../../services/mongo-paysage.js";

const router = new express.Router();

router.route("/european-projects/get-structure-from-paysage").get(async (req, res) => {
  const { structureId } = req.query;

  if (!structureId) {
    return res.status(400).json({ error: "Missing structureId parameter" });
  }

  try {
    const collection = dbPaysage.collection("structures");
    const structure = await collection.findOne({ id: structureId });

    if (!structure) {
      return res.status(404).json({ error: "Structure not found" });
    }

    return res.json(structure);
  } catch (error) {
    console.error("Error fetching structure from Paysage:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
