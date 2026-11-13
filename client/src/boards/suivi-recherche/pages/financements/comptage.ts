import type { Comptage } from "../../api/erc.ts";

export type Unites = {
  candidatures: string;
  laureats: string;
  Candidatures: string;
  Laureats: string;
};

// Libellés des effectifs ERC selon le mode de comptage : en mode pi, on compte des porteurs, pas des projets
export const UNITES: Record<Comptage, Unites> = {
  projets: { candidatures: "candidatures", laureats: "lauréats", Candidatures: "Candidatures", Laureats: "Lauréats" },
  pi: { candidatures: "porteurs candidats", laureats: "porteurs lauréats", Candidatures: "Porteurs candidats", Laureats: "Porteurs lauréats" },
};

export const COMPTAGE_LABELS: Record<Comptage, string> = {
  projets: "Projets",
  pi: "Porteurs (PI)",
};
