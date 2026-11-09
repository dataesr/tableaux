import express from "express";

import { BadRequestError } from "../../../../commons/errors/index.js";
import { getCollection } from "../collections.js";
import {
  computePeriodes,
  GROUPE_AUTRES,
  GROUPE_PAR_DEFAUT,
  GROUPES_ETABLISSEMENTS,
  getReferencesMedianes,
  groupeOf,
  shapeMatrice,
} from "../matrice.js";
import { computeAbscisses, computeRubans, DEMI_COLONNE, HAUTEUR } from "../rubans.js";
import { getSourcesBibliometrie } from "../sources.js";

const router = new express.Router();

const CLASSEMENT = "erc";
const MONDE = "MONDE";
const PERIMETRES = ["toutes_revues_openalex", "revues_sjr"];
const DOMAINES = ["LS", "PE", "SH"];
const INDICATEURS = ["poids", "influence", "prestige"];
const CODE_PATTERN = /^[A-Za-z0-9]+$/;
// Identifiant ROR sans le préfixe https://ror.org/
const ROR_PATTERN = /^0[a-z0-9]{6}[0-9]{2}$/;
const ENTITE_NATIONALE = "FR";
// En dessous, la position d'une discipline dans la matrice est peu fiable
const SEUIL_FIABILITE = 30;

function parseYear(value, name) {
  const year = Number.parseInt(value, 10);
  if (!Number.isInteger(year) || String(year) !== String(value)) {
    throw new BadRequestError(`${name} must be a year`);
  }
  return year;
}

// Filtres communs à toutes les routes d'indicateurs, validés une fois.
// Noms des paramètres : plugins/tableaux/reference/url-parameters.md (ror_id absent = France).
function parseFilters(query, { withEntite = true, withDiscipline = true } = {}) {
  const { ror_id, perimetre, year_min, year_max, discipline, domaine, inclure_multidisciplinaires } = query;

  if (ror_id && !ROR_PATTERN.test(ror_id)) throw new BadRequestError("invalid ror_id");
  if (!PERIMETRES.includes(perimetre)) throw new BadRequestError(`perimetre must be one of ${PERIMETRES.join(", ")}`);
  const debut = parseYear(year_min, "year_min");
  const fin = parseYear(year_max, "year_max");
  if (debut > fin) throw new BadRequestError("year_min must be lower than or equal to year_max");
  if (discipline && !CODE_PATTERN.test(discipline)) throw new BadRequestError("invalid discipline");
  if (domaine && !DOMAINES.includes(domaine)) throw new BadRequestError(`domaine must be one of ${DOMAINES.join(", ")}`);
  if (inclure_multidisciplinaires !== undefined && !["true", "false"].includes(inclure_multidisciplinaires)) {
    throw new BadRequestError("inclure_multidisciplinaires must be true or false");
  }

  const entiteId = ror_id ?? ENTITE_NATIONALE;
  const match = {
    perimetre,
    classement: CLASSEMENT,
    annee_publication: { $gte: debut, $lte: fin },
  };
  if (withEntite) match.entite_id = { $in: [entiteId, MONDE] };
  if (withDiscipline && discipline) match.discipline_code = discipline;
  else if (withDiscipline && domaine) match.discipline_code = { $regex: `^${domaine}` };

  return { entiteId, debut, fin, match, multi: inclure_multidisciplinaires !== "false" };
}

const SUMS = {
  nb_articles: { $sum: "$nb_articles" },
  nb_articles_top10_cites: { $sum: "$nb_articles_top10_cites" },
  nb_articles_revues_tete_disciplinaires: { $sum: "$nb_articles_revues_tete_disciplinaires" },
  nb_articles_revues_tete_multidisciplinaires: { $sum: "$nb_articles_revues_tete_multidisciplinaires" },
  influence_provisoire: { $max: "$influence_provisoire" },
};

function ratio(numerateur = 0, denominateur = 0) {
  return { valeur: denominateur ? numerateur / denominateur : null, numerateur, denominateur };
}

