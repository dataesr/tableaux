// Sources des graphiques, sous la forme que le client passe à ChartWrapper (config.sources) : libellé, lien public
// (null pour un jeu non public) et date de mise à jour. Construites à partir des champs structurés des collections
// *_meta d'athena (jeux, dates d'extraction), et non de leur texte libre `sources`.
const ODS = "https://data.enseignementsup-recherche.gouv.fr/explore/dataset";
const PAYSAGE = { libelle: "Paysage", url: "https://paysage.enseignementsup-recherche.gouv.fr", date: null };

// Publications : OpenAlex (date du snapshot) et SCImago Journal Rank (revues classées)
export function getSourcesBibliometrie(meta) {
  return [
    { libelle: "OpenAlex", url: "https://openalex.org", date: meta?.snapshot_openalex?.date ?? null },
    { libelle: "SCImago Journal Rank", url: "https://www.scimagojr.com", date: null },
  ];
}

// ERC : participants aux projets Horizon Europe (open data) et propositions évaluées (jeu non public) ;
// rattachement des structures par Paysage et ROR
export function getSourcesErc(meta) {
  const date = meta.source?.date_extraction ?? null;
  return [
    { libelle: "Horizon Europe, participants aux projets (open data ESR)", url: `${ODS}/${meta.source.laureats}/`, date },
    { libelle: "Horizon Europe, propositions évaluées (jeu ESR non public)", url: null, date },
    PAYSAGE,
    { libelle: "ROR", url: "https://ror.org", date: null },
  ];
}

// Prix : lauréats recensés dans Paysage (jeu non public) ; rattachement par Paysage, RNSR (scanR) et OpenAlex
export function getSourcesPrix(meta) {
  return [
    { libelle: "Lauréats des prix recensés dans Paysage (jeu ESR non public)", url: null, date: meta.source?.date_extraction ?? null },
    PAYSAGE,
    { libelle: "RNSR (scanR)", url: "https://scanr.enseignementsup-recherche.gouv.fr", date: null },
    { libelle: "OpenAlex", url: "https://openalex.org", date: null },
  ];
}
