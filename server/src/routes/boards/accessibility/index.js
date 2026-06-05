import express from "express";
import { db } from "../../../services/mongo-accessibility.js";
const router = new express.Router();

// Retourne toutes les audits disponibles
router.get("/get-audits", async (req, res) => {
  try {
    const audits = await db.collection("audits").find({}).toArray();
    res.json(audits);
  } catch (error) {
    console.error("Error fetching audit data:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Retourne les données d'audit pour un site donné.
// Si plusieurs lignes sont récupérées, seule la plus récente est retournée.
router.get("/get-last-audit/:siteId", async (req, res) => {
  const siteId = req.params.siteId;

  try {
    const audits = await db.collection("audits").find({ siteId }).toArray();
    if (audits.length === 0) {
      return res.status(404).json({ message: "No audit data found for this site ID." });
    }
    //Trie des audits sur la version du rgaa et retourne le plus récent
    const lastRgaaId = audits.map((a) => a.rgaaId).sort((a, b) => b.localeCompare(a) - a.localeCompare(b))[0];
    res.json(audits.find((a) => a.rgaaId === lastRgaaId));
  } catch (error) {
    console.error("Error fetching audit data:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

// Retourne tous les criteres de test pour un RGAA donné
router.get("/get-rgaa/:rgaaId", async (req, res) => {
  const rgaaId = req.params.rgaaId;

  try {
    const rgaa = await db.collection("versions-rgaa").find({ rgaaId }).toArray();

    if (rgaa.length === 0) {
      // Si aucun RGAA n'est trouvé, retourne le dernier RGAA disponible
      const lastRgaa = await db.collection("versions-rgaa").find({}).sort({ rgaaId: -1 }).limit(1).toArray();
      if (lastRgaa.length === 0) {
        return res.status(404).json({ message: "No RGAA data found." });
      }
      return res.json(lastRgaa[0]);
    }
    res.json(rgaa[0]);
  } catch (error) {
    console.error("Error fetching RGAA test data:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

router.post("/update-tests", async (req, res) => {
  const { siteId, rgaaId, tests } = req.body;
  try {
    // Vérifie si un audit existe déjà pour ce site et ce RGAA
    const existingAudit = await db.collection("audits").findOne({ siteId, rgaaId });

    if (existingAudit) {
      // Si l'audit existe, met à jour ou ajoute chaque test
      for (const test of tests) {
        const existingTest = existingAudit.tests.find((t) => t.testId === test.testId);
        if (existingTest) {
          // Si le test existe, le mettre à jour
          const updatedTest = { ...test, updatedAt: new Date() };
          await db.collection("audits").updateOne({ _id: existingAudit._id }, { $set: { "tests.$[elem]": updatedTest } }, { arrayFilters: [{ "elem.testId": test.testId }] });
        } else {
          // Si le test n'existe pas, l'ajouter
          const newTest = { ...test, createdAt: new Date(), updatedAt: new Date() };
          await db.collection("audits").updateOne({ _id: existingAudit._id }, { $push: { tests: newTest } });
        }
      }
    } else {
      // Si l'audit n'existe pas, crée un nouvel audit avec les tests
      const testsWithDates = tests.map((test) => ({ ...test, createdAt: new Date(), updatedAt: new Date() }));
      await db.collection("audits").insertOne({
        siteId,
        rgaaId,
        tests: testsWithDates,
        createdAt: new Date(),
      });
    }
    res.json({ message: "Test updated successfully." });
  } catch (error) {
    console.error("Error updating test data:", error);
    res.status(500).json({ message: "Internal server error." });
  }
});

export default router;