// On additionne d'abord, on divise ensuite : jamais de moyenne de parts (CONTRAT_DONNEES §4)
function computeIndicators(entite = {}, monde = {}, multi = false) {
  const prestige = (row) => (row.nb_articles_revues_tete_disciplinaires ?? 0)
    + (multi ? row.nb_articles_revues_tete_multidisciplinaires ?? 0 : 0);
  return {
    poids: ratio(entite.nb_articles, monde.nb_articles),
    influence: ratio(entite.nb_articles_top10_cites, monde.nb_articles_top10_cites),
    prestige: ratio(prestige(entite), prestige(monde)),
    influence_provisoire: Boolean(monde.influence_provisoire),
  };
}

// Périodes de départ et d'arrivée de la matrice : 1 à 3 années à chaque bout de la plage.
// Pour l'influence, on écarte les années provisoires tant qu'il en reste au moins deux.
// Index des lignes agrégées par entité et par année : une recherche en O(1) au lieu d'un find par cellule
function indexByEntiteAnnee(rows) {
  const index = new Map();
  rows.forEach((row) => index.set(`${row._id.entite_id}|${row._id.annee_publication}`, row));
  return (id, year) => index.get(`${id}|${year}`);
}

// Indicateur et périodes de départ / d'arrivée d'une matrice, validés une fois
async function parseMatrice(query, debut, fin) {
  const { indicateur } = query;
  if (!INDICATEURS.includes(indicateur)) throw new BadRequestError(`indicateur must be one of ${INDICATEURS.join(", ")}`);
  const meta = await (await getCollection("biblio_meta")).findOne({}, { projection: { annees: 1, annees_influence_provisoire: 1 } });
  const provisoires = meta?.annees_influence_provisoire ?? [];
  const periodes = computePeriodes(debut, fin, meta?.annees ?? [], provisoires, indicateur === "influence");
  if (!periodes) throw new BadRequestError("the period must contain at least two years");
  return {
    indicateur,
    periodes,
    provisoire: indicateur === "influence" && range(periodes.arrivee).some((annee) => provisoires.includes(annee)),
  };
}

router.route("/suivi-recherche/bibliometrie/meta").get(async (req, res) => {
  const collection = await getCollection("biblio_meta");
  const meta = await collection.findOne({}, { projection: { _id: 0, parametres: 0 } });
  res.json({ ...meta, sources: getSourcesBibliometrie(meta) });
});

router.route("/suivi-recherche/bibliometrie/disciplines").get(async (req, res) => {
  const collection = await getCollection("biblio_disciplines");
  const disciplines = await collection
    .find({ classement: CLASSEMENT }, { projection: { _id: 0 } })
    .toArray();
  res.json(disciplines);
});

router.route("/suivi-recherche/bibliometrie/entites").get(async (req, res) => {
  const collection = await getCollection("entites");
  const entites = await collection
    .find(
      { selecteur: true },
      { projection: { _id: 0, entite_id: 1, entite_type: 1, nom: 1, sigle: 1, categorie: 1, ville: 1, recherche: 1, ordre_selecteur: 1 } },
    )
    .sort({ ordre_selecteur: 1, nb_articles: -1 })
    .toArray();
  res.json(entites);
});

router.route("/suivi-recherche/bibliometrie/indicateurs").get(async (req, res) => {
  const { entiteId, match, multi } = parseFilters(req.query);
  const collection = await getCollection("biblio_effectifs");
  const rows = await collection
    .aggregate([{ $match: match }, { $group: { _id: "$entite_id", ...SUMS } }])
    .toArray();

  const entite = rows.find((row) => row._id === entiteId);
  const monde = rows.find((row) => row._id === MONDE);
  res.json({ ...computeIndicators(entite, monde, multi), nb_articles: entite?.nb_articles ?? 0 });
});

