import { Alert } from "@dataesr/dsfr-plus";
import { useMemo } from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import ChartBusy from "../../../../components/chart-busy/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import { useBiblioEvolution } from "../../../../api";
import type { BiblioMeta, BiblioOptions, Selection } from "../../../../api";
import { useRenderTransition } from "../../../../hooks/use-render-transition";
import getOptions from "./options.tsx";
import { renderDataTable } from "./utils.tsx";

type EvolutionProps = {
  meta: BiblioMeta;
  options: BiblioOptions;
  selection: Selection;
  selectionLabel: string;
};

export default function Evolution({ meta, options, selection, selectionLabel }: EvolutionProps) {
  const { data, isLoading, isError, isPlaceholderData } = useBiblioEvolution(selection, options);
  const provisoires = meta.annees_influence_provisoire;
  // Nouvelles données appliquées une fois le grisé peint : le redessin n'est jamais muet
  const { applied, busy } = useRenderTransition(data);
  const chartOptions = useMemo(() => (applied ? getOptions(applied, provisoires) : null), [applied, provisoires]);

  if (isError) {
    return <Alert description="L'évolution annuelle n'a pas pu être chargée." title="Erreur de chargement" variant="error" />;
  }
  if (isLoading || !applied || !chartOptions) return <DefaultSkeleton />;

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

  return (
    <ChartBusy busy={isPlaceholderData || busy}>
      <ChartWrapper config={config} options={chartOptions} renderData={() => renderDataTable(applied, provisoires)} />
    </ChartBusy>
  );
}
