import { getCssColor } from "../../../utils/colors";

export interface FmMetricConfig {
  label: string;
  format: "number" | "percent";
  color: string;
  category: string;
  suffix?: string;
}

export interface FmAnalysisConfig {
  label: string;
  metrics: string[];
  category: string;
  chartType: "single" | "stacked" | "area" | "pyramid" | "base100";
}

export const FM_STATIC_METRICS: Record<string, FmMetricConfig> = {
  effectif_total: {
    label: "Effectif total",
    format: "number",
    color: getCssColor("blue-france-main-525"),
    category: "Effectifs globaux",
  },
  effectif_femmes: {
    label: "Femmes",
    format: "number",
    color: getCssColor("fm-femmes"),
    category: "Effectifs globaux",
  },
  effectif_hommes: {
    label: "Hommes",
    format: "number",
    color: getCssColor("fm-hommes"),
    category: "Effectifs globaux",
  },
  effectif_ec: {
    label: "Enseignants-chercheurs",
    format: "number",
    color: getCssColor("fm-statut-ec"),
    category: "Effectifs globaux",
  },
  effectif_tit_non_ec: {
    label: "Titulaires non-EC",
    format: "number",
    color: getCssColor("fm-statut-titulaire"),
    category: "Effectifs globaux",
  },
  effectif_non_permanents: {
    label: "Non-permanents",
    format: "number",
    color: getCssColor("fm-statut-non-permanent"),
    category: "Effectifs globaux",
  },
  effectif_permanents: {
    label: "Permanents (EC + tit. non-EC)",
    format: "number",
    color: getCssColor("fm-statut-titulaire"),
    category: "Effectifs globaux",
  },
  effectif_pr: {
    label: "PR et assimilés",
    format: "number",
    color: getCssColor("fm-cat-pr"),
    category: "Enseignants-chercheurs",
  },
  effectif_mcf: {
    label: "MCF et assimilés",
    format: "number",
    color: getCssColor("fm-cat-mcf"),
    category: "Enseignants-chercheurs",
  },
  effectif_age_35_moins: {
    label: "35 ans et moins",
    format: "number",
    color: getCssColor("fm-age-35-et-moins"),
    category: "Effectifs globaux",
  },
  effectif_age_36_55: {
    label: "36 à 55 ans",
    format: "number",
    color: getCssColor("fm-age-36-55-ec"),
    category: "Effectifs globaux",
  },
  effectif_age_56_plus: {
    label: "56 ans et plus",
    format: "number",
    color: getCssColor("fm-age-56-et-plus-ec"),
    category: "Effectifs globaux",
  },

  age_35_moins_f: {
    label: "Femmes ≤ 35 ans",
    format: "number",
    color: getCssColor("fm-femmes"),
    category: "Pyramide des âges",
  },
  age_35_moins_h: {
    label: "Hommes ≤ 35 ans",
    format: "number",
    color: getCssColor("fm-hommes"),
    category: "Pyramide des âges",
  },
  age_36_55_f: {
    label: "Femmes 36–55 ans",
    format: "number",
    color: getCssColor("fm-femmes"),
    category: "Pyramide des âges",
  },
  age_36_55_h: {
    label: "Hommes 36–55 ans",
    format: "number",
    color: getCssColor("fm-hommes"),
    category: "Pyramide des âges",
  },
  age_56_plus_f: {
    label: "Femmes ≥ 56 ans",
    format: "number",
    color: getCssColor("fm-femmes"),
    category: "Pyramide des âges",
  },
  age_56_plus_h: {
    label: "Hommes ≥ 56 ans",
    format: "number",
    color: getCssColor("fm-hommes"),
    category: "Pyramide des âges",
  },

  taux_feminisation: {
    label: "Taux de féminisation global",
    format: "percent",
    color: getCssColor("fm-femmes"),
    category: "Genre",
    suffix: "%",
  },
  taux_feminisation_ec: {
    label: "Féminisation des EC",
    format: "percent",
    color: getCssColor("fm-femmes"),
    category: "Genre",
    suffix: "%",
  },
  taux_feminisation_permanents: {
    label: "Féminisation des permanents",
    format: "percent",
    color: getCssColor("fm-femmes"),
    category: "Genre",
    suffix: "%",
  },
  taux_feminisation_non_permanents: {
    label: "Féminisation des non-permanents",
    format: "percent",
    color: getCssColor("fm-femmes"),
    category: "Genre",
    suffix: "%",
  },

  taux_permanents: {
    label: "Taux de permanents",
    format: "percent",
    color: getCssColor("fm-statut-titulaire"),
    category: "Permanents et EC",
    suffix: "%",
  },
  taux_ec: {
    label: "Part des enseignants chercheurs (total)",
    format: "percent",
    color: getCssColor("fm-statut-ec"),
    category: "Permanents et EC",
    suffix: "%",
  },
  taux_ec_sur_permanents: {
    label: "Part des enseignants chercheurs parmi les permanents",
    format: "percent",
    color: getCssColor("fm-statut-ec"),
    category: "Permanents et EC",
    suffix: "%",
  },

  taux_pr_sur_ec: {
    label: "Part des PR parmi les enseignants chercheurs",
    format: "percent",
    color: getCssColor("fm-cat-pr"),
    category: "Enseignants-chercheurs",
    suffix: "%",
  },
  taux_feminisation_pr: {
    label: "Féminisation des PR",
    format: "percent",
    color: getCssColor("fm-cat-pr"),
    category: "Enseignants-chercheurs",
    suffix: "%",
  },
  taux_feminisation_mcf: {
    label: "Féminisation des MCF",
    format: "percent",
    color: getCssColor("fm-cat-mcf"),
    category: "Enseignants-chercheurs",
    suffix: "%",
  },

  taux_age_35_moins: {
    label: "Part des 35 ans et moins",
    format: "percent",
    color: getCssColor("fm-age-35-et-moins"),
    category: "Âge",
    suffix: "%",
  },
  taux_age_56_plus: {
    label: "Part des 56 ans et plus",
    format: "percent",
    color: getCssColor("fm-age-56-et-plus-ec"),
    category: "Âge",
    suffix: "%",
  },
};

