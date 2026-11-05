import { keepPreviousData, useQuery } from "@tanstack/react-query";

const { VITE_APP_SERVER_URL } = import.meta.env;

const BASE_URL = `${VITE_APP_SERVER_URL}/suivi-recherche/bibliometrie`;

// Entité des indicateurs au niveau national (sans ror_id)
export const ENTITE_NATIONALE = "FR";

export type Perimetre = "toutes_revues_openalex" | "revues_sjr";

export type Indicateur = "poids" | "influence" | "prestige";

export type BiblioMeta = {
  annees: number[];
  annees_influence_provisoire: number[];
  classement: string;
  date_calcul: string;
  methode: string[];
  nb_revues_tete: number;
  pays_compares: string[];
  perimetres: Perimetre[];
  revues_multidisciplinaires: string[];
  snapshot_openalex: { source: string; date: string };
  sources: string;
};

export type BiblioDiscipline = {
  discipline_code: string;
  discipline_nom: string;
  domaine_code: string;
  domaine_nom: string;
};

export type Entite = {
  categorie?: string;
  entite_id: string;
  entite_type: "monde" | "pays" | "etablissement";
  nom: string;
  ordre_selecteur?: number | null;
  recherche: string;
  sigle?: string;
  ville?: string;
};

export type Ratio = {
  denominateur: number;
  numerateur: number;
  valeur: number | null;
};

export type Indicateurs = {
  influence: Ratio;
  influence_provisoire: boolean;
  poids: Ratio;
  prestige: Ratio;
};

export type Evolution = (Indicateurs & { annee_publication: number })[];

export type Ruban = {
  // `fiable` : renvoyé par les routes dont les ratios peuvent reposer sur de petits effectifs (taux de succès ERC)
  annees: { rang: number; ratio: (Ratio & { fiable?: boolean }) | null }[];
  // Bornes [bas, haut] de chaque point, dans l'ordre de `geometrie.abscisses`
  data: [number, number][];
  entite_id: string;
  nom: string;
};

export type Etiquette = {
  entite_id: string;
  nom: string;
  valeur: number;
  y: number;
};

// Rubans d'un indicateur : noms en début et en fin de période, un ruban par pays
export type Rubans = { etiquettes: { debut: Etiquette[]; fin: Etiquette[] }; series: Ruban[] };

// Rubans déjà classés et positionnés par le serveur, pour chaque indicateur
export type Comparaison<I extends string = Indicateur> = {
  annees: number[];
  annees_provisoires: number[];
  // Abscisses [x, indice de l'année dans `annees`], communes à tous les rubans
  geometrie: { abscisses: [number, number][]; demi_colonne: number; hauteur: number };
  indicateurs: Record<I, Rubans>;
  pays: { entite_id: string; nom: string }[];
};

export type PositionnementPoint = BiblioDiscipline & {
  dynamique: number | null;
  nb_articles: number;
  niveau: Ratio;
  niveau_depart: Ratio;
};

export type QuadrantKey = "hd" | "hg" | "bd" | "bg";

// Champs communs à tout point d'une matrice niveau × dynamique, calculés par le serveur
export type MatricePoint = {
  dynamique: number | null;
  fiable: boolean;
  niveau: Ratio;
  niveau_depart: Ratio;
  quadrant: QuadrantKey;
  // Aire de la bulle : articles (bibliométrie), lauréats (financements)
  taille: number;
};

// Matrice niveau × dynamique : points représentables seulement, triés par nombre d'articles décroissant (ordre de tracé)
export type Matrice<P, I extends string = Indicateur> = {
  bornes: { x: [number | null, number | null]; y: [number, number] };
  // Clés des points non représentés (part nulle ou évolution non calculable)
  exclus: string[];
  indicateur: I;
  periodes: { depart: [number, number]; arrivee: [number, number] };
  points: (P & MatricePoint)[];
  provisoire: boolean;
  // Clés des points de chaque quadrant, de la plus forte à la plus faible part
  quadrants: Record<QuadrantKey, string[]>;
  reference: { valeur: number | null };
  seuil_fiabilite: number;
  tailles: number[];
};

// Un point par discipline de l'entité ; référence : part de l'entité toutes disciplines
export type Positionnement = Matrice<PositionnementPoint> & { reference: Ratio };

export type EtablissementPoint = {
  categorie: string;
  entite_id: string;
  // Établissement sélectionné, mis en avant
  focus: boolean;
  nom: string;
  sigle: string | null;
};

export type GroupeEtablissements = { code: string; libelle: string; nb: number };

// Un point par établissement du groupe ; référence : médiane des parts des établissements représentés
export type PositionnementEtablissements = Matrice<EtablissementPoint> & {
  groupe: string;
  // Groupe de l'établissement sélectionné (null pour la France)
  groupe_selection: string | null;
  groupes: GroupeEtablissements[];
};

// Sélection commune aux onglets (bibliométrie, financements, innovation)
export type Selection = {
  anneeDebut: number;
  anneeFin: number;
  disciplineCode?: string;
  domaineCode?: string;
  entiteId: string;
};

