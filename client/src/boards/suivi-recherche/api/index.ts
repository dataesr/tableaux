import { keepPreviousData, useQuery } from "@tanstack/react-query";

const { VITE_APP_SERVER_URL } = import.meta.env;

const BASE_URL = `${VITE_APP_SERVER_URL}/suivi-recherche/bibliometrie`;

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

export type ComparaisonRow = Indicateurs & {
  annee_publication: number;
  entite_id: string;
  nom: string;
};

export type PositionnementPoint = BiblioDiscipline & {
  dynamique: number | null;
  nb_articles: number;
  niveau: Ratio;
  niveau_depart: Ratio;
};

export type Positionnement = {
  indicateur: Indicateur;
  periodes: { depart: [number, number]; arrivee: [number, number] };
  points: PositionnementPoint[];
  provisoire: boolean;
  reference: Ratio;
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
async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}`);
  }
  return response.json();
}

function toSearchParams(selection: Selection, options: BiblioOptions, extra: Record<string, string> = {}) {
  const params = new URLSearchParams({
    annee_debut: String(selection.anneeDebut),
    annee_fin: String(selection.anneeFin),
    entite_id: selection.entiteId,
    inclure_multidisciplinaires: String(options.inclureMultidisciplinaires),
    perimetre: options.perimetre,
    ...extra,
  });
  if (selection.disciplineCode) params.set("discipline_code", selection.disciplineCode);
  if (selection.domaineCode) params.set("domaine_code", selection.domaineCode);
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
    queryFn: () => fetchJson<(Indicateurs & { annee_publication: number })[]>(`${BASE_URL}/evolution?${toSearchParams(selection, options)}`),
    placeholderData: keepPreviousData,
  });

// La comparaison porte sur les pays : l'entité sélectionnée n'entre pas dans la clé
export const useBiblioComparaison = (selection: Selection, options: BiblioOptions) =>
  useQuery({
    queryKey: ["suivi-recherche", "bibliometrie", "comparaison", ...filtersKey({ ...selection, entiteId: "" }, options)],
    queryFn: () => fetchJson<ComparaisonRow[]>(`${BASE_URL}/comparaison-internationale?${toSearchParams(selection, options)}`),
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
