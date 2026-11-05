import { Alert, Notice, Title } from "@dataesr/dsfr-plus";

import DefaultSkeleton from "../../../../../components/charts-skeletons/default.tsx";
import { useErcIndicateurs } from "../../../api/erc.ts";
import ChartBusy from "../../../components/chart-busy/index.tsx";
import { ENTITE_NATIONALE, useErcOptions } from "../../../hooks/use-selection";
import { formatPeriode, getDisciplineLabel } from "../../../utils";
import ErcEvolutionChart from "../charts/erc-evolution/index.tsx";
import ChiffresCles from "../components/chiffres-cles/index.tsx";
import DoubleCompte from "../components/double-compte/index.tsx";
import MethodeErc from "../components/methode-erc/index.tsx";
import ParametresErc, { getTypesLabel } from "../components/parametres-erc/index.tsx";
import { useFinancements } from "../context.ts";

// « Où en est la France ou l'établissement sélectionné ? » : chiffres clés, puis un bloc par dispositif (ERC pour l'instant)
export default function ProfilSection() {
  const { disciplines, entiteNom, ercMeta, selection } = useFinancements();
  const options = useErcOptions(ercMeta);
  const indicateurs = useErcIndicateurs(selection, options);
  const typesLabel = getTypesLabel(ercMeta, options.types);
  const data = indicateurs.data;

  // La période affichée est celle des années d'appel retenues par le serveur, pas celle demandée
  const selectionLabel = data?.periode
    ? [entiteNom, `appels ${formatPeriode(data.periode)}`, getDisciplineLabel(selection, disciplines)].join(" · ")
    : "";

  return (
    <>
      {selection.entiteId !== ENTITE_NATIONALE && <DoubleCompte />}
      {indicateurs.isLoading && <DefaultSkeleton height="160px" label="Chargement des chiffres clés" />}
      {indicateurs.isError && (
        <Alert description="Les chiffres clés n'ont pas pu être calculés pour cette sélection." title="Erreur de chargement" variant="error" />
      )}
      {data && !data.periode && (
        <Notice className="fr-mb-4w" closeMode="disallow" type="info">
          {`Aucun appel ERC dans la période choisie : les appels disponibles vont de ${formatPeriode([Math.min(...ercMeta.annees), Math.max(...ercMeta.annees)])}.`}
        </Notice>
      )}
      {data?.periode && data.nb_candidatures === 0 && (
        <Notice className="fr-mb-4w" closeMode="disallow" type="info">
          {`Aucune candidature ERC pour ${selectionLabel}. Élargissez la période, choisissez « Toutes disciplines » ou d'autres types de bourse.`}
        </Notice>
      )}
      {data?.periode && data.nb_candidatures > 0 && (
        <ChartBusy busy={indicateurs.isPlaceholderData}>
          <ChiffresCles
            comptage={data.comptage}
            erc={data}
            selectionLabel={selectionLabel}
            typesLabel={typesLabel}
          />
        </ChartBusy>
      )}

      <section>
        <Title as="h2" look="h4">Bourses ERC</Title>
        <ParametresErc meta={ercMeta} options={options} />
        {data?.periode && (
          <ErcEvolutionChart
            entiteNom={entiteNom}
            meta={ercMeta}
            selection={selection}
            options={options}
            selectionLabel={selectionLabel}
          />
        )}
        <MethodeErc meta={ercMeta} />
      </section>
    </>
  );
}