router.route("/suivi-recherche/bibliometrie/evolution").get(async (req, res) => {
  const { entiteId, match, multi } = parseFilters(req.query);
  const collection = await getCollection("biblio_effectifs");
  const rows = await collection
    .aggregate([
      { $match: match },
      { $group: { _id: { entite_id: "$entite_id", annee_publication: "$annee_publication" }, ...SUMS } },
    ])
    .toArray();

  const years = [...new Set(rows.map((row) => row._id.annee_publication))].sort((a, b) => a - b);
  const find = indexByEntiteAnnee(rows);
  res.json(years.map((year) => ({
    annee_publication: year,
    ...computeIndicators(find(entiteId, year), find(MONDE, year), multi),
  })));
});

// Comparaison des pays retenus (biblio_meta.pays_compares), année par année.
// La réponse contient, pour chacun des trois indicateurs, les rubans déjà classés et positionnés :
// changer d'indicateur côté client ne déclenche ni requête ni calcul.
router.route("/suivi-recherche/bibliometrie/comparaison-internationale").get(async (req, res) => {
  const { debut, fin, match, multi } = parseFilters(req.query, { withEntite: false });
  const meta = await (await getCollection("biblio_meta")).findOne({}, { projection: { pays_compares: 1, annees_influence_provisoire: 1 } });
  const ids = meta?.pays_compares ?? [];

  const [rows, noms] = await Promise.all([
    (await getCollection("biblio_effectifs"))
      .aggregate([
        { $match: { ...match, entite_id: { $in: [...ids, MONDE] } } },
        { $group: { _id: { entite_id: "$entite_id", annee_publication: "$annee_publication" }, ...SUMS } },
      ])
      .toArray(),
    (await getCollection("entites"))
      .find({ entite_id: { $in: ids } }, { projection: { _id: 0, entite_id: 1, nom: 1 } })
      .toArray(),
  ]);

  const nomById = new Map(noms.map((item) => [item.entite_id, item.nom]));
  const pays = ids.map((id) => ({ entite_id: id, nom: nomById.get(id) ?? id }));
  const annees = [...new Set(rows.map((row) => row._id.annee_publication))].sort((a, b) => a - b);
  const find = indexByEntiteAnnee(rows);
  // Indicateurs calculés une fois par pays et par année, puis lus pour chaque indicateur
  const cellules = new Map(pays.map(({ entite_id: id }) => [
    id,
    annees.map((annee) => computeIndicators(find(id, annee), find(MONDE, annee), multi)),
  ]));

  res.json({
    annees,
    annees_provisoires: (meta?.annees_influence_provisoire ?? []).filter((annee) => annee >= debut && annee <= fin),
    pays,
    geometrie: { hauteur: HAUTEUR, demi_colonne: DEMI_COLONNE, abscisses: computeAbscisses(annees) },
    indicateurs: Object.fromEntries(INDICATEURS.map((indicateur) => [
      indicateur,
      computeRubans(annees, pays, (id, j) => cellules.get(id)[j][indicateur]),
    ])),
  });
});

