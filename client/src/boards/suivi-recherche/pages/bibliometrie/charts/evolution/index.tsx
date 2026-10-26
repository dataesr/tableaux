import { Alert } from "@dataesr/dsfr-plus";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import { useBiblioEvolution } from "../../../../api";
import type { BiblioMeta, BiblioOptions, Selection } from "../../../../api";
import { getOptions } from "./utils.tsx";

type EvolutionProps = {
  meta: BiblioMeta;
  options: BiblioOptions;
  selection: Selection;
  selectionLabel: string;
};

export default function Evolution({ meta, options, selection, selectionLabel }: EvolutionProps) {
  const { data, isLoading, isError } = useBiblioEvolution(selection, options);

  if (isLoading) return <DefaultSkeleton />;
  if (isError || !data) {
    return <Alert description="L'évolution annuelle n'a pas pu être chargée." title="Erreur de chargement" variant="error" />;
  }

  const config = {
    id: "suivi-recherche-bibliometrie-evolution",
    title: { fr: `Évolution annuelle des parts mondiales · ${selectionLabel}`, look: "h5" as const },
    comment: {
      fr: (
        <>
          {meta.annees_influence_provisoire.length > 0 && (
            <>L'influence des années {meta.annees_influence_provisoire.join(", ")} est provisoire (pointillés) : leur fenêtre de citation n'est pas close. </>
          )}
          {meta.sources}
        </>
      ),
    },
  };

  return <ChartWrapper config={config} options={getOptions(data, meta.annees_influence_provisoire)} />;
}
