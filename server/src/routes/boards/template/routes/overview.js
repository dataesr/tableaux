import express from "express";
// import { db } from "../../../../services/mongo.js";
import { checkQuery } from "../../../utils.js";

const router = new express.Router();

router.route("/template/overview/test").get(async (req, res) => {
  const filters = checkQuery(req.query, ["name"], res);

  res.json({
    status: 200,
    filters,
  });
});

export default router;