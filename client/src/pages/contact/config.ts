export const CONTACT_API = `${import.meta.env.VITE_APP_SERVER_URL}/contact`;

export const DASHBOARDS = [
  { value: "atlas", label: "Atlas" },
  { value: "financements-par-aap", label: "Financements par AAP" },
  { value: "general", label: "Général" },
  { value: "graduates", label: "Graduates" },
  { value: "integration", label: "Intégration" },
  { value: "european-projects", label: "Projets européens" },
  { value: "open-alex", label: "OpenAlex" },
  {
    value: "outcomes",
    label: "Parcours des néo-bacheliers inscrits en L1 en 2019",
  },
  { value: "personnel-enseignant", label: "Personnel enseignant" },
  { value: "structures-finance", label: "Structures finance" },
  { value: "tableaux-doc", label: "Documentation" },
  { value: "teds", label: "TEDS" },
  {
    value: "valorisation-recherche-innovation",
    label: "Valorisation recherche innovation",
  },
] as const;

export type DashboardValue = (typeof DASHBOARDS)[number]["value"];

export const getDashboardLabel = (value: string): string =>
  DASHBOARDS.find((d) => d.value === value)?.label ?? "Général";