// Options de calcul propres à la bibliométrie
export type BiblioOptions = {
  inclureMultidisciplinaires: boolean;
  perimetre: Perimetre;
};

// Une réponse en erreur fait passer la requête en état d'erreur, avec son statut
export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

// Noms des paramètres : plugins/tableaux/reference/url-parameters.md (mêmes noms que l'URL de la page ; ror_id absent = France)
function toSearchParams(selection: Selection, options: BiblioOptions, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({
    inclure_multidisciplinaires: String(options.inclureMultidisciplinaires),
    perimetre: options.perimetre,
    year_max: String(selection.anneeFin),
    year_min: String(selection.anneeDebut),
    ...extra,
  });
  if (selection.entiteId !== ENTITE_NATIONALE) params.set("ror_id", selection.entiteId);
  if (selection.disciplineCode) params.set("discipline", selection.disciplineCode);
  if (selection.domaineCode) params.set("domaine", selection.domaineCode);
  return params;
}

function filtersKey(selection: Selection, options: BiblioOptions) {
  return [
    selection.entiteId,
    selection.anneeDebut,
    selection.anneeFin,
    selection.disciplineCode ?? null,
    selection.domaineCode ?? null,
    options.perimetre,
    options.inclureMultidisciplinaires,
  ];
}

export const useBiblioMeta = () =>
  useQuery({
    queryKey: ["suivi-recherche", "bibliometrie", "meta"],
    queryFn: () => fetchJson<BiblioMeta>(`${BASE_URL}/meta`),
  });

export const useBiblioDisciplines = () =>
  useQuery({
    queryKey: ["suivi-recherche", "bibliometrie", "disciplines"],
    queryFn: () => fetchJson<BiblioDiscipline[]>(`${BASE_URL}/disciplines`),
  });

export const useBiblioEntites = () =>
  useQuery({
    queryKey: ["suivi-recherche", "bibliometrie", "entites"],
    queryFn: () => fetchJson<Entite[]>(`${BASE_URL}/entites`),
  });

export const useBiblioIndicateurs = (selection: Selection, options: BiblioOptions) =>
  useQuery({
    queryKey: ["suivi-recherche", "bibliometrie", "indicateurs", ...filtersKey(selection, options)],
    queryFn: () => fetchJson<Indicateurs & { nb_articles: number }>(`${BASE_URL}/indicateurs?${toSearchParams(selection, options)}`),
    placeholderData: keepPreviousData,
  });

export const useBiblioEvolution = (selection: Selection, options: BiblioOptions) =>
  useQuery({
    queryKey: ["suivi-recherche", "bibliometrie", "evolution", ...filtersKey(selection, options)],
    queryFn: () => fetchJson<Evolution>(`${BASE_URL}/evolution?${toSearchParams(selection, options)}`),
    placeholderData: keepPreviousData,
  });

// La comparaison porte sur les pays : l'entité sélectionnée n'entre pas dans la clé.
// Les trois indicateurs sont dans la même réponse : en changer ne relance pas de requête.
export const useBiblioComparaison = (selection: Selection, options: BiblioOptions) =>
  useQuery({
    queryKey: ["suivi-recherche", "bibliometrie", "comparaison", ...filtersKey({ ...selection, entiteId: "" }, options)],
    queryFn: () => fetchJson<Comparaison>(`${BASE_URL}/comparaison-internationale?${toSearchParams(selection, options)}`),
    placeholderData: keepPreviousData,
  });

// Les points sont les disciplines : la discipline sélectionnée n'entre pas dans la clé
export const useBiblioPositionnement = (selection: Selection, options: BiblioOptions, indicateur: Indicateur) =>
  useQuery({
    queryKey: [
      "suivi-recherche", "bibliometrie", "positionnement", indicateur,
      ...filtersKey({ ...selection, disciplineCode: undefined, domaineCode: undefined }, options),
    ],
    queryFn: () => fetchJson<Positionnement>(
      `${BASE_URL}/positionnement?${toSearchParams({ ...selection, disciplineCode: undefined, domaineCode: undefined }, options, { indicateur })}`,
    ),
    placeholderData: keepPreviousData,
  });

// Les points sont les établissements d'un groupe : la discipline sélectionnée s'applique.
// Sans groupe, le serveur choisit celui de l'établissement sélectionné (ou les universités).
export const useBiblioPositionnementEtablissements = (
  selection: Selection,
  options: BiblioOptions,
  indicateur: Indicateur,
  groupe?: string,
) =>
  useQuery({
    queryKey: ["suivi-recherche", "bibliometrie", "positionnement-etablissements", indicateur, groupe ?? null, ...filtersKey(selection, options)],
    queryFn: () => fetchJson<PositionnementEtablissements>(
      `${BASE_URL}/positionnement-etablissements?${toSearchParams(selection, options, { indicateur, ...(groupe && { groupe }) })}`,
    ),
    placeholderData: keepPreviousData,
  });
