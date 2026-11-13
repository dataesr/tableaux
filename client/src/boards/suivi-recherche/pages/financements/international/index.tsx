import { Alert, Notice } from "@dataesr/dsfr-plus";

import DefaultSkeleton from "../../../../../components/charts-skeletons/default.tsx";
import { useErcComparaison } from "../../../api/erc.ts";
import type { ErcComparaison, ErcVivierRubans } from "../../../api/erc.ts";
import ChartBusy from "../../../components/chart-busy/index.tsx";
import { useErcOptions } from "../../../hooks/use-selection";
import { formatPart, formatPeriode, getDisciplineLabel, PEU_FIABLE } from "../../../utils";
import ErcRubans, { formatCalcul, getPeuFiable, INDICATEURS_PAYS } from "../charts/erc-rubans/index.tsx";
import Cartes from "../components/cartes/index.tsx";
import Dispositifs from "../components/dispositifs/index.tsx";
import type { Carte } from "../components/cartes/index.tsx";
import MethodeErc from "../components/methode-erc/index.tsx";
import ParametresErc, { getTypesLabel } from "../components/parametres-erc/index.tsx";
import { UNITES } from "../comptage.ts";
import { useFinancements } from "../context.ts";
import { formatRang } from "../rang.ts";
import { formatCalculVivier, formatValeurVivier, TITRE_TAUX_VIVIER } from "../vivier.ts";

type Comparaison = Extract<ErcComparaison, { periode: [number, number] }>;

// Chiffres clés : valeur et rang de la France sur toute la période, pour chaque indicateur ERC,
// puis son taux de candidature au vivier (appels de la période du vivier)
function getCartes(data: Comparaison): Carte[] {
  const unites = UNITES[data.comptage];
  const provisoire = data.annees_provisoires.length > 0;
  const cartes = INDICATEURS_PAYS.flatMap(({ key, label }) => {
    const rang = data.france[key];
    if (!rang?.ratio) return [];
    const peuFiable = rang.ratio.fiable === false ? ` · ${PEU_FIABLE} (${getPeuFiable(data.seuil_fiabilite, unites)})` : "";
    return [{
      titre: `${label} ERC`,
      valeur: formatPart(rang.ratio.valeur),
      detail: `${formatRang(rang.rang, rang.nb, "pays")} · ${formatCalcul(key, rang.ratio, unites)}${peuFiable}`,
      fiable: rang.ratio.fiable !== false,
      provisoire,
    }];
  });
  if (!data.vivier.indisponible) {
    const vivier = data.vivier as ErcVivierRubans;
    const { rang, nb, ratio: taux } = vivier.france;
    cartes.push({
      titre: `${TITRE_TAUX_VIVIER} (appels ${formatPeriode(vivier.appels)})`,
      valeur: formatValeurVivier(taux.valeur),
      detail: `${formatRang(rang, nb, "pays")} · par an : ${formatCalculVivier(taux, vivier.vivier, unites)} · `
        + `ensemble des pays : ${formatValeurVivier(vivier.reference.valeur)} (${formatCalculVivier(vivier.reference, vivier.vivier, unites)})`,
      fiable: taux.fiable,
      provisoire: vivier.appels_provisoires.length > 0 || vivier.vivier_provisoire,
    });
  }
  return cartes;
}

// Bloc ERC : chiffres clés et rubans de la France parmi les pays
function ErcInternational() {
  const { disciplines, ercMeta, selection } = useFinancements();
  const options = useErcOptions(ercMeta);
  const { data, isError, isLoading, isPlaceholderData } = useErcComparaison(selection, options);
  const comparaison = data?.periode ? data : undefined;
  const disciplineLabel = getDisciplineLabel(selection, disciplines);

  return (
    <>
      {isLoading && <DefaultSkeleton height="160px" label="Chargement des chiffres clés" />}
      {isError && <Alert description="Les chiffres clés n'ont pas pu être calculés." title="Erreur de chargement" variant="error" />}
      {data && !data.periode && (
        <Notice className="fr-mb-4w" closeMode="disallow" type="info">
          {`Aucun appel ERC dans la période choisie : les appels disponibles vont de ${formatPeriode([Math.min(...ercMeta.annees), Math.max(...ercMeta.annees)])}.`}
        </Notice>
      )}
      {comparaison && (
        <ChartBusy busy={isPlaceholderData}>
          <Cartes
            cartes={getCartes(comparaison)}
            sousTitre={`Bourses ERC : ${getTypesLabel(ercMeta, options.types)} · rang parmi les ${comparaison.pays.length} pays comparés`}
            titreAs="h3"
            titre={`France · appels ${formatPeriode(comparaison.periode)} · ${disciplineLabel}`}
          />
        </ChartBusy>
      )}
      <ParametresErc meta={ercMeta} options={options} />
      {(isLoading || comparaison || isError) && (
        <ErcRubans
          data={comparaison}
          disciplineLabel={disciplineLabel}
          isError={isError}
          isLoading={isLoading}
          isPlaceholderData={isPlaceholderData}
          meta={ercMeta}
        />
      )}
      <MethodeErc meta={ercMeta} />
    </>
  );
}

// « Comment se situe la France parmi les pays ? » : la sélection d'établissement ne s'applique pas
export default function InternationalSection() {
  return (
    <Dispositifs
      contenus={{
        erc: { bloc: <ErcInternational /> },
      }}
    />
  );
}
