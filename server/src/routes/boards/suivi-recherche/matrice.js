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

// Mise en forme commune aux matrices niveau × dynamique (disciplines, établissements) :
// points représentables, quadrant, fiabilité, ordre de tracé, membres de chaque quadrant, bornes des axes, tailles de légende
// Chaque point porte `taille` (aire de la bulle : articles, lauréats…) ; `estFiable(p)` dit si sa position est fiable.
export function shapeMatrice(points, ref, cle, estFiable) {
  // Représentable : niveau d'arrivée > 0 (échelle logarithmique) et dynamique calculable
  const estRepresentable = (p) => (p.niveau.valeur ?? 0) > 0 && p.dynamique !== null;
  const exclus = points.filter((p) => !estRepresentable(p) && p.taille > 0).map(cle);
  const enrichis = points
    .filter(estRepresentable)
    .map((p) => ({
      ...p,
      quadrant: `${p.dynamique >= 0 ? "h" : "b"}${p.niveau.valeur >= ref ? "d" : "g"}`,
      fiable: estFiable(p),
    }))
    // Grosses bulles d'abord : les petites, dessinées ensuite, restent visibles par-dessus
    .sort((a, b) => b.taille - a.taille);

  // Membres de chaque quadrant, de la plus forte à la plus faible part
  const quadrants = Object.fromEntries(["hd", "hg", "bd", "bg"].map((key) => [
    key,
    enrichis.filter((p) => p.quadrant === key).sort((a, b) => b.niveau.valeur - a.niveau.valeur).map(cle),
  ]));

  // Cadre ajusté aux données (plus la référence), avec une petite marge
  const xs = [ref, ...enrichis.map((p) => p.niveau.valeur)].filter((x) => x > 0);
  const ys = [0, ...enrichis.map((p) => p.dynamique)];
  const margeY = (Math.max(...ys) - Math.min(...ys)) * 0.08 || 1;
  const tailles = enrichis.map((p) => p.taille);
  const tailleMin = tailles.length ? Math.min(...tailles) : 0;
  const tailleMax = tailles.length ? Math.max(...tailles) : 0;

  return {
    points: enrichis,
    exclus,
    quadrants,
    bornes: {
      x: xs.length ? [Math.min(...xs) / 1.3, Math.max(...xs) * 1.3] : [null, null],
      y: [Math.min(...ys) - margeY, Math.max(...ys) + margeY],
    },
    // Trois tailles de référence pour la légende : la plus petite, une intermédiaire, la plus grande
    tailles: tailles.length ? [tailleMin, Math.round(tailleMin + (tailleMax - tailleMin) / 4), tailleMax] : [],
  };
}

export function median(values) {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
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
