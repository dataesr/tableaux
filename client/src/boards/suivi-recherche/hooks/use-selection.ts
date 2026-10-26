import { useSearchParams } from "react-router-dom";

import type { BiblioMeta, BiblioOptions, Perimetre, Selection } from "../api";

export const ENTITE_NATIONALE = "FR";

export type Niveau = "national" | "etablissement";

// La sélection vit dans l'URL : elle suit la navigation entre onglets et se partage par lien.
// Les années disponibles viennent de biblio_meta, seule source d'années pour l'instant.
export function useSelection(meta?: BiblioMeta) {
  const [searchParams, setSearchParams] = useSearchParams();

  const setParams = (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([name, value]) => {
      if (value) next.set(name, value);
      else next.delete(name);
    });
    setSearchParams(next, { replace: true });
  };

  const niveau: Niveau = searchParams.get("niveau") === "etablissement" ? "etablissement" : "national";
  const etablissementId = searchParams.get("entite");

  if (!meta || (niveau === "etablissement" && !etablissementId)) {
    return { niveau, etablissementId, selection: null, setParams };
  }

  const annees = meta.annees;
  const readYear = (name: string, fallback: number) => {
    const year = Number(searchParams.get(name));
    return annees.includes(year) ? year : fallback;
  };
  const anneeDebut = readYear("debut", annees[0]);
  const anneeFin = readYear("fin", annees[annees.length - 1]);

  const selection: Selection = {
    anneeDebut: Math.min(anneeDebut, anneeFin),
    anneeFin: Math.max(anneeDebut, anneeFin),
    disciplineCode: searchParams.get("discipline") ?? undefined,
    domaineCode: searchParams.get("domaine") ?? undefined,
    entiteId: niveau === "etablissement" && etablissementId ? etablissementId : ENTITE_NATIONALE,
  };

  return { niveau, etablissementId, selection, setParams };
}

// Par défaut : revues classées SJR, prestige avec les revues multidisciplinaires
export function useBiblioOptions(meta?: BiblioMeta) {
  const [searchParams] = useSearchParams();
  const perimetre = searchParams.get("perimetre") as Perimetre;

  const options: BiblioOptions = {
    inclureMultidisciplinaires: searchParams.get("multi") !== "false",
    perimetre: meta?.perimetres.includes(perimetre) ? perimetre : "revues_sjr",
  };
  return options;
}
