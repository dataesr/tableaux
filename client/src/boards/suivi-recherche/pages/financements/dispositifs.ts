import type { DSFRColors } from "@dataesr/dsfr-plus";
import { useSearchParams } from "react-router-dom";

import { useSetParams } from "../../hooks/use-selection";

// Dispositifs de la page, un bloc chacun, dans cet ordre.
// `nature` distingue un appel à projets (candidatures, lauréats, taux de succès) d'une distinction (nominations seules).
// Chaque onglet choisit les dispositifs qu'il traite (composant Dispositifs) ; un dispositif sans données y est annoncé « en préparation ».
export const DISPOSITIFS = [
  {
    id: "erc",
    label: "Bourses ERC",
    nature: "Appel à projets",
    couleur: "blue-cumulus",
    description: "Bourses du Conseil européen de la recherche : candidatures, lauréats et taux de succès, par année d'appel.",
  },
  {
    id: "anr",
    label: "Projets ANR",
    nature: "Appel à projets",
    couleur: "green-menthe",
    description: "Projets financés par l'Agence nationale de la recherche.",
  },
  {
    id: "prix",
    label: "Prix et distinctions",
    nature: "Distinction",
    couleur: "yellow-tournesol",
    description: "Nominations à l'Institut universitaire de France et médailles du CNRS, par année d'attribution. "
      + "Sans candidatures connues : ni taux de succès, ni taux de candidature.",
  },
] as const satisfies readonly {
  id: string;
  label: string;
  nature: string;
  couleur: DSFRColors;
  description: string;
}[];

export type Dispositif = (typeof DISPOSITIFS)[number];
export type DispositifId = Dispositif["id"];

const IDS: DispositifId[] = DISPOSITIFS.map(({ id }) => id);

// Dispositifs affichés parmi ceux de l'onglet (`disponibles`), lus dans le paramètre d'URL `dispositif`
// (codes séparés par des virgules) ; absent, vide, inconnu ou sans dispositif de l'onglet = tous ceux de l'onglet.
// Tous affichés = paramètre supprimé (valeur par défaut jamais écrite).
export function useDispositifs(disponibles: readonly DispositifId[] = IDS) {
  const [searchParams] = useSearchParams();
  const setParams = useSetParams();
  const demandes = (searchParams.get("dispositif") ?? "").split(",");
  const choisis = disponibles.filter((id) => demandes.includes(id));
  const affiches = choisis.length > 0 ? choisis : [...disponibles];

  const basculer = (id: DispositifId) => {
    const suivants = affiches.includes(id) ? affiches.filter((a) => a !== id) : disponibles.filter((a) => a === id || affiches.includes(a));
    // Au moins un dispositif reste affiché
    if (suivants.length === 0) return;
    setParams({ dispositif: suivants.length === disponibles.length ? null : suivants.join(",") });
  };

  return { affiches, basculer, estAffiche: (id: DispositifId) => affiches.includes(id) };
}
