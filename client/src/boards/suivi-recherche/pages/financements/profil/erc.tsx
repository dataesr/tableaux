import { Alert, Notice } from "@dataesr/dsfr-plus";

import DefaultSkeleton from "../../../../../components/charts-skeletons/default.tsx";
import { useErcIndicateurs } from "../../../api/erc.ts";
import ChartBusy from "../../../components/chart-busy/index.tsx";
import { useErcOptions } from "../../../hooks/use-selection";
import { formatPeriode, getDisciplineLabel } from "../../../utils";
import ErcEvolutionChart from "../charts/erc-evolution/index.tsx";
import ErcVivierDisciplinesChart from "../charts/erc-vivier-disciplines/index.tsx";
import ChiffresCles from "../components/chiffres-cles/index.tsx";
import MethodeErc from "../components/methode-erc/index.tsx";
import ParametresErc, { getTypesLabel } from "../components/parametres-erc/index.tsx";
import { useFinancements } from "../context.ts";

// Bloc ERC du profil : chiffres clés, réglages et évolution par année d'appel
export default function ErcProfil() {
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
      {data?.periode && ercMeta.vivier && (
        <ErcVivierDisciplinesChart entiteNom={entiteNom} meta={ercMeta} options={options} selection={selection} />
      )}
      <MethodeErc meta={ercMeta} />
    </>
  );
}