const SCALE_COLORS = Array.from({ length: 14 }, (_, i) => `scale-${i + 1}`);

export function buildDiscMetrics(
  discCodes: string[],
  discLabels: Record<string, string>
): Record<string, FmMetricConfig> {
  const metrics: Record<string, FmMetricConfig> = {};
  discCodes.forEach((code, i) => {
    const color = getCssColor(SCALE_COLORS[i % SCALE_COLORS.length]);
    const name = discLabels[code] || `Discipline ${code}`;
    metrics[`disc_${code}`] = {
      label: name,
      format: "number",
      color,
      category: "Disciplines",
    };
    metrics[`disc_f_${code}`] = {
      label: "Femmes",
      format: "number",
      color: getCssColor("fm-femmes"),
      category: "Disciplines",
    };
    metrics[`disc_h_${code}`] = {
      label: "Hommes",
      format: "number",
      color: getCssColor("fm-hommes"),
      category: "Disciplines",
    };
  });
  return metrics;
}

export function buildCnuGroupMetrics(
  cnuGroupCodes: string[],
  cnuGroupLabels: Record<string, string>
): Record<string, FmMetricConfig> {
  const metrics: Record<string, FmMetricConfig> = {};
  cnuGroupCodes.forEach((code, i) => {
    const color = getCssColor(SCALE_COLORS[i % SCALE_COLORS.length]);
    const name = cnuGroupLabels[code] || `Groupe CNU ${code}`;
    metrics[`cnu_g_${code}`] = {
      label: name,
      format: "number",
      color,
      category: "Groupes CNU",
    };
    metrics[`cnu_g_f_${code}`] = {
      label: "Femmes",
      format: "number",
      color: getCssColor("fm-femmes"),
      category: "Groupes CNU",
    };
    metrics[`cnu_g_h_${code}`] = {
      label: "Hommes",
      format: "number",
      color: getCssColor("fm-hommes"),
      category: "Groupes CNU",
    };
  });
  return metrics;
}

export function buildCnuSectionMetrics(
  cnuSections: Array<{ code: string; name: string }>
): Record<string, FmMetricConfig> {
  const metrics: Record<string, FmMetricConfig> = {};
  cnuSections.forEach((sect) => {
    metrics[`cnu_s_f_${sect.code}`] = {
      label: "Femmes",
      format: "number",
      color: getCssColor("fm-femmes"),
      category: "Sections CNU",
    };
    metrics[`cnu_s_h_${sect.code}`] = {
      label: "Hommes",
      format: "number",
      color: getCssColor("fm-hommes"),
      category: "Sections CNU",
    };
  });
  return metrics;
}