// Matrice niveau × dynamique : une ligne par discipline de l'entité
router.route("/suivi-recherche/bibliometrie/positionnement").get(async (req, res) => {
  const { entiteId, debut, fin, match, multi } = parseFilters(req.query, { withDiscipline: false });
  const { indicateur, periodes, provisoire } = await parseMatrice(req.query, debut, fin);

  const { depart, arrivee } = periodes;
  const [rows, disciplines] = await Promise.all([
    (await getCollection("biblio_effectifs"))
      .aggregate([
        { $match: { ...match, annee_publication: { $in: [...range(depart), ...range(arrivee)] } } },
        {
          $group: {
            _id: {
              entite_id: "$entite_id",
              discipline_code: "$discipline_code",
              periode: { $cond: [{ $lte: ["$annee_publication", depart[1]] }, "depart", "arrivee"] },
            },
            ...SUMS,
          },
        },
      ])
      .toArray(),
    (await getCollection("biblio_disciplines")).find({ classement: CLASSEMENT }, { projection: { _id: 0 } }).toArray(),
  ]);

  // Totaux par entité × période, toutes disciplines (clé sans code) et par discipline, en un seul passage
  const totaux = new Map();
  const add = (key, row) => {
    const total = totaux.get(key) ?? {};
    Object.keys(SUMS).forEach((field) => {
      total[field] = field === "influence_provisoire" ? total[field] || row[field] : (total[field] ?? 0) + (row[field] ?? 0);
    });
    totaux.set(key, total);
  };
  rows.forEach((row) => {
    const { entite_id: id, periode, discipline_code: code } = row._id;
    add(`${id}|${periode}|`, row);
    add(`${id}|${periode}|${code}`, row);
  });
  const sum = (id, periode, code = "") => totaux.get(`${id}|${periode}|${code}`) ?? {};

  const reference = computeIndicators(sum(entiteId, "arrivee"), sum(MONDE, "arrivee"), multi)[indicateur];
  const points = disciplines.map((discipline) => {
    const code = discipline.discipline_code;
    const entiteArrivee = sum(entiteId, "arrivee", code);
    const niveau = computeIndicators(entiteArrivee, sum(MONDE, "arrivee", code), multi)[indicateur];
    const niveauDepart = computeIndicators(sum(entiteId, "depart", code), sum(MONDE, "depart", code), multi)[indicateur];
    const dynamique = niveauDepart.valeur && niveau.valeur !== null ? (niveau.valeur / niveauDepart.valeur - 1) * 100 : null;
    const nbArticles = entiteArrivee.nb_articles ?? 0;
    // Articles les plus faibles des deux périodes, pour la fiabilité de l'évolution (comme l'ERC et les prix)
    const minArticles = Math.min(sum(entiteId, "depart", code).nb_articles ?? 0, nbArticles);
    return { ...discipline, niveau, niveau_depart: niveauDepart, dynamique, nb_articles: nbArticles, min_articles: minArticles, taille: nbArticles };
  });

  // Niveau : part de l'entité toutes disciplines ; dynamique : 0, la part mondiale de la discipline est stable
  const references = {
    niveau: { libelle: "Part toutes disciplines", valeur: reference.valeur, ratio: reference },
    dynamique: { libelle: "Part mondiale stable", valeur: 0 },
  };
  res.json({
    indicateur,
    periodes,
    provisoire,
    seuil_fiabilite: SEUIL_FIABILITE,
    ...shapeMatrice(points, references, (p) => p.discipline_code, (p) => p.min_articles >= SEUIL_FIABILITE),
  });
});

