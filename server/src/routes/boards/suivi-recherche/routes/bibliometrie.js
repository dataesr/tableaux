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
import { grouperProfils } from "../similarite.js";
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
// Spécialisation : nombre de groupes de pays au profil proche, disciplines citées par groupe
const NB_GROUPES_PAYS = 5;
const NB_DISCIPLINES_GROUPE = 3;

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

// Revues de tête réellement comptées dans le prestige de la sélection : celles de chaque discipline sélectionnée
// (une liste par discipline, la même pour les deux périmètres), plus les multidisciplinaires si l'option est cochée.
// Une ligne par revue, avec les disciplines où elle compte, triées par SJR décroissant.
router.route("/suivi-recherche/bibliometrie/revues-tete").get(async (req, res) => {
  const { discipline, domaine, inclure_multidisciplinaires } = req.query;
  if (discipline && !CODE_PATTERN.test(discipline)) throw new BadRequestError("invalid discipline");
  if (domaine && !DOMAINES.includes(domaine)) throw new BadRequestError(`domaine must be one of ${DOMAINES.join(", ")}`);
  if (inclure_multidisciplinaires !== undefined && !["true", "false"].includes(inclure_multidisciplinaires)) {
    throw new BadRequestError("inclure_multidisciplinaires must be true or false");
  }

  const match = { classement: CLASSEMENT };
  if (discipline) match.discipline_code = discipline;
  else if (domaine) match.discipline_code = { $regex: `^${domaine}` };
  if (inclure_multidisciplinaires === "false") match.categorie = "disciplinaire";

  const [rows, disciplines] = await Promise.all([
    (await getCollection("biblio_revues_tete"))
      .find(match, { projection: { _id: 0, discipline_code: 1, categorie: 1, sjr_id: 1, titre: 1, sjr: 1 } })
      .toArray(),
    (await getCollection("biblio_disciplines"))
      .find({ classement: CLASSEMENT }, { projection: { _id: 0, discipline_code: 1, discipline_nom: 1 } })
      .toArray(),
  ]);
  const noms = new Map(disciplines.map((d) => [d.discipline_code, d.discipline_nom]));

  const revues = new Map();
  rows.forEach((row) => {
    if (!revues.has(row.sjr_id)) {
      revues.set(row.sjr_id, {
        sjr_id: row.sjr_id,
        titre: row.titre,
        sjr: row.sjr ?? null,
        multidisciplinaire: false,
        disciplines: [],
      });
    }
    const revue = revues.get(row.sjr_id);
    if (row.categorie === "multidisciplinaire") revue.multidisciplinaire = true;
    else revue.disciplines.push({ code: row.discipline_code, nom: noms.get(row.discipline_code) ?? row.discipline_code });
  });

  res.json([...revues.values()]
    .map((revue) => ({ ...revue, disciplines: revue.disciplines.sort((a, b) => a.code.localeCompare(b.code, "fr", { numeric: true })) }))
    .sort((a, b) => (b.sjr ?? -1) - (a.sjr ?? -1) || a.titre.localeCompare(b.titre, "fr")));
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

// Spécialisation disciplinaire des pays retenus (biblio_meta.pays_compares).
// Indice de spécialisation d'un pays dans une discipline = part de la discipline dans les articles du pays
// ÷ part de la discipline dans les articles mondiaux. Un article n'a qu'une discipline : les articles d'un pays,
// toutes disciplines, sont la somme de ses disciplines. Toutes les disciplines sont renvoyées, quels que soient
// la discipline ou le domaine sélectionnés : ce sont les colonnes de la carte.
// Deux vues dans la même réponse, pour que le sélecteur bascule sans requête :
//   - niveau : indice sur toute la période ;
//   - évolution : variation de l'indice entre la période de départ et la période d'arrivée (computePeriodes, comme
//     les matrices), null quand la période compte moins de deux ans.
router.route("/suivi-recherche/bibliometrie/specialisation").get(async (req, res) => {
  const { debut, fin, match } = parseFilters(req.query, { withEntite: false, withDiscipline: false });
  const meta = await (await getCollection("biblio_meta")).findOne({}, { projection: { pays_compares: 1, annees: 1 } });
  const ids = meta?.pays_compares ?? [];
  // Poids (nombre d'articles) : pas d'année provisoire à écarter
  const periodes = computePeriodes(debut, fin, meta?.annees ?? [], [], false);

  const [rows, noms, disciplines] = await Promise.all([
    (await getCollection("biblio_effectifs"))
      .aggregate([
        { $match: { ...match, entite_id: { $in: [...ids, MONDE] } } },
        {
          $group: {
            _id: { entite_id: "$entite_id", discipline_code: "$discipline_code", annee_publication: "$annee_publication" },
            nb_articles: { $sum: "$nb_articles" },
          },
        },
      ])
      .toArray(),
    (await getCollection("entites"))
      .find({ entite_id: { $in: ids } }, { projection: { _id: 0, entite_id: 1, nom: 1 } })
      .toArray(),
    (await getCollection("biblio_disciplines")).find({ classement: CLASSEMENT }, { projection: { _id: 0 } }).toArray(),
  ]);

  // Articles par entité × discipline et par entité (toutes disciplines), sommés sur les années [premiere, derniere]
  const compter = ([premiere, derniere]) => {
    const articles = new Map();
    const totaux = new Map();
    rows
      .filter((row) => row._id.annee_publication >= premiere && row._id.annee_publication <= derniere)
      .forEach(({ _id: { entite_id: id, discipline_code: code }, nb_articles: nb }) => {
        articles.set(`${id}|${code}`, (articles.get(`${id}|${code}`) ?? 0) + nb);
        totaux.set(id, (totaux.get(id) ?? 0) + nb);
      });
    return { nb: (id, code) => articles.get(`${id}|${code}`) ?? 0, total: (id) => totaux.get(id) ?? 0 };
  };
  const plage = compter([debut, fin]);
  const depart = periodes && compter(periodes.depart);
  const arrivee = periodes && compter(periodes.arrivee);

  // Part de la discipline chez l'entité et dans le monde, et leur quotient
  const specialisation = (comptes, id, code) => {
    const part = ratio(comptes.nb(id, code), comptes.total(id));
    const partMonde = ratio(comptes.nb(MONDE, code), comptes.total(MONDE));
    return { part, indice: part.valeur !== null && partMonde.valeur ? part.valeur / partMonde.valeur : null };
  };

  // Colonnes : domaines LS, PE, SH, puis numéro du panel (PE2 avant PE10)
  const colonnes = disciplines
    .sort((a, b) => DOMAINES.indexOf(a.domaine_code) - DOMAINES.indexOf(b.domaine_code)
      || Number(a.discipline_code.slice(2)) - Number(b.discipline_code.slice(2)))
    .map((discipline) => {
      const code = discipline.discipline_code;
      return {
        ...discipline,
        part_monde: ratio(plage.nb(MONDE, code), plage.total(MONDE)),
        part_monde_evolution: periodes
          ? { depart: ratio(depart.nb(MONDE, code), depart.total(MONDE)), arrivee: ratio(arrivee.nb(MONDE, code), arrivee.total(MONDE)) }
          : null,
      };
    });

  // Discipline où `valeur` est la plus forte, parmi les cellules fiables (exemple de lecture)
  const plusForte = (cellules, valeur, fiable) => cellules
    .filter((cellule) => fiable(cellule) && valeur(cellule) !== null && valeur(cellule) !== undefined)
    .reduce((best, cellule) => (!best || valeur(cellule) > valeur(best) ? cellule : best), null)?.discipline_code ?? null;

  const nomById = new Map(noms.map((item) => [item.entite_id, item.nom]));
  const pays = ids
    .filter((id) => plage.total(id))
    .map((id) => {
      const cellules = colonnes.map(({ discipline_code: code }) => {
        const niveau = specialisation(plage, id, code);
        let evolution = null;
        if (periodes) {
          const avant = specialisation(depart, id, code);
          const apres = specialisation(arrivee, id, code);
          evolution = {
            depart: avant,
            arrivee: apres,
            // Variation de l'indice, en % ; null sans indice de départ
            valeur: avant.indice && apres.indice !== null ? (apres.indice / avant.indice - 1) * 100 : null,
            // Articles les plus faibles des deux périodes, comme les matrices
            fiable: Math.min(avant.part.numerateur, apres.part.numerateur) >= SEUIL_FIABILITE,
          };
        }
        return { discipline_code: code, ...niveau, fiable: niveau.part.numerateur >= SEUIL_FIABILITE, evolution };
      });
      return {
        entite_id: id,
        nom: nomById.get(id) ?? id,
        nb_articles: plage.total(id),
        cellules,
        discipline_max: plusForte(cellules, (cellule) => cellule.indice, (cellule) => cellule.fiable),
        discipline_max_evolution: periodes
          ? plusForte(cellules, (cellule) => cellule.evolution.valeur, (cellule) => cellule.evolution.fiable)
          : null,
      };
    });

  // Pays groupés par similarité de profil (niveau), France en tête (similarite.js) : les mêmes lignes dans les deux vues
  const { ordre, groupes } = grouperProfils(
    pays.map(({ entite_id: id, nb_articles: nb, cellules }) => ({ id, nb_articles: nb, indices: cellules.map((cellule) => cellule.indice) })),
    { focusId: ENTITE_NATIONALE, nbGroupes: NB_GROUPES_PAYS },
  );
  const groupeDe = new Map(groupes.flatMap((membres, k) => membres.map((id) => [id, k + 1])));
  const paysById = new Map(pays.map((ligne) => [ligne.entite_id, ligne]));

  // Disciplines caractéristiques d'un groupe : articles des pays du groupe additionnés, puis divisés
  // (indice du groupe, jamais une moyenne d'indices) ; les plus fortes au-dessus de 1, parmi les fiables
  const disciplinesDuGroupe = (membres) => {
    const total = membres.reduce((somme, id) => somme + plage.total(id), 0);
    return colonnes
      .map(({ discipline_code: code, part_monde: partMonde }) => {
        const nb = membres.reduce((somme, id) => somme + plage.nb(id, code), 0);
        return { code, nb, indice: total && partMonde.valeur ? nb / total / partMonde.valeur : 0 };
      })
      .filter(({ nb, indice }) => nb >= SEUIL_FIABILITE && indice > 1)
      .sort((a, b) => b.indice - a.indice)
      .slice(0, NB_DISCIPLINES_GROUPE)
      .map(({ code }) => code);
  };

  res.json({
    disciplines: colonnes,
    pays: ordre.map((id) => ({ ...paysById.get(id), groupe: groupeDe.get(id) })),
    groupes: groupes.map((membres, k) => ({ numero: k + 1, pays: membres, disciplines: disciplinesDuGroupe(membres) })),
    nb_articles_monde: plage.total(MONDE),
    periode: [debut, fin],
    periodes,
    seuil_fiabilite: SEUIL_FIABILITE,
    // Bornes des échelles de couleurs, symétriques autour de 1 en logarithme ; au-delà, la couleur sature.
    // Évolution : rapport indice d'arrivée / indice de départ, de 1 / 1,5 (−33 %) à 1,5 (+50 %)
    echelles: { niveau: { min: 0.25, max: 4 }, evolution: { min: 1 / 1.5, max: 1.5 } },
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
