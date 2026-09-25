import express from "express";

const router = new express.Router();

router
  .route("/european-projects/get-structure-from-paysage")
  .get(async (req, res) => {
    const { structureId } = req.query;

    if (!structureId) {
      return res.status(400).json({ error: "Missing structureId parameter" });
    }

    try {
      const response = await fetch(
        `${process.env.PAYSAGE_API_URL}/structures/${structureId}`,
        { headers: { "X-API-KEY": process.env.PAYSAGE_API_KEY } },
      );
      const structure = await response.json();
      return res.json(structure);
    } catch (error) {
      console.error("Error fetching structure from Paysage API:", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });

export default router;
