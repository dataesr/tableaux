import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { ENTITE_NATIONALE, fetchJson } from "./index.ts";
import type { Comparaison, GroupeEtablissements, Matrice, Ratio, Rubans, Selection, SourceDonnees } from "./index.ts";

const { VITE_APP_SERVER_URL } = import.meta.env;

const BASE_URL = `${VITE_APP_SERVER_URL}/suivi-recherche/financements/erc`;

export type TypeBourse = {
  avec_panel: boolean;
  code: string;
  libelle: string;
  principal: boolean;
};

// Comptage en projets (défaut) ou en porteurs (PI) : ne diffère que pour les Synergy Grants (2 à 4 porteurs par projet)
export type Comptage = "projets" | "pi";
export const COMPTAGE_DEFAUT: Comptage = "projets";

// Vivier de candidats de l'indice de candidature : articles du top 10 % des plus cités (défaut) ou tous les articles
export type Vivier = "top10" | "articles";
export const VIVIERS: Vivier[] = ["top10", "articles"];
export const VIVIER_DEFAUT: Vivier = "top10";

export type ErcMeta = {
  annees: number[];
  annees_provisoires: number[];
  methode: string[];
  // Méthode de l'indice de candidature, calculé par le tableau (route meta)
  methode_indice: string[];
  // Champs d'erc_effectifs [candidatures, lauréats] de chaque mode, lus par le serveur
  modes_comptage: Record<Comptage, [string, string]>;
  pays_compares: string[];
  sources: SourceDonnees[];
  // Vivier de l'indice de candidature : OpenAlex et SJR
  sources_indice: SourceDonnees[];
  types_bourse: TypeBourse[];
  types_bourse_defaut: string[];
};

// Paramètres de calcul du bloc ERC, dans l'URL (type_bourse, comptage)
export type ErcOptions = {
  comptage: Comptage;
  types: string[];
  vivier: Vivier;
};

// Taux / taux attendu : numérateur et dénominateur sont des taux (null sans candidature)
export type RatioTaux = { valeur: number | null; numerateur: number | null; denominateur: number | null };

// Indices calculés par le serveur (erc-indice.js), sur les types avec panel, par rapport aux pays de référence (UE).
// candidature : candidatures / candidatures attendues ; laureats : lauréats / lauréats attendus ;
// reussite : taux de succès / taux attendu ; laureats = candidature × reussite.
export type ErcIndices = {
  // Au moins `seuil_fiabilite` candidatures attendues
  fiable: boolean;
  candidature: Ratio;
  laureats: Ratio;
  reussite: RatioTaux;
  taux_succes: Ratio;
};

// Contexte de calcul des indices : pays de référence, types avec panel retenus, vivier
export type ErcIndicesContexte = {
  pays_reference: string[];
  types_indice: string[];
  vivier: Vivier;
};

// Part des lauréats > part des candidatures : l'entité réussit mieux que la moyenne.
// En mode pi, nb_candidatures et nb_laureats comptent des porteurs.
export type ErcIndicateurs = {
  // Au moins `seuil_fiabilite` candidatures : en dessous, le taux et les parts sont signalés comme peu fiables
  fiable: boolean;
  nb_candidatures: number;
  nb_laureats: number;
  part_candidatures: Ratio;
  part_laureats: Ratio;
  taux_succes: Ratio;
  taux_succes_reference: Ratio;
  // Établissement sélectionné : taux de succès de la France, seconde référence ; null quand l'entité est la France
  taux_succes_france: Ratio | null;
};

// `periode` : années d'appel retenues, null si la période choisie n'en contient aucune
// `comptage` : mode des effectifs renvoyés, pour libeller les données affichées et non celles demandées
export type ErcIndicateursPeriode =
  | { comptage: Comptage; periode: null }
  | (ErcIndicateurs & {
    annees_provisoires: number[];
    comptage: Comptage;
    // null si aucun type avec panel n'est retenu (Synergy ou Proof of Concept seuls)
    indices: (ErcIndices & ErcIndicesContexte & { vivier_provisoire: boolean }) | null;
    periode: [number, number];
    seuil_fiabilite: number;
  });

export type ErcEvolution = {
  annees: (ErcIndicateurs & {
    annee_appel: number;
    indices: (ErcIndices & { vivier_provisoire: boolean }) | null;
    provisoire: boolean;
  })[];
  comptage: Comptage;
  indices: ErcIndicesContexte | null;
  periode: [number, number] | null;
  seuil_fiabilite?: number;
};

// Noms des paramètres : plugins/tableaux/reference/url-parameters.md (ror_id absent = France).
// La période est celle de la sélection ; le serveur la ramène aux années d'appel disponibles.
// France et autres pays : rubans par indicateur (l'indice manque sans type avec panel) et rangs de la France
export type IndicateurPays = "part_laureats" | "part_candidatures" | "taux_succes" | "indice_candidature";
export type RatioFiable = Ratio & { fiable?: boolean };
export type RangErc = { nb: number; rang: number | null; ratio: RatioFiable | null };
export type ErcComparaison =
  | { comptage: Comptage; periode: null }
  | (Omit<Comparaison<IndicateurPays>, "indicateurs" | "pays"> & Partial<ErcIndicesContexte> & {
    comptage: Comptage;
    france: Partial<Record<IndicateurPays, RangErc>>;
    indicateurs: Partial<Record<IndicateurPays, Rubans>>;
    pays: { entite_id: string; nom: string; reference: boolean }[];
    periode: [number, number];
    seuil_fiabilite: number;
    vivier_provisoire: boolean;
  });

