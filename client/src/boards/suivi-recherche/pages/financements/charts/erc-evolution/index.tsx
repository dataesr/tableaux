import { Alert, SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import { useMemo, useState } from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import { useErcEvolution } from "../../../../api/erc.ts";
import type { ErcMeta, ErcOptions } from "../../../../api/erc.ts";
import type { Selection } from "../../../../api";
import ChartBusy from "../../../../components/chart-busy/index.tsx";
import { useRenderTransition } from "../../../../hooks/use-render-transition";
import { UNITES } from "../../comptage.ts";
import getOptions from "./options.tsx";
import { getSeries, INDICATEURS, renderDataTable } from "./utils.tsx";
import type { IndicateurEvolution } from "./utils.tsx";

function getCommentaire(indicateur: IndicateurEvolution, { candidatures, laureats }: (typeof UNITES)[keyof typeof UNITES]) {
  if (indicateur === "parts") {
    return `Part de l'entité dans l'ensemble des ${candidatures} et dans l'ensemble des ${laureats} ERC. `
      + `Quand la part des ${laureats} dépasse celle des ${candidatures}, l'entité réussit mieux que la moyenne : elle pourrait déposer davantage.`;
  }
  return `Taux de succès : ${laureats} (structure de signature) ÷ ${candidatures} (structure de dépôt), pour la même entité et les mêmes années. `
    + `Référence : ensemble des ${candidatures} ERC.`;
}

type ErcEvolutionProps = {
  entiteNom: string;
  meta: ErcMeta;
  selection: Selection;
  options: ErcOptions;
  selectionLabel: string;
};

export default function ErcEvolutionChart({ entiteNom, meta, options, selection, selectionLabel }: ErcEvolutionProps) {
  const [indicateur, setIndicateur] = useState<IndicateurEvolution>("parts");
  const { data, isLoading, isError, isPlaceholderData } = useErcEvolution(selection, options);
  // Nouvelles données ou nouvel indicateur appliqués une fois le grisé peint : le redessin n'est jamais muet.
  // Le mode de comptage vient de la réponse : les libellés décrivent les données affichées.
  const demande = useMemo(() => (data ? { annees: data.annees, comptage: data.comptage, indicateur } : null), [data, indicateur]);
  const { applied, busy } = useRenderTransition(demande);
  const unites = UNITES[applied?.comptage ?? options.comptage];
  const series = useMemo(
    () => (applied ? getSeries(applied.annees, applied.indicateur, entiteNom, UNITES[applied.comptage]) : []),
    [applied, entiteNom],
  );
  const seuil = data?.seuil_fiabilite ?? 0;
  const peuFiable = `moins de ${seuil} ${unites.candidatures}`;
  const chartOptions = useMemo(
    () => (applied ? getOptions(applied.annees, applied.indicateur, series, peuFiable) : null),
    [applied, series, peuFiable],
  );

  if (isError) {
    return <Alert description="L'évolution annuelle n'a pas pu être chargée." title="Erreur de chargement" variant="error" />;
  }
  if (isLoading || !applied || !chartOptions) return <DefaultSkeleton />;
  if (applied.annees.length === 0) return null;

  const label = INDICATEURS.find(({ key }) => key === applied.indicateur)?.label ?? "";
  const provisoires = meta.annees_provisoires.filter((annee) => applied.annees.some((d) => d.annee_appel === annee));
  const config = {
    id: "suivi-recherche-financements-erc-evolution",
    title: { fr: `${label} par année d'appel · ${selectionLabel}`, look: "h5" as const },
    comment: {
      fr: (
        <>
          {getCommentaire(applied.indicateur, unites)}
          {applied.annees.some((d) => !d.fiable) && ` Marqueurs évidés : ${peuFiable}, valeur peu fiable.`}
          {provisoires.length > 0 && ` Appels ${provisoires.join(", ")} provisoires (pointillés) : tous les résultats ne sont pas publiés.`}
          {` ${meta.sources}`}
        </>
      ),
    },
  };

  return (
    <>
      <SegmentedControl className="fr-segmented--sm fr-mb-2w" label="Indicateur" name="sr-erc-evolution-indicateur">
        {INDICATEURS.map(({ key, label: libelle }) => (
          <SegmentedElement
            checked={indicateur === key}
            key={key}
            label={libelle}
            onClick={() => setIndicateur(key)}
            value={key}
          />
        ))}
      </SegmentedControl>
      <ChartBusy busy={isPlaceholderData || busy}>
        <ChartWrapper
          config={config}
          options={chartOptions}
          renderData={() => renderDataTable(applied.annees, series, `${label} par année d'appel · ${selectionLabel}`)}
        />
      </ChartBusy>
    </>
  );
}
