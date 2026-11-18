import express from "express";

import { BadRequestError, NotFoundError } from "../../../../commons/errors/index.js";
import { getCollection } from "../collections.js";
import { getSourcesInnovation } from "../sources.js";

const router = new express.Router();

const ENTITE_NATIONALE = "FR";
const ROR_PATTERN = /^0[a-z0-9]{6}[0-9]{2}$/;
const INNOVATION_BASE = "/suivi-recherche/innovation/startups";

async function getMeta() {
  const meta = await (await getCollection("innovation_meta"))
    .findOne({}, { projection: { _id: 0 } });
  if (!meta) throw new NotFoundError("Innovation metadata is unavailable");
  return meta;
}

function parseYear(value, name) {
  const year = Number.parseInt(value, 10);
  if (!Number.isInteger(year) || String(year) !== String(value)) {
    throw new BadRequestError(`${name} must be a year`);
  }
  return year;
}

function getPeriode(query, annees) {
  if (!annees.length) throw new NotFoundError("No startup years are available");
  const debut = Math.max(query.year_min ? parseYear(query.year_min, "year_min") : annees[0], annees[0]);
  const fin = Math.min(query.year_max ? parseYear(query.year_max, "year_max") : annees.at(-1), annees.at(-1));
  return debut <= fin ? [debut, fin] : null;
}

function provenance(meta) {
  return {
    date_calcul: meta.date_calcul,
    date_observation: meta.source?.date_observation ?? null,
    empreinte_sha256: meta.source?.empreinte_sha256 ?? null,
  };
}

router.route(`${INNOVATION_BASE}/meta`).get(async (_req, res) => {
  const meta = await getMeta();
  res.json({
    data: {
      annees: meta.annees,
      annees_provisoires: meta.annees_provisoires,
      controles: meta.controles,
      date_observation: meta.source?.date_observation ?? null,
      methode: meta.methode,
      sources: getSourcesInnovation(meta),
    },
    provenance: provenance(meta),
  });
});

router.route(`${INNOVATION_BASE}/entites`).get(async (_req, res) => {
  const meta = await getMeta();
  const data = await (await getCollection("innovation_entites"))
    .find({}, { projection: { _id: 0 } })
    .sort({ nom: 1 })
    .toArray();
  res.json({ data, provenance: provenance(meta) });
});

router.route(`${INNOVATION_BASE}/evolution`).get(async (req, res) => {
  const meta = await getMeta();
  const { ror_id } = req.query;
  if (ror_id && !ROR_PATTERN.test(ror_id)) throw new BadRequestError("invalid ror_id");

  const entiteId = ror_id ?? ENTITE_NATIONALE;
  const periode = getPeriode(req.query, meta.annees);
  if (!periode) {
    return res.json({
      data: { entite_id: entiteId, periode: null, annees: [] },
      provenance: provenance(meta),
    });
  }

  const anneesProvisoires = new Set(meta.annees_provisoires);
  const effectifs = await (await getCollection("innovation_effectifs"))
    .find({
      indicateur_id: "INN-STU-01",
      entite_id: entiteId,
      annee: { $gte: periode[0], $lte: periode[1] },
    }, { projection: { _id: 0, annee: 1, nb_startups: 1 } })
    .sort({ annee: 1 })
    .toArray();
  const parAnnee = new Map(effectifs.map(({ annee, nb_startups }) => [annee, nb_startups]));
  const annees = Array.from({ length: periode[1] - periode[0] + 1 }, (_value, index) => {
    const annee = periode[0] + index;
    return {
      annee,
      nb_startups: parAnnee.has(annee) ? parAnnee.get(annee) : null,
      provisoire: anneesProvisoires.has(annee),
    };
  });

  return res.json({
    data: { entite_id: entiteId, periode, annees },
    provenance: provenance(meta),
  });
});

export default router;