// Matrice niveau × dynamique des établissements d'un groupe de catégories, dans la discipline sélectionnée.
// Niveau : part mondiale de l'établissement ; références : médianes du groupe (niveau et évolution) ;
// repère international : part mondiale stable (évolution 0), comparée à l'évolution de la France.
router.route("/suivi-recherche/bibliometrie/positionnement-etablissements").get(async (req, res) => {
  const { debut, fin, match, multi } = parseFilters(req.query, { withEntite: false });
  const { indicateur, periodes, provisoire } = await parseMatrice(req.query, debut, fin);
  // ror_id (validé par parseFilters) : établissement mis en avant et groupe par défaut
  const { ror_id: selectionId, groupe: groupeDemande } = req.query;
  const groupesValides = [...GROUPES_ETABLISSEMENTS, GROUPE_AUTRES].map((groupe) => groupe.code);
  if (groupeDemande && !groupesValides.includes(groupeDemande)) throw new BadRequestError(`groupe must be one of ${groupesValides.join(", ")}`);

  const etablissements = (await (await getCollection("entites"))
    .find({ selecteur: true, entite_type: "etablissement" }, { projection: { _id: 0, entite_id: 1, nom: 1, sigle: 1, categorie: 1, groupe_etablissement: 1 } })
    .toArray())
    .map(({ groupe_etablissement, ...etablissement }) => ({ ...etablissement, groupe: groupe_etablissement ?? groupeOf(etablissement.categorie) }));

  // Sans groupe demandé : celui de l'établissement sélectionné, sinon les universités
  const groupeSelection = etablissements.find((etablissement) => etablissement.entite_id === selectionId)?.groupe ?? null;
  const groupe = groupeDemande ?? groupeSelection ?? GROUPE_PAR_DEFAUT;
  const membres = etablissements.filter((etablissement) => etablissement.groupe === groupe);
  const groupes = [...GROUPES_ETABLISSEMENTS, GROUPE_AUTRES]
    .map(({ code, libelle }) => ({ code, libelle, nb: etablissements.filter((etablissement) => etablissement.groupe === code).length }))
    .filter(({ nb }) => nb > 0);

  const { depart, arrivee } = periodes;
  const rows = await (await getCollection("biblio_effectifs"))
    .aggregate([
      {
        $match: {
          ...match,
          entite_id: { $in: [...membres.map((etablissement) => etablissement.entite_id), ENTITE_NATIONALE, MONDE] },
          annee_publication: { $in: [...range(depart), ...range(arrivee)] },
        },
      },
      {
        $group: {
          _id: {
            entite_id: "$entite_id",
            periode: { $cond: [{ $lte: ["$annee_publication", depart[1]] }, "depart", "arrivee"] },
          },
          ...SUMS,
        },
      },
    ])
    .toArray();

  const totaux = new Map(rows.map((row) => [`${row._id.entite_id}|${row._id.periode}`, row]));
  const sum = (id, periode) => totaux.get(`${id}|${periode}`) ?? {};
  const points = membres
    .map((etablissement) => {
      const id = etablissement.entite_id;
      const niveau = computeIndicators(sum(id, "arrivee"), sum(MONDE, "arrivee"), multi)[indicateur];
      const niveauDepart = computeIndicators(sum(id, "depart"), sum(MONDE, "depart"), multi)[indicateur];
      const dynamique = niveauDepart.valeur && niveau.valeur !== null ? (niveau.valeur / niveauDepart.valeur - 1) * 100 : null;
      return {
        entite_id: id,
        nom: etablissement.nom,
        sigle: etablissement.sigle ?? null,
        categorie: etablissement.categorie,
        niveau,
        niveau_depart: niveauDepart,
        dynamique,
        nb_articles: sum(id, "arrivee").nb_articles ?? 0,
        // Articles les plus faibles des deux périodes, pour la fiabilité de l'évolution (comme l'ERC et les prix)
        min_articles: Math.min(sum(id, "depart").nb_articles ?? 0, sum(id, "arrivee").nb_articles ?? 0),
        taille: sum(id, "arrivee").nb_articles ?? 0,
        focus: id === selectionId,
      };
    });

  const france = {
    libelle: "France",
    depart: computeIndicators(sum(ENTITE_NATIONALE, "depart"), sum(MONDE, "depart"), multi)[indicateur],
    arrivee: computeIndicators(sum(ENTITE_NATIONALE, "arrivee"), sum(MONDE, "arrivee"), multi)[indicateur],
  };
  const references = {
    ...getReferencesMedianes(points, (p) => p.entite_id),
    // Sans part française sur l'une des périodes, pas de repère
    international: france.depart.valeur && france.arrivee.valeur !== null
      ? { libelle: "Part mondiale stable", valeur: 0, au_dessus: "gagne de la part mondiale", en_dessous: "perd de la part mondiale", base: france }
      : null,
  };

  res.json({
    indicateur,
    periodes,
    provisoire,
    groupe,
    groupes,
    // Groupe de l'établissement sélectionné (null pour la France) : il n'apparaît que dans ce groupe
    groupe_selection: groupeSelection,
    seuil_fiabilite: SEUIL_FIABILITE,
    ...shapeMatrice(points, references, (p) => p.entite_id, (p) => p.min_articles >= SEUIL_FIABILITE),
  });
});

function range([start, end]) {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

export default router;