export const PREDEFINED_FM_STATIC_ANALYSES: Record<string, FmAnalysisConfig> = {
  // Effectifs globaux
  "effectif-total": {
    label: "Effectif total",
    metrics: ["effectif_total"],
    category: "Effectifs globaux",
    chartType: "single",
  },
  "genre-effectifs": {
    label: "Femmes et Hommes",
    metrics: ["effectif_hommes", "effectif_femmes"],
    category: "Effectifs globaux",
    chartType: "area",
  },
  "statut-effectifs": {
    label: "Effectifs par statut (EC, titulaires, non-permanents)",
    metrics: ["effectif_non_permanents", "effectif_tit_non_ec", "effectif_ec"],
    category: "Effectifs globaux",
    chartType: "stacked",
  },
  "age-effectifs": {
    label: "Effectifs par classe d'âge",
    metrics: [
      "effectif_age_35_moins",
      "effectif_age_36_55",
      "effectif_age_56_plus",
    ],
    category: "Effectifs globaux",
    chartType: "area",
  },
  "pyramide-ages": {
    label: "Pyramide des âges H/F",
    metrics: [
      "age_35_moins_h",
      "age_35_moins_f",
      "age_36_55_h",
      "age_36_55_f",
      "age_56_plus_h",
      "age_56_plus_f",
    ],
    category: "Effectifs globaux",
    chartType: "pyramid",
  },
  "effectifs-base100": {
    label: "EC, permanents et non-permanents (base 100)",
    metrics: [
      "effectif_ec",
      "effectif_permanents",
      "effectif_non_permanents",
      "effectif_total",
    ],
    category: "Effectifs globaux",
    chartType: "base100",
  },

  // Genre
  "taux-feminisation": {
    label: "Taux de féminisation global",
    metrics: ["taux_feminisation"],
    category: "Genre",
    chartType: "single",
  },
  "femi-ec": {
    label: "Féminisation des EC",
    metrics: ["taux_feminisation_ec"],
    category: "Genre",
    chartType: "single",
  },
  "femi-permanents": {
    label: "Féminisation des permanents",
    metrics: ["taux_feminisation_permanents"],
    category: "Genre",
    chartType: "single",
  },
  "femi-non-permanents": {
    label: "Féminisation des non-permanents",
    metrics: ["taux_feminisation_non_permanents"],
    category: "Genre",
    chartType: "single",
  },
  "femi-par-statut-base100": {
    label: "Féminisation par statut (base 100)",
    metrics: [
      "taux_feminisation",
      "taux_feminisation_ec",
      "taux_feminisation_permanents",
      "taux_feminisation_non_permanents",
    ],
    category: "Genre",
    chartType: "base100",
  },
  "genre-base100": {
    label: "Effectifs femmes vs hommes (base 100)",
    metrics: ["effectif_femmes", "effectif_hommes"],
    category: "Genre",
    chartType: "base100",
  },

  // Permanents et EC
  "taux-permanents": {
    label: "Taux de permanents",
    metrics: ["taux_permanents"],
    category: "Permanents et EC",
    chartType: "single",
  },
  "taux-ec": {
    label: "Part des enseignants chercheurs (total)",
    metrics: ["taux_ec"],
    category: "Permanents et EC",
    chartType: "single",
  },
  "taux-ec-sur-permanents": {
    label: "Part des enseignants chercheurs parmi les permanents",
    metrics: ["taux_ec_sur_permanents"],
    category: "Permanents et EC",
    chartType: "single",
  },
  "effectif-ec-seul": {
    label: "Effectif des enseignants chercheurs",
    metrics: ["effectif_ec"],
    category: "Permanents et EC",
    chartType: "single",
  },
  "effectif-permanents-seul": {
    label: "Effectif des permanents",
    metrics: ["effectif_permanents"],
    category: "Permanents et EC",
    chartType: "single",
  },
  "statut-base100": {
    label: "Enseignants chercheurs, permanents, non-permanents (base 100)",
    metrics: ["effectif_ec", "effectif_permanents", "effectif_non_permanents"],
    category: "Permanents et EC",
    chartType: "base100",
  },

  // Enseignants-chercheurs (MCF / PR)
  "ec-mcf-pr": {
    label: "Répartition MCF / PR",
    metrics: ["effectif_mcf", "effectif_pr"],
    category: "Enseignants-chercheurs",
    chartType: "stacked",
  },
  "effectif-mcf-seul": {
    label: "Effectif MCF",
    metrics: ["effectif_mcf"],
    category: "Enseignants-chercheurs",
    chartType: "single",
  },
  "effectif-pr-seul": {
    label: "Effectif PR",
    metrics: ["effectif_pr"],
    category: "Enseignants-chercheurs",
    chartType: "single",
  },
  "taux-pr-sur-ec": {
    label: "Part des PR parmi les EC",
    metrics: ["taux_pr_sur_ec"],
    category: "Enseignants-chercheurs",
    chartType: "single",
  },
  "femi-mcf": {
    label: "Féminisation des MCF",
    metrics: ["taux_feminisation_mcf"],
    category: "Enseignants-chercheurs",
    chartType: "single",
  },
  "femi-pr": {
    label: "Féminisation des PR",
    metrics: ["taux_feminisation_pr"],
    category: "Enseignants-chercheurs",
    chartType: "single",
  },
  "femi-mcf-pr-compare": {
    label: "Féminisation MCF vs PR vs global (base 100)",
    metrics: [
      "taux_feminisation_mcf",
      "taux_feminisation_pr",
      "taux_feminisation",
    ],
    category: "Enseignants-chercheurs",
    chartType: "base100",
  },
  "ec-mcf-pr-base100": {
    label: "MCF vs PR (base 100)",
    metrics: ["effectif_mcf", "effectif_pr"],
    category: "Enseignants-chercheurs",
    chartType: "base100",
  },

  // Catégories de personnel
  "categories-personnel": {
    label: "Effectifs par catégorie de personnel",
    metrics: [
      "effectif_non_permanents",
      "effectif_tit_non_ec",
      "effectif_mcf",
      "effectif_pr",
    ],
    category: "Catégories de personnel",
    chartType: "area",
  },
  "categories-base100": {
    label: "Catégories de personnel (base 100)",
    metrics: [
      "effectif_pr",
      "effectif_mcf",
      "effectif_tit_non_ec",
      "effectif_non_permanents",
    ],
    category: "Catégories de personnel",
    chartType: "base100",
  },
};

