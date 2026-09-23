import express from "express";
const router = new express.Router();

// get info from iso3
router.route("/geo/get-from-iso3").get(async (req, res) => {
  const { iso3 } = req.query;

  if (!iso3 || iso3.length !== 3) {
    return res.status(400).json({
      error: "Le code ISO3 doit contenir exactement 3 caractères"
    });
  }

  try {
    const url = `${process.env.ODS_API_URL}/curiexplore-pays/records?where=iso3%3D%22FRA%22&limit=10&offset=0&timezone=UTC&include_links=false&include_app_metas=false`;
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Apikey ${process.env.ODS_API_KEY}`,
      },
    });

    const data = await response.json();

    if (data?.total_count && data?.total_count > 0) {
      if (data.results[0].geometry) {
        delete data.results[0].geometry; // Remove geometry if it exists
      }
      res.status(200).json(data.results[0]);
    } else {
      res.status(404).json({ error: "No country found with the provided ISO3 code" });
    }
  } catch (error) {
    console.error("Error fetching country info:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