// Établissements : matrice niveau × dynamique d'un groupe comparable, et rangs de l'établissement choisi
export type IndicateurMatrice = "part_laureats" | "taux_succes";
export type ErcEtablissementPoint = {
  categorie: string;
  entite_id: string;
  focus: boolean;
  nb_candidatures: number;
  nb_laureats: number;
  nom: string;
  sigle: string | null;
};
export type ClassementErc = {
  nb_candidatures: number;
  nb_laureats: number;
  part_laureats: RangErc;
  // Classé parmi les établissements d'au moins `seuil_taux` candidatures
  taux_succes: RangErc & { fiable: boolean };
};
type ErcPositionnementContexte = {
  comptage: Comptage;
  groupe: string;
  // Groupe de l'établissement sélectionné (null pour la France)
  groupe_selection: string | null;
  groupes: GroupeEtablissements[];
  indicateur: IndicateurMatrice;
};
export type ErcPositionnementMatrice = ErcPositionnementContexte & Matrice<ErcEtablissementPoint, IndicateurMatrice> & {
  annees_provisoires: number[];
  classement: ClassementErc | null;
  periode: [number, number];
  // Taux de succès de la France sur la période d'arrivée (indicateur taux_succes seulement)
  taux_france: Ratio | null;
  seuil_taux: number;
  seuil_unite: string;
};
// `periodes` null : moins de deux années d'appel consolidées dans la période choisie
export type ErcPositionnement = (ErcPositionnementContexte & { periodes: null }) | ErcPositionnementMatrice;

function toSearchParams(selection: Selection, { comptage, types, vivier }: ErcOptions) {
  const params = new URLSearchParams({
    comptage,
    type_bourse: types.join(","),
    vivier,
    year_max: String(selection.anneeFin),
    year_min: String(selection.anneeDebut),
  });
  if (selection.entiteId !== ENTITE_NATIONALE) params.set("ror_id", selection.entiteId);
  if (selection.disciplineCode) params.set("discipline", selection.disciplineCode);
  if (selection.domaineCode) params.set("domaine", selection.domaineCode);
  return params;
}

function filtersKey(selection: Selection, { comptage, types, vivier }: ErcOptions) {
  return [
    selection.entiteId,
    selection.anneeDebut,
    selection.anneeFin,
    selection.disciplineCode ?? null,
    selection.domaineCode ?? null,
    types.join(","),
    comptage,
    vivier,
  ];
}

export const useErcMeta = () =>
  useQuery({
    queryKey: ["suivi-recherche", "erc", "meta"],
    queryFn: () => fetchJson<ErcMeta>(`${BASE_URL}/meta`),
  });

export const useErcIndicateurs = (selection: Selection, options: ErcOptions) =>
  useQuery({
    queryKey: ["suivi-recherche", "erc", "indicateurs", ...filtersKey(selection, options)],
    queryFn: () => fetchJson<ErcIndicateursPeriode>(`${BASE_URL}/indicateurs?${toSearchParams(selection, options)}`),
    placeholderData: keepPreviousData,
  });

// Tous les indicateurs de chaque année sont dans la réponse : changer d'indicateur ne relance pas de requête
export const useErcEvolution = (selection: Selection, options: ErcOptions) =>
  useQuery({
    queryKey: ["suivi-recherche", "erc", "evolution", ...filtersKey(selection, options)],
    queryFn: () => fetchJson<ErcEvolution>(`${BASE_URL}/evolution?${toSearchParams(selection, options)}`),
    placeholderData: keepPreviousData,
  });

// La sélection d'établissement ne s'applique pas (ror_id ignoré par le serveur)
export const useErcComparaison = (selection: Selection, options: ErcOptions) =>
  useQuery({
    queryKey: ["suivi-recherche", "erc", "comparaison", ...filtersKey({ ...selection, entiteId: ENTITE_NATIONALE }, options)],
    queryFn: () => fetchJson<ErcComparaison>(
      `${BASE_URL}/comparaison-internationale?${toSearchParams({ ...selection, entiteId: ENTITE_NATIONALE }, options)}`,
    ),
    placeholderData: keepPreviousData,
  });

// Sans groupe : celui de l'établissement sélectionné, sinon les universités (choix du serveur).
// `enabled` : faux quand le bloc ERC est masqué (paramètre `dispositif`)
export const useErcPositionnement = (selection: Selection, options: ErcOptions, indicateur: IndicateurMatrice, groupe?: string, enabled = true) =>
  useQuery({
    enabled,
    queryKey: ["suivi-recherche", "erc", "positionnement-etablissements", indicateur, groupe ?? null, ...filtersKey(selection, options)],
    queryFn: () => {
      const params = toSearchParams(selection, options);
      params.set("indicateur", indicateur);
      if (groupe) params.set("groupe", groupe);
      return fetchJson<ErcPositionnement>(`${BASE_URL}/positionnement-etablissements?${params}`);
    },
    placeholderData: keepPreviousData,
  });
