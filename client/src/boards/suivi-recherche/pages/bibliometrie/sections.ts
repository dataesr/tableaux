import { useSection as useSectionOf } from "../../hooks/use-section.ts";

// Onglets de la page Bibliométrie, choisis par le paramètre d'URL `section` ; la sélection (autres paramètres) suit d'un onglet à l'autre.
export const SECTIONS = [
  { id: "profil", label: "Profil", question: "Où en est la France ou l'établissement sélectionné ?", titleKey: "bibliometrie-profil" },
  { id: "etablissements", label: "Établissements", question: "Comment se situe-t-il parmi des établissements comparables ?", titleKey: "bibliometrie-etablissements" },
  { id: "international", label: "International", question: "Comment se situe la France parmi les pays ?", titleKey: "bibliometrie-international" },
] as const;

export type Section = (typeof SECTIONS)[number];

export const useSection = (): Section => useSectionOf(SECTIONS);
