import { Alert, SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import { useMemo, useState } from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import ChartBusy from "../../../../components/chart-busy/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import { useBiblioComparaison } from "../../../../api";
import type { BiblioDiscipline, BiblioMeta, BiblioOptions, Indicateur, Selection } from "../../../../api";
import { useRenderTransition } from "../../../../hooks/use-render-transition";
import { ENTITE_NATIONALE } from "../../../../hooks/use-selection";
import { formatPeriode, getDisciplineLabel, INDICATEUR_LABELS } from "../../../../utils";
import getOptions from "./options.tsx";
import { getContinent, getContinentColor, renderDataTable } from "./utils.tsx";

import "./styles.scss";

type ComparaisonProps = {
  disciplines: BiblioDiscipline[];
  meta: BiblioMeta;
  options: BiblioOptions;
  selection: Selection;
};

export default function ComparaisonInternationale({ disciplines, meta, options, selection }: ComparaisonProps) {
  const [indicateur, setIndicateur] = useState<Indicateur>("influence");
  const { data, isLoading, isError, isPlaceholderData } = useBiblioComparaison(selection, options);

  // Les trois indicateurs sont dans la réponse : changer d'indicateur ne relance pas de requête, mais le redessin
  // des rubans prend du temps. Toute nouvelle valeur (données ou indicateur) n'est appliquée qu'une fois le grisé peint.
  const demande = useMemo(() => ({ data, indicateur }), [data, indicateur]);
  const { applied, busy } = useRenderTransition(demande);
  const chartOptions = useMemo(
    () => (applied.data ? getOptions(applied.data, applied.indicateur, ENTITE_NATIONALE) : null),
    [applied],
  );
  const continents = useMemo(
    () => [...new Set(meta.pays_compares.filter((pays) => pays !== ENTITE_NATIONALE).map(getContinent))].sort(),
    [meta.pays_compares],
  );
  // Titre, commentaire et tableau décrivent ce que montre le graphique (valeurs appliquées)
  const affiche = applied.indicateur;
  const provisoires = applied.data?.annees_provisoires ?? [];

  const legend = (
    <ul className="sr-legende" aria-label="Légende">
      <li>
        <svg aria-hidden="true" height="12" width="24"><rect fill="var(--sr-focus)" height="12" width="24" /></svg>
        France
      </li>
      {continents.map((continent) => (
        <li key={continent}>
          <svg aria-hidden="true" height="12" width="24"><rect fill={getContinentColor(continent)} height="12" width="24" /></svg>
          {continent}
        </li>
      ))}
    </ul>
  );

  const config = {
    id: "suivi-recherche-bibliometrie-comparaison-internationale",
    title: {
      fr: `${INDICATEUR_LABELS[affiche]} : rang des pays chaque année · ${formatPeriode([selection.anneeDebut, selection.anneeFin])} · ${getDisciplineLabel(selection, disciplines)}`,
      look: "h5" as const,
    },
    comment: {
      fr: (
        <>
          Chaque ruban est un pays, classé chaque année de la plus forte à la plus faible part mondiale ; son épaisseur suit la part.
          {affiche === "influence" && provisoires.length > 0 && (
            <> * Influence provisoire pour {provisoires.join(", ")} : la fenêtre de citation n'est pas close.</>
          )}
          {" "}{meta.sources}
        </>
      ),
    },
  };

  return (
    <>
      <SegmentedControl className="fr-segmented--sm fr-mb-2w" label="Indicateur" name="sr-comparaison-indicateur">
        {(Object.keys(INDICATEUR_LABELS) as Indicateur[]).map((key) => (
          <SegmentedElement
            checked={indicateur === key}
            key={key}
            label={INDICATEUR_LABELS[key]}
            onClick={() => setIndicateur(key)}
            value={key}
          />
        ))}
      </SegmentedControl>
      {isError && (
        <Alert description="La comparaison internationale n'a pas pu être chargée." title="Erreur de chargement" variant="error" />
      )}
      {!isError && (isLoading || !applied.data) && <DefaultSkeleton height="520px" />}
      {!isError && applied.data && (
        // Grisé pendant l'appel API (données précédentes affichées) et pendant le redessin
        <ChartBusy busy={isPlaceholderData || busy}>
          {chartOptions ? (
            <ChartWrapper
              config={config}
              legend={legend}
              options={chartOptions}
              renderData={() => renderDataTable(applied.data!, affiche)}
            />
          ) : (
            <Alert description="Aucune publication pour cette sélection : élargissez la période ou la discipline." title="Aucune donnée" variant="info" />
          )}
        </ChartBusy>
      )}
    </>
  );
}
