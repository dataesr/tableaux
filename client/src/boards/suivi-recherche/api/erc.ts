import { keepPreviousData, useQuery } from "@tanstack/react-query";

import { ENTITE_NATIONALE, fetchJson } from "./index.ts";
import type { BiblioDiscipline, Comparaison, GroupeEtablissements, QuadrantKey, Ratio, Rubans, Selection, SourceDonnees } from "./index.ts";

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

// Dénominateur du taux de candidature au vivier : tous les chercheurs actifs (défaut) ou les chercheurs top 10 %
export type Vivier = "actifs" | "top10";
export const VIVIERS: Vivier[] = ["actifs", "top10"];
export const VIVIER_DEFAUT: Vivier = "actifs";

export type ErcMeta = {
  annees: number[];
  annees_provisoires: number[];
  methode: string[];
  // Champs d'erc_effectifs [candidatures, lauréats] de chaque mode, lus par le serveur
  modes_comptage: Record<Comptage, [string, string]>;
  pays_compares: string[];
  sources: SourceDonnees[];
  types_bourse: TypeBourse[];
  types_bourse_defaut: string[];
  // Viviers de chercheurs (athena) : null tant qu'ils ne sont pas activés dans l'administration du tableau.
  // `periode` : articles sur lesquels le vivier est mesuré, une seule fois ; seuls les appels de cette période s'y rapportent
  vivier: { annee_debut_recente: number; methode: string[]; periode: [number, number]; sources: SourceDonnees[] } | null;
};

// Paramètres de calcul du bloc ERC, dans l'URL (type_bourse, comptage)
export type ErcOptions = {
  comptage: Comptage;
  types: string[];
  vivier: Vivier;
};

// Candidatures par an pour 1 000 chercheurs du vivier : valeur = numerateur (candidatures) ÷ nb_annees ÷ denominateur
// (chercheurs) × 1 000. `fiable` : au moins `seuil_fiabilite` candidatures.
export type TauxVivier = Ratio & { fiable: boolean; nb_annees: number };

// Pourquoi le taux n'est pas calculable : viviers non activés, aucun type avec panel retenu, aucun appel de la période
// choisie dans la période du vivier
export type VivierIndisponible = { indisponible: "vivier" | "types" | "periode"; periode_vivier?: [number, number] };

// Contexte du taux : appels retenus (période choisie ∩ période du vivier), types avec panel, dénominateur
export type VivierContexte = {
  indisponible: null;
  appels: [number, number];
  appels_provisoires: number[];
  nb_annees: number;
  periode_vivier: [number, number];
  types: string[];
  vivier: Vivier;
  // Chercheurs top 10 % : le top 10 % des articles récents n'est pas définitif
  vivier_provisoire: boolean;
};

// Taux de l'entité et ses références, sur des années d'appel (la période ou une année)
export type ErcVivierTaux = {
  // Établissement sélectionné : la France, seconde référence ; null quand l'entité est la France
  france: TauxVivier | null;
  nb_pays_reference: number;
  // Ensemble des pays comparés
  reference: TauxVivier;
  taux: TauxVivier;
};
export type ErcVivierEntite = VivierContexte & ErcVivierTaux;

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
    periode: [number, number];
    seuil_fiabilite: number;
    vivier: ErcVivierEntite | VivierIndisponible;
  });

export type ErcEvolution = {
  annees: (ErcIndicateurs & {
    annee_appel: number;
    // Part de l'entité dans les effectifs de son ensemble (`ensemble`), sur l'année
    part_ensemble: { candidatures: Ratio; laureats: Ratio };
    provisoire: boolean;
    // Candidatures de l'année ÷ vivier fixe ; null hors des appels de la période du vivier
    vivier: ErcVivierTaux | null;
  })[];
  // Ensemble des parts `part_ensemble` : la France pour un établissement, l'ensemble de l'ERC pour la France.
  // Absent quand la période ne contient aucun appel.
  ensemble?: "erc" | "france";
  comptage: Comptage;
  periode: [number, number] | null;
  seuil_fiabilite?: number;
  vivier?: VivierContexte | VivierIndisponible;
};

// Noms des paramètres : plugins/tableaux/reference/url-parameters.md (ror_id absent = France).
// La période est celle de la sélection ; le serveur la ramène aux années d'appel disponibles.
// France et autres pays : rubans par indicateur et rangs de la France
export type IndicateurPays = "part_laureats" | "part_candidatures" | "taux_succes";
export type RatioFiable = Ratio & { fiable?: boolean };
export type RangErc = { nb: number; rang: number | null; ratio: RatioFiable | null };
export type ErcComparaison =
  | { comptage: Comptage; periode: null }
  | (Omit<Comparaison<IndicateurPays>, "indicateurs" | "pays"> & {
    comptage: Comptage;
    france: Partial<Record<IndicateurPays, RangErc>>;
    indicateurs: Partial<Record<IndicateurPays, Rubans>>;
    pays: { entite_id: string; nom: string }[];
    periode: [number, number];
    seuil_fiabilite: number;
    vivier: ErcVivierRubans | VivierIndisponible;
  });

