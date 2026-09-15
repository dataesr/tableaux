import { getCssColor } from "../../../../../../utils/colors";

export const FM_METRICS_CONFIG = {
  total_effectif: {
    label: "Effectif total",
    format: "number" as const,
    color: getCssColor("blue-france-main-525"),
    category: "Effectifs",
  },
  taux_feminisation: {
    label: "Taux de féminisation",
    format: "percent" as const,
    color: getCssColor("fm-femmes"),
    category: "Genre",
    suffix: "%",
  },
  taux_ec: {
    label: "Part enseignants-chercheurs",
    format: "percent" as const,
    color: getCssColor("fm-statut-ec"),
    category: "Statut",
    suffix: "%",
  },
  taux_titulaires: {
    label: "Part titulaires",
    format: "percent" as const,
    color: getCssColor("fm-statut-titulaire"),
    category: "Statut",
    suffix: "%",
  },
  taux_non_permanents: {
    label: "Part non permanents",
    format: "percent" as const,
    color: getCssColor("fm-statut-non-permanent"),
    category: "Statut",
    suffix: "%",
  },
  taux_pr: {
    label: "Part Professeurs des universités",
    format: "percent" as const,
    color: getCssColor("fm-cat-pr"),
    category: "Catégories",
    suffix: "%",
  },
  taux_mcf: {
    label: "Part Maîtres de conférences",
    format: "percent" as const,
    color: getCssColor("fm-cat-mcf"),
    category: "Catégories",
    suffix: "%",
  },
  taux_2nd_degre: {
    label: "Part enseignants 2nd degré",
    format: "percent" as const,
    color: getCssColor("fm-cat-2nd-degre"),
    category: "Catégories",
    suffix: "%",
  },
  taux_age_35_moins: {
    label: "Part 35 ans et moins",
    format: "percent" as const,
    color: getCssColor("fm-age-35-et-moins"),
    category: "Âge",
    suffix: "%",
  },
  taux_age_36_55: {
    label: "Part 36 à 55 ans",
    format: "percent" as const,
    color: getCssColor("fm-age-36-55-ec"),
    category: "Âge",
    suffix: "%",
  },
  taux_age_56_plus: {
    label: "Part 56 ans et plus",
    format: "percent" as const,
    color: getCssColor("fm-age-56-et-plus-ec"),
    category: "Âge",
    suffix: "%",
  },
  taux_temps_plein: {
    label: "Part temps plein",
    format: "percent" as const,
    color: getCssColor("fm-quotite-temps-plein"),
    category: "Temps de travail",
    suffix: "%",
  },
  total_titulaires: {
    label: "Titulaires",
    format: "number" as const,
    color: getCssColor("fm-statut-titulaire"),
    category: "Effectifs",
  },
  total_ec: {
    label: "Enseignants-chercheurs",
    format: "number" as const,
    color: getCssColor("fm-statut-ec"),
    category: "Effectifs",
  },
  total_non_permanents: {
    label: "Non permanents",
    format: "number" as const,
    color: getCssColor("fm-statut-non-permanent"),
    category: "Effectifs",
  },
} as const;

export type FmMetricKey = keyof typeof FM_METRICS_CONFIG;

export const FM_ANALYSES: Record<
  string,
  { label: string; metrics: FmMetricKey[]; category: string }
> = {
  total_effectif: {
    label: "Effectif total",
    metrics: ["total_effectif"],
    category: "Effectifs",
  },
  total_titulaires: {
    label: "Titulaires",
    metrics: ["total_titulaires"],
    category: "Effectifs",
  },
  total_ec: {
    label: "Enseignants-chercheurs",
    metrics: ["total_ec"],
    category: "Effectifs",
  },
  total_non_permanents: {
    label: "Non permanents",
    metrics: ["total_non_permanents"],
    category: "Effectifs",
  },
  taux_feminisation: {
    label: "Taux de féminisation",
    metrics: ["taux_feminisation"],
    category: "Genre",
  },
  taux_ec: { label: "Part EC", metrics: ["taux_ec"], category: "Statut" },
  taux_titulaires: {
    label: "Part titulaires",
    metrics: ["taux_titulaires"],
    category: "Statut",
  },
  taux_non_permanents: {
    label: "Part non permanents",
    metrics: ["taux_non_permanents"],
    category: "Statut",
  },
  taux_age_35_moins: {
    label: "35 ans et moins",
    metrics: ["taux_age_35_moins"],
    category: "Âge",
  },
  taux_age_36_55: {
    label: "36 à 55 ans",
    metrics: ["taux_age_36_55"],
    category: "Âge",
  },
  taux_age_56_plus: {
    label: "56 ans et plus",
    metrics: ["taux_age_56_plus"],
    category: "Âge",
  },
  taux_temps_plein: {
    label: "Temps plein",
    metrics: ["taux_temps_plein"],
    category: "Temps de travail",
  },
};
