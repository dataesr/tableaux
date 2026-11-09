// Matrices niveau × dynamique communes à la bibliométrie et aux financements (ERC)

// Périodes de départ et d'arrivée d'une matrice : jusqu'à 3 années à chaque bout ; années consolidées si possible
export function computePeriodes(debut, fin, annees, provisoires, consolidees) {
  let ans = annees.filter((annee) => annee >= debut && annee <= fin);
  if (consolidees) {
    const stables = ans.filter((annee) => !provisoires.includes(annee));
    if (stables.length >= 2) ans = stables;
  }
  if (ans.length < 2) return null;
  const k = Math.max(1, Math.min(3, Math.floor(ans.length / 2)));
  return { depart: [ans[0], ans[k - 1]], arrivee: [ans[ans.length - k], ans[ans.length - 1]] };
}

// Représentable : niveau d'arrivée > 0 (échelle logarithmique) et dynamique calculable
const estRepresentable = (p) => (p.niveau.valeur ?? 0) > 0 && p.dynamique !== null;

// Point du milieu une fois les points triés sur `valeur` : autant de points en dessous que de points au-dessus ou dessus.
// C'est la valeur d'un point réel (pas une moyenne de deux parts), que la page affiche avec son calcul.
function getPointMedian(points, valeur) {
  if (points.length === 0) return null;
  return [...points].sort((a, b) => valeur(a) - valeur(b))[Math.floor(points.length / 2)];
}

// Références d'une matrice d'établissements : médianes du groupe sur les deux axes, pour que les établissements se
// répartissent à parts égales de chaque côté de chaque ligne. `point` : clé du point qui porte la médiane.
export function getReferencesMedianes(points, cle) {
  const representables = points.filter(estRepresentable);
  const niveau = getPointMedian(representables, (p) => p.niveau.valeur);
  const dynamique = getPointMedian(representables, (p) => p.dynamique);
  return {
    niveau: { libelle: "Médiane du groupe", valeur: niveau?.niveau.valeur ?? null, point: niveau ? cle(niveau) : null },
    dynamique: { libelle: "Évolution médiane du groupe", valeur: dynamique?.dynamique ?? null, point: dynamique ? cle(dynamique) : null },
  };
}

// Bornes au-delà desquelles une valeur est très éloignée des autres : quartiles ∓ 3 écarts interquartiles
function getBornesTukey(valeurs) {
  if (valeurs.length < 4) return [-Infinity, Infinity];
  const tries = [...valeurs].sort((a, b) => a - b);
  const quartile = (q) => tries[Math.floor(q * (tries.length - 1))];
  const ecart = quartile(0.75) - quartile(0.25);
  return [quartile(0.25) - 3 * ecart, quartile(0.75) + 3 * ecart];
}

// Mise en forme commune aux matrices niveau × dynamique (disciplines, établissements) :
// points représentables, quadrant, position par rapport au repère international, fiabilité, ordre de tracé,
// membres de chaque quadrant, bornes des axes, tailles de légende.
// `references` : `niveau` et `dynamique` coupent les quadrants ({ libelle, valeur, point? | ratio? }) ; `international`,
// facultatif, est une seconde ligne horizontale qui ne les coupe pas : { libelle, valeur, au_dessus, en_dessous, base },
// où `base` donne les ratios de départ et d'arrivée de ce à quoi le point se compare (France dans le monde, tous pays). Chaque point porte `taille` (aire de la bulle : articles, lauréats…) ;
// `estFiable(p)` dit si sa position est fiable.
export function shapeMatrice(points, { niveau, dynamique, international = null }, cle, estFiable) {
  const refX = niveau.valeur ?? 0;
  const refY = dynamique.valeur ?? 0;
  const exclus = points.filter((p) => !estRepresentable(p) && p.taille > 0).map(cle);
  const enrichis = points
    .filter(estRepresentable)
    .map((p) => ({
      ...p,
      quadrant: `${p.dynamique >= refY ? "h" : "b"}${p.niveau.valeur >= refX ? "d" : "g"}`,
      international: international ? p.dynamique >= international.valeur : null,
      fiable: estFiable(p),
    }))
    // Grosses bulles d'abord : les petites, dessinées ensuite, restent visibles par-dessus
    .sort((a, b) => b.taille - a.taille);

  // Membres de chaque quadrant, de la plus forte à la plus faible part
  const quadrants = Object.fromEntries(["hd", "hg", "bd", "bg"].map((key) => [
    key,
    enrichis.filter((p) => p.quadrant === key).sort((a, b) => b.niveau.valeur - a.niveau.valeur).map(cle),
  ]));

  // Cadre ajusté aux données et aux lignes de référence, avec une petite marge. En hauteur, une évolution peu fiable
  // et très éloignée des autres (au-delà de 3 écarts interquartiles, règle de Tukey : +700 % sur quelques articles)
  // n'entre pas dans le cadre, sinon elle écraserait tous les autres points ; elle est posée sur le bord (`hors_cadre`),
  // sa valeur exacte restant dans l'infobulle et les tableaux. Une évolution fiable entre toujours dans le cadre.
  const xs = [refX, ...enrichis.map((p) => p.niveau.valeur)].filter((x) => x > 0);
  const [bas, haut] = getBornesTukey(enrichis.map((p) => p.dynamique));
  const dansLeCadre = enrichis.filter((p) => p.fiable || (p.dynamique >= bas && p.dynamique <= haut));
  const ys = [refY, ...(international ? [international.valeur] : []), ...dansLeCadre.map((p) => p.dynamique)];
  const margeY = (Math.max(...ys) - Math.min(...ys)) * 0.08 || 1;
  const bornesY = [Math.min(...ys) - margeY, Math.max(...ys) + margeY];
  enrichis.forEach((p) => {
    p.hors_cadre = p.dynamique > bornesY[1] ? "haut" : p.dynamique < bornesY[0] ? "bas" : null;
  });
  const tailles = enrichis.map((p) => p.taille);
  const tailleMin = tailles.length ? Math.min(...tailles) : 0;
  const tailleMax = tailles.length ? Math.max(...tailles) : 0;

  return {
    points: enrichis,
    exclus,
    quadrants,
    references: {
      niveau,
      dynamique,
      international: international && {
        ...international,
        // Évolution relative de la base (France dans le monde, taux de l'ensemble de l'ERC), citée par la page
        base: { ...international.base, dynamique: (international.base.arrivee.valeur / international.base.depart.valeur - 1) * 100 },
        nb_au_dessus: enrichis.filter((p) => p.international).length,
        nb_en_dessous: enrichis.filter((p) => !p.international).length,
      },
    },
    bornes: {
      x: xs.length ? [Math.min(...xs) / 1.3, Math.max(...xs) * 1.3] : [null, null],
      y: bornesY,
    },
    // Trois tailles de référence pour la légende : la plus petite, une intermédiaire, la plus grande
    tailles: tailles.length ? [tailleMin, Math.round(tailleMin + (tailleMax - tailleMin) / 4), tailleMax] : [],
  };
}

