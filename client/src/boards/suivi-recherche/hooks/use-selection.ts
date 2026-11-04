import { useSearchParams } from "react-router-dom";

import { ENTITE_NATIONALE } from "../api";
import type { BiblioMeta, BiblioOptions, Entite, Perimetre, Selection } from "../api";
import type { ErcMeta } from "../api/erc.ts";

export { ENTITE_NATIONALE };

// Noms et valeurs des paramètres d'URL : plugins/tableaux/reference/url-parameters.md
//   ror_id               établissement (identifiant ROR) ; absent = France
//   year_min, year_max   période ; absents = toute la période disponible
//   discipline, domaine  discipline ou domaine ERC ; absents = toutes disciplines
//   perimetre, inclure_multidisciplinaires   paramètres de calcul ; absents = revues SJR, avec multidisciplinaires
//   section              onglet des pages Bibliométrie et Financements ; absent = profil
//   type_bourse          types de bourse ERC, séparés par des virgules ; absent = erc_meta.types_bourse_defaut
// Une valeur par défaut n'est jamais écrite dans l'URL ; une valeur inconnue est ignorée.
export function useSetParams() {
  const [searchParams, setSearchParams] = useSearchParams();

  return (updates: Record<string, string | null>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([name, value]) => {
      if (value) next.set(name, value);
      else next.delete(name);
    });
    setSearchParams(next, { replace: true });
  };
}

// La sélection vit dans l'URL : elle suit la navigation entre pages et se partage par lien.
// Les années disponibles viennent de biblio_meta, seule source d'années pour l'instant.
// `pays` : vue entre pays (comparaison internationale), l'établissement choisi ne s'applique pas et reste dans l'URL.
export function useSelection(meta?: BiblioMeta, entites?: Entite[], { pays = false }: { pays?: boolean } = {}) {
  const [searchParams] = useSearchParams();
  const setParams = useSetParams();

  const rorId = searchParams.get("ror_id");
  const etablissement = rorId
    ? entites?.find((entite) => entite.entite_type === "etablissement" && entite.entite_id === rorId)
    : undefined;

  if (!meta || !entites) return { etablissement, selection: null, setParams };

  const annees = meta.annees;
  const readYear = (name: string, fallback: number) => {
    const year = Number(searchParams.get(name));
    return annees.includes(year) ? year : fallback;
  };
  const anneeDebut = readYear("year_min", Math.min(...annees));
  const anneeFin = readYear("year_max", Math.max(...annees));

  const selection: Selection = {
    anneeDebut: Math.min(anneeDebut, anneeFin),
    anneeFin: Math.max(anneeDebut, anneeFin),
    disciplineCode: searchParams.get("discipline") ?? undefined,
    domaineCode: searchParams.get("domaine") ?? undefined,
    entiteId: !pays && etablissement ? etablissement.entite_id : ENTITE_NATIONALE,
  };

  return { etablissement, selection, setParams };
}

// Par défaut : revues classées SJR, prestige avec les revues multidisciplinaires
export function useBiblioOptions(meta?: BiblioMeta) {
  const [searchParams] = useSearchParams();
  const perimetre = searchParams.get("perimetre") as Perimetre;

  const options: BiblioOptions = {
    inclureMultidisciplinaires: searchParams.get("inclure_multidisciplinaires") !== "false",
    perimetre: meta?.perimetres.includes(perimetre) ? perimetre : "revues_sjr",
  };
  return options;
}

// Types de bourse ERC retenus : codes connus de erc_meta, dans l'ordre de erc_meta ; aucun ou inconnus = types par défaut
export function useTypesBourse(meta?: ErcMeta): string[] {
  const [searchParams] = useSearchParams();
  if (!meta) return [];
  const demandes = searchParams.get("type_bourse")?.split(",") ?? [];
  const types = meta.types_bourse.map(({ code }) => code).filter((code) => demandes.includes(code));
  return types.length ? types : meta.types_bourse_defaut;
}
