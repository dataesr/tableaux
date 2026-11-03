import { useSearchParams } from "react-router-dom";

// Onglets de la page Bibliométrie, choisis par le paramètre d'URL `section` (plugins/tableaux/reference/url-parameters.md) ;
// absent ou inconnu = premier onglet. La sélection (autres paramètres) suit d'un onglet à l'autre.
export const SECTIONS = [
  { id: "profil", label: "Profil", question: "Où en est l'établissement sélectionné ?", titleKey: "bibliometrie-profil" },
  { id: "etablissements", label: "Établissements", question: "Comment se situe-t-il parmi des établissements comparables ?", titleKey: "bibliometrie-etablissements" },
  { id: "international", label: "International", question: "Comment se situe la France parmi les pays ?", titleKey: "bibliometrie-international" },
] as const;

export type Section = (typeof SECTIONS)[number];

export function useSection(): Section {
  const [searchParams] = useSearchParams();
  return SECTIONS.find(({ id }) => id === searchParams.get("section")) ?? SECTIONS[0];
}