// Rubans du taux de candidature au vivier, sur leurs propres années (appels de la période du vivier) et leurs propres pays
// (pays comparés présents dans le vivier). Un ruban par an : candidatures de l'année ÷ vivier fixe.
// `france` et `reference` : sur tous les appels retenus.
export type ErcVivierRubans = VivierContexte & Pick<Comparaison, "annees" | "geometrie" | "pays"> & {
  france: { nb: number; rang: number | null; ratio: TauxVivier };
  reference: TauxVivier;
  rubans: Rubans;
};

// Nuage à quadrants taux de candidature au vivier × taux de succès, coupé aux médianes des points
// (établissements d'un groupe ou disciplines d'une entité)
export type NuageReference = { libelle: string; point: string | null; valeur: number | null };
export type NuageVivierPoint = {
  candidature: TauxVivier;
  fiable: boolean;
  // Taux de succès peu fiable hors du cadre, posé sur le bord haut ou bas ; null dans le cadre
  hors_cadre: "haut" | "bas" | null;
  nb_chercheurs: number;
  quadrant: QuadrantKey;
  succes: Ratio;
  // Lauréats (aire de la bulle)
  taille: number;
};
export type NuageVivier<P extends NuageVivierPoint> = VivierContexte & {
  bornes: { x: [number | null, number | null]; y: [number, number] };
  comptage: Comptage;
  // Clés des points non représentés : aucune candidature ou aucun chercheur dans le vivier
  exclus: string[];
  points: P[];
  // Clés des points de chaque quadrant
  quadrants: Record<QuadrantKey, string[]>;
  references: { candidature: NuageReference; succes: NuageReference };
  seuil_fiabilite: number;
  tailles: number[];
};

export type ErcVivierPoint = NuageVivierPoint & {
  categorie: string;
  entite_id: string;
  focus: boolean;
  nom: string;
  sigle: string | null;
};
export type ErcVivierNuage = NuageVivier<ErcVivierPoint> & {
  // Rang de l'établissement choisi sur le taux de candidature au vivier
  classement: { nb: number; point: ErcVivierPoint; rang: number } | null;
  france: { candidature: TauxVivier; succes: Ratio };
};

// Disciplines (panels ERC) de l'entité ; `entite` : l'entité toutes disciplines
export type ErcDisciplinePoint = NuageVivierPoint & BiblioDiscipline;
export type ErcVivierDisciplines =
  | { comptage: Comptage; periode: null }
  | {
    comptage: Comptage;
    periode: [number, number];
    vivier: (NuageVivier<ErcDisciplinePoint> & { entite: { candidature: TauxVivier; succes: Ratio } }) | VivierIndisponible;
  };

// Rangs de l'établissement choisi dans son groupe sur la période choisie
export type ClassementErc = {
  nb_candidatures: number;
  nb_laureats: number;
  part_candidatures: RangErc;
  part_laureats: RangErc;
  // Classé parmi les établissements d'au moins `seuil_fiabilite` candidatures
  taux_succes: RangErc & { fiable: boolean };
};

// Établissements d'un groupe comparable : rangs de l'établissement choisi (chiffres clés) et nuage à quadrants
// taux de candidature au vivier × taux de succès. `periode` null : aucune année d'appel dans la période choisie.
type ErcEtablissementsContexte = {
  comptage: Comptage;
  groupe: string;
  // Groupe de l'établissement sélectionné (null pour la France)
  groupe_selection: string | null;
  groupes: GroupeEtablissements[];
};
export type ErcEtablissements = ErcEtablissementsContexte & (
  | { periode: null }
  | {
    annees_provisoires: number[];
    // null si l'établissement choisi n'est pas dans le groupe (ou si la France est sélectionnée)
    classement: ClassementErc | null;
    periode: [number, number];
    seuil_fiabilite: number;
    vivier: ErcVivierNuage | VivierIndisponible;
  }
);

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

// Le filtre de discipline ne s'applique pas (chaque point est une discipline) : il n'entre ni dans la requête ni dans la clé
export const useErcDisciplines = (selection: Selection, options: ErcOptions) => {
  const sansDiscipline = { ...selection, disciplineCode: undefined, domaineCode: undefined };
  return useQuery({
    queryKey: ["suivi-recherche", "erc", "disciplines", ...filtersKey(sansDiscipline, options)],
    queryFn: () => fetchJson<ErcVivierDisciplines>(`${BASE_URL}/disciplines?${toSearchParams(sansDiscipline, options)}`),
    placeholderData: keepPreviousData,
  });
};

// Sans groupe : celui de l'établissement sélectionné, sinon les universités (choix du serveur).
// `enabled` : faux quand le bloc ERC est masqué (paramètre `dispositif`)
export const useErcEtablissements = (selection: Selection, options: ErcOptions, groupe?: string, enabled = true) =>
  useQuery({
    enabled,
    queryKey: ["suivi-recherche", "erc", "etablissements", groupe ?? null, ...filtersKey(selection, options)],
    queryFn: () => {
      const params = toSearchParams(selection, options);
      if (groupe) params.set("groupe", groupe);
      return fetchJson<ErcEtablissements>(`${BASE_URL}/etablissements?${params}`);
    },
    placeholderData: keepPreviousData,
  });
