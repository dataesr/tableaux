import { useSection as useSectionOf } from "../../hooks/use-section.ts";

// Onglets de la page Financements, sur le modèle de la bibliométrie, choisis par le paramètre d'URL `section`.
// `test` accueille le prototype existant (projets par type et par année).
export const SECTIONS = [
  { id: "profil", label: "Profil", question: "Où en est l'établissement sélectionné ?", titleKey: "financements-profil" },
  { id: "etablissements", label: "Établissements", question: "Comment se situe-t-il parmi des établissements comparables ?", titleKey: "financements-etablissements" },
  { id: "international", label: "International", question: "Comment se situe la France parmi les pays ?", titleKey: "financements-international" },
  { id: "test", label: "Test", question: "Prototype : projets financés de l'établissement sélectionné, par type et par année.", titleKey: "financements-test" },
] as const;

export type Section = (typeof SECTIONS)[number];

export const useSection = (): Section => useSectionOf(SECTIONS);