// Regroupement des catégories d'établissements pour la matrice : on compare des établissements comparables
export const GROUPES_ETABLISSEMENTS = [
  { code: "universites", libelle: "Universités", categories: ["Université", "Établissement public expérimental", "Communauté d'universités et établissements"] },
  { code: "organismes", libelle: "Organismes de recherche", categories: ["Organisme de recherche"] },
  { code: "sante", libelle: "Établissements de santé", categories: ["Centre hospitalier", "Centre de lutte contre le cancer", "Institut hospitalo-universitaire"] },
  { code: "ecoles-ingenieurs", libelle: "Écoles d'ingénieurs", categories: ["École d'ingénieurs", "École nationale supérieure d'ingénieurs", "Institut national polytechnique"] },
  {
    code: "grands-etablissements",
    libelle: "Grands établissements, ENS et instituts",
    categories: ["Grand établissement", "Grand établissement relevant d'un autre département ministériel", "École normale supérieure", "Institut ou école extérieur aux universités"],
  },
  { code: "commerce-iep", libelle: "Écoles de commerce et IEP", categories: ["École de commerce et de management", "Institut d'étude politique"] },
  {
    code: "prive",
    libelle: "Établissements privés",
    categories: ["Établissement d'enseignement supérieur privé d'intérêt général", "Établissement privé d'enseignement universitaire", "Établissement d'enseignement supérieur privé rattachés à un EPSCP"],
  },
];
export const GROUPE_AUTRES = { code: "autres", libelle: "Autres établissements" };
export const GROUPE_PAR_DEFAUT = "universites";
export const groupeOf = (categorie) => GROUPES_ETABLISSEMENTS.find((groupe) => groupe.categories.includes(categorie))?.code ?? GROUPE_AUTRES.code;

// Établissements comparables pour une matrice : groupe demandé, sinon celui de l'établissement sélectionné,
// sinon les universités. `entites` : collection des entités (établissements du sélecteur seulement).
export async function loadGroupeEtablissements(entites, selectionId, groupeDemande) {
  const etablissements = (await entites
    .find({ selecteur: true, entite_type: "etablissement" }, { projection: { _id: 0, entite_id: 1, nom: 1, sigle: 1, categorie: 1, groupe_etablissement: 1 } })
    .toArray())
    .map(({ groupe_etablissement, ...etablissement }) => ({ ...etablissement, groupe: groupe_etablissement ?? groupeOf(etablissement.categorie) }));
  const groupeSelection = etablissements.find(({ entite_id: id }) => id === selectionId)?.groupe ?? null;
  const groupe = groupeDemande ?? groupeSelection ?? GROUPE_PAR_DEFAUT;
  return {
    groupe,
    groupeSelection,
    membres: etablissements.filter((etablissement) => etablissement.groupe === groupe),
    groupes: [...GROUPES_ETABLISSEMENTS, GROUPE_AUTRES]
      .map(({ code, libelle }) => ({ code, libelle, nb: etablissements.filter((etablissement) => etablissement.groupe === code).length }))
      .filter(({ nb }) => nb > 0),
  };
}

export const CODES_GROUPES = [...GROUPES_ETABLISSEMENTS, GROUPE_AUTRES].map(({ code }) => code);
