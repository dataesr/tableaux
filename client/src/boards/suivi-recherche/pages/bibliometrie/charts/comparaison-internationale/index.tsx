import { Alert, SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import { useState } from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import { useBiblioComparaison } from "../../../../api";
import type { BiblioDiscipline, BiblioMeta, BiblioOptions, Indicateur, Selection } from "../../../../api";
import { ENTITE_NATIONALE } from "../../../../hooks/use-selection";
import { formatPeriode, getDisciplineLabel, INDICATEUR_LABELS } from "../../../../utils";
import { getContinent, getContinentColor, getOptions } from "./utils.tsx";

import "./styles.scss";

type ComparaisonProps = {
  disciplines: BiblioDiscipline[];
  meta: BiblioMeta;
  options: BiblioOptions;
  selection: Selection;
};

export default function ComparaisonInternationale({ disciplines, meta, options, selection }: ComparaisonProps) {
  const [indicateur, setIndicateur] = useState<Indicateur>("influence");
  const { data, isLoading, isError } = useBiblioComparaison(selection, options);

  const continents = [...new Set(meta.pays_compares.filter((pays) => pays !== ENTITE_NATIONALE).map(getContinent))].sort();
  const provisoires = meta.annees_influence_provisoire.filter((annee) => annee >= selection.anneeDebut && annee <= selection.anneeFin);

  const legend = (
    <ul className="sr-legende" aria-label="Légende">
      <li><span className="sr-legende__pastille" style={{ backgroundColor: "var(--sr-focus)" }} />France</li>
      {continents.map((continent) => (
        <li key={continent}>
          <span className="sr-legende__pastille" style={{ backgroundColor: getContinentColor(continent) }} />
          {continent}
        </li>
      ))}
    </ul>
  );

  const config = {
    id: "suivi-recherche-bibliometrie-comparaison-internationale",
    title: {
      fr: `${INDICATEUR_LABELS[indicateur]} : rang des pays chaque année · ${formatPeriode([selection.anneeDebut, selection.anneeFin])} · ${getDisciplineLabel(selection, disciplines)}`,
      look: "h5" as const,
    },
    comment: {
      fr: (
        <>
          Chaque ruban est un pays, classé chaque année de la plus forte à la plus faible part mondiale ; son épaisseur suit la part.
          {indicateur === "influence" && provisoires.length > 0 && (
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
      {selection.entiteId !== ENTITE_NATIONALE && (
        <p className="fr-text--sm fr-text-mention--grey">
          La comparaison internationale se fait entre pays : la France y est mise en avant, quel que soit l'établissement sélectionné.
        </p>
      )}
      {isLoading && <DefaultSkeleton height="520px" />}
      {(isError || (!isLoading && !data)) && (
        <Alert description="La comparaison internationale n'a pas pu être chargée." title="Erreur de chargement" variant="error" />
      )}
      {data && (
        <ChartWrapper config={config} legend={legend} options={getOptions(data, indicateur, provisoires, ENTITE_NATIONALE)} />
      )}
    </>
  );
}
