import { Alert, SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import { useMemo, useState } from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import { useErcEvolution } from "../../../../api/erc.ts";
import type { ErcEvolution, ErcMeta, ErcOptions, VivierContexte } from "../../../../api/erc.ts";
import type { Selection } from "../../../../api";
import ChartBusy from "../../../../components/chart-busy/index.tsx";
import { getChartSources } from "../../../../components/sources.tsx";
import { useRenderTransition } from "../../../../hooks/use-render-transition";
import { UNITES } from "../../comptage.ts";
import type { Unites } from "../../comptage.ts";
import { getTexteVivierFixe } from "../../vivier.ts";
import getOptions from "./options.tsx";
import { getIndicateurs, getLecture, getVue, renderDataTable } from "./utils.tsx";
import type { IndicateurEvolution } from "./utils.tsx";

function getCommentaire(indicateur: IndicateurEvolution, data: ErcEvolution, { candidatures, laureats }: Unites) {
  if (indicateur === "candidatures" || indicateur === "laureats") {
    const unite = indicateur === "candidatures" ? candidatures : laureats;
    const ensemble = data.ensemble === "france" ? `les ${unite} de la France` : `l'ensemble des ${unite} ERC`;
    return `Nombre de ${unite} ERC de l'entité par année d'appel (axe de gauche, trait plein) et leur part dans ${ensemble} `
      + "(axe de droite, tirets longs). Une part qui monte quand le nombre baisse signifie que l'entité recule moins que son ensemble.";
  }
  if (indicateur === "vivier") {
    return `Candidatures ERC de l'année (bourses Starting, Consolidator, Advanced) pour 1 000 chercheurs du vivier, `
      + `dans les mêmes disciplines. Références : la France (pour un établissement) et l'ensemble des pays comparés. `
      + getTexteVivierFixe(data.vivier as VivierContexte);
  }
  return `Taux de succès : ${laureats} (structure de signature) ÷ ${candidatures} (structure de dépôt), pour la même entité et les mêmes années. `
    + `Références : ensemble des ${candidatures} ERC et, pour un établissement, la France.`;
}

type ErcEvolutionProps = {
  entiteNom: string;
  meta: ErcMeta;
  selection: Selection;
  options: ErcOptions;
  selectionLabel: string;
};

export default function ErcEvolutionChart({ entiteNom, meta, options, selection, selectionLabel }: ErcEvolutionProps) {
  const [choix, setChoix] = useState<IndicateurEvolution>("candidatures");
  const { data, isLoading, isError, isPlaceholderData } = useErcEvolution(selection, options);
  // Libellés et indicateurs proposés d'après la réponse : ils décrivent les données affichées
  const vivierDisponible = Boolean(data?.vivier && !data.vivier.indisponible);
  const indicateurs = getIndicateurs(UNITES[data?.comptage ?? options.comptage], vivierDisponible);
  // Taux de candidature au vivier devenu incalculable (types, période) : retour au premier indicateur
  const indicateur = indicateurs.some(({ key }) => key === choix) ? choix : indicateurs[0].key;
  // Nouvelles données ou nouvel indicateur appliqués une fois le grisé peint : le redessin n'est jamais muet.
  const demande = useMemo(() => (data ? { data, indicateur } : null), [data, indicateur]);
  const { applied, busy } = useRenderTransition(demande);
  const unites = UNITES[applied?.data.comptage ?? options.comptage];
  const vue = useMemo(
    () => (applied ? getVue(applied.data, applied.indicateur, entiteNom, UNITES[applied.data.comptage]) : null),
    [applied, entiteNom],
  );
  const chartOptions = useMemo(() => (vue ? getOptions(vue) : null), [vue]);

  if (isError) {
    return <Alert description="L'évolution annuelle n'a pas pu être chargée." title="Erreur de chargement" variant="error" />;
  }
  if (isLoading || !applied || !vue || !chartOptions) return <DefaultSkeleton />;
  if (applied.data.annees.length === 0) return null;

  const label = getIndicateurs(unites, true).find(({ key }) => key === applied.indicateur)?.label ?? "";
  const titre = `${label} par année d'appel · ${selectionLabel}`;
  const provisoires = meta.annees_provisoires.filter((annee) => vue.annees.some((d) => d.annee_appel === annee));
  const lecture = getLecture(provisoires, vue, entiteNom);
  const config = {
    id: "suivi-recherche-financements-erc-evolution",
    title: { fr: titre, look: "h5" as const },
    comment: {
      fr: (
        <>
          {getCommentaire(applied.indicateur, applied.data, unites)}
          {vue.series.some(({ points }) => points.some(({ fiable }) => !fiable)) && ` Marqueurs évidés : ${vue.peuFiable}, valeur peu fiable.`}
          {provisoires.length > 0 && ` Appels ${provisoires.join(", ")} provisoires (tirets) : tous les résultats ne sont pas publiés.`}
        </>
      ),
    },
    ...(lecture && { readingKey: { fr: <>{lecture}</> } }),
    sources: getChartSources(applied.indicateur === "vivier" ? [...meta.sources, ...(meta.vivier?.sources ?? [])] : meta.sources),
  };

  return (
    <>
      <SegmentedControl className="fr-segmented--sm fr-mb-2w" label="Indicateur" name="sr-erc-evolution-indicateur">
        {indicateurs.map(({ key, label: libelle }) => (
          <SegmentedElement checked={indicateur === key} key={key} label={libelle} onClick={() => setChoix(key)} value={key} />
        ))}
      </SegmentedControl>
      <ChartBusy busy={isPlaceholderData || busy}>
        <ChartWrapper config={config} options={chartOptions} renderData={() => renderDataTable(vue, titre)} />
      </ChartBusy>
    </>
  );
}
