import { useSection as useSectionOf } from "../../hooks/use-section.ts";

// Onglets de la page Financements, sur le modèle de la bibliométrie, choisis par le paramètre d'URL `section`.
export const SECTIONS = [
  { id: "profil", label: "Profil", question: "Où en est la France ou l'établissement sélectionné ?", titleKey: "financements-profil" },
  { id: "etablissements", label: "Établissements", question: "Comment se situe-t-il parmi des établissements comparables ?", titleKey: "financements-etablissements" },
  { id: "international", label: "International", question: "Comment se situe la France parmi les pays ?", titleKey: "financements-international" },] as const;

export type Section = (typeof SECTIONS)[number];

export const useSection = (): Section => useSectionOf(SECTIONS);