export function buildDiscAnalyses(
  discCodes: string[],
  discLabels: Record<string, string>
): Record<string, FmAnalysisConfig> {
  if (discCodes.length === 0) return {};
  const analyses: Record<string, FmAnalysisConfig> = {
    "disciplines-evolution": {
      label: "Effectifs par grande discipline",
      metrics: discCodes.map((c) => `disc_${c}`),
      category: "Disciplines",
      chartType: "stacked",
    },
  };
  discCodes.forEach((code) => {
    analyses[`disc-${code}`] = {
      label: discLabels[code] || `Discipline ${code}`,
      metrics: [`disc_h_${code}`, `disc_f_${code}`],
      category: "Disciplines",
      chartType: "stacked",
    };
  });
  return analyses;
}

export function buildCnuGroupAnalyses(
  cnuGroupCodes: string[],
  cnuGroupLabels: Record<string, string>
): Record<string, FmAnalysisConfig> {
  if (cnuGroupCodes.length === 0) return {};
  const analyses: Record<string, FmAnalysisConfig> = {
    "cnu-groups-evolution": {
      label: "Effectifs EC par groupe CNU",
      metrics: cnuGroupCodes.map((c) => `cnu_g_${c}`),
      category: "Groupes CNU",
      chartType: "stacked",
    },
  };
  cnuGroupCodes.forEach((code) => {
    analyses[`cnu-g-${code}`] = {
      label: cnuGroupLabels[code] || `Groupe CNU ${code}`,
      metrics: [`cnu_g_h_${code}`, `cnu_g_f_${code}`],
      category: "Groupes CNU",
      chartType: "stacked",
    };
  });
  return analyses;
}

export function buildCnuSectionAnalyses(
  cnuSections: Array<{ code: string; name: string }>
): Record<string, FmAnalysisConfig> {
  const analyses: Record<string, FmAnalysisConfig> = {};
  cnuSections.forEach(({ code, name }) => {
    analyses[`cnu-s-${code}`] = {
      label: `Section ${code} — ${name}`,
      metrics: [`cnu_s_h_${code}`, `cnu_s_f_${code}`],
      category: "Sections CNU",
      chartType: "stacked",
    };
  });
  return analyses;
}

export function buildAllFmAnalyses(
  data: any
): Record<string, FmAnalysisConfig> {
  return {
    ...PREDEFINED_FM_STATIC_ANALYSES,
    ...buildDiscAnalyses(data.disc_codes || [], data.disc_labels || {}),
    ...buildCnuGroupAnalyses(
      data.cnu_group_codes || [],
      data.cnu_group_labels || {}
    ),
    ...buildCnuSectionAnalyses(data.cnu_sections || []),
  };
}

export function buildAllFmMetricsConfig(
  data: any
): Record<string, FmMetricConfig> {
  return {
    ...FM_STATIC_METRICS,
    ...buildDiscMetrics(data.disc_codes || [], data.disc_labels || {}),
    ...buildCnuGroupMetrics(
      data.cnu_group_codes || [],
      data.cnu_group_labels || {}
    ),
    ...buildCnuSectionMetrics(data.cnu_sections || []),
  };
}
