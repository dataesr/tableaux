import { Alert, SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import { useMemo, useState } from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import type { ErcComparaison, ErcMeta, IndicateurPays, RatioFiable } from "../../../../api/erc.ts";
import ChartBusy from "../../../../components/chart-busy/index.tsx";
import getRubansOptions from "../../../../components/rubans/options.tsx";
import { getContinent, LegendeRubans, TableRubans } from "../../../../components/rubans/utils.tsx";
import { useRenderTransition } from "../../../../hooks/use-render-transition";
import { ENTITE_NATIONALE } from "../../../../hooks/use-selection";
import { formatIndice, formatNombre, formatPart, formatPeriode } from "../../../../utils";
import { UNITES } from "../../comptage.ts";
import { VIVIER_LABELS } from "../../indice.ts";

import "../../../../components/rubans/styles.scss";

type Unites = (typeof UNITES)[keyof typeof UNITES];
type Comparaison = Extract<ErcComparaison, { periode: [number, number] }>;

export const INDICATEURS_PAYS: { key: IndicateurPays; label: string }[] = [
  { key: "part_laureats", label: "Part des lauréats" },
  { key: "part_candidatures", label: "Part des candidatures" },
  { key: "taux_succes", label: "Taux de succès" },
  { key: "indice_candidature", label: "Indice de candidature" },
];

export const PEU_FIABLE = "peu fiable";

export function formatValeur(indicateur: IndicateurPays, valeur: number | null): string {
  return indicateur === "indice_candidature" ? formatIndice(valeur) : formatPart(valeur);
}

// Calcul en toutes lettres : « 567 / 4 862 lauréats », « 143 lauréats / 773 candidatures », « 2 997 candidatures / 2 878 attendues »
export function formatCalcul(indicateur: IndicateurPays, { numerateur, denominateur }: RatioFiable, unites: Unites): string {
  if (indicateur === "part_laureats") return `${formatNombre(numerateur)} / ${formatNombre(denominateur)} ${unites.laureats}`;
  if (indicateur === "part_candidatures") return `${formatNombre(numerateur)} / ${formatNombre(denominateur)} ${unites.candidatures}`;
  if (indicateur === "taux_succes") return `${formatNombre(numerateur)} ${unites.laureats} / ${formatNombre(denominateur)} ${unites.candidatures}`;
  return `${formatNombre(numerateur)} ${unites.candidatures} / ${formatNombre(Math.round(denominateur))} ${unites.attendues}`;
}

// Seuil de fiabilité en toutes lettres : il porte sur les candidatures (taux) ou les candidatures attendues (indice)
export function getPeuFiable(indicateur: IndicateurPays, seuil: number, unites: Unites): string {
  return indicateur === "indice_candidature"
    ? `moins de ${seuil} ${unites.candidatures} ${unites.attendues}`
    : `moins de ${seuil} ${unites.candidatures}`;
}

function getCommentaire(indicateur: IndicateurPays, unites: Unites, data: Comparaison): string {
  if (indicateur === "part_laureats") return `Part de chaque pays dans l'ensemble des ${unites.laureats} ERC (structure de signature).`;
  if (indicateur === "part_candidatures") return `Part de chaque pays dans l'ensemble des ${unites.candidatures} ERC (structure de dépôt).`;
  if (indicateur === "taux_succes") {
    return `Taux de succès : ${unites.laureats} (structure de signature) / ${unites.candidatures} (structure de dépôt). `
      + "La Suisse et le Royaume-Uni, exclus de certains appels, ont des taux faussés vers le bas.";
  }
  const vivier = data.vivier ? VIVIER_LABELS[data.vivier].toLowerCase() : "";
  return `Indice de candidature : ${unites.candidatures} observées / ${unites.candidatures} attendues si le pays candidatait comme les pays de l'UE, `
    + `discipline par discipline, pour son vivier (${vivier} des 3 années précédant l'appel) ; 1 = pays de l'UE. `
    + "Bourses avec panel seulement (Starting, Consolidator, Advanced). Les pays hors UE n'entrent pas dans la référence.";
}

type ErcRubansProps = {
  data: Comparaison | undefined;
  disciplineLabel: string;
  isError: boolean;
  isLoading: boolean;
  isPlaceholderData: boolean;
  meta: ErcMeta;
};

// « Comment se situe la France parmi les pays ? » : rang de chaque pays, année d'appel par année d'appel
export default function ErcRubans({ data, disciplineLabel, isError, isLoading, isPlaceholderData, meta }: ErcRubansProps) {
  const [choix, setIndicateur] = useState<IndicateurPays>("part_laureats");
  // Sans type avec panel, pas d'indice : retour à la part des lauréats
  const proposes = INDICATEURS_PAYS.filter(({ key }) => data?.indicateurs[key]);
  const indicateur = proposes.some(({ key }) => key === choix) ? choix : "part_laureats";

  // Tous les indicateurs sont dans la réponse : changer d'indicateur ne relance pas de requête, mais le redessin
  // des rubans prend du temps. Toute nouvelle valeur n'est appliquée qu'une fois le grisé peint.
  const demande = useMemo(() => ({ data, indicateur }), [data, indicateur]);
  const { applied, busy } = useRenderTransition(demande);
  const affiche = applied.data && applied.data.indicateurs[applied.indicateur] ? applied : null;
  const unites = UNITES[affiche?.data?.comptage ?? "projets"];
  const chartOptions = useMemo(() => {
    if (!affiche?.data) return null;
    const { annees_provisoires: provisoires, indicateurs, seuil_fiabilite: seuil } = affiche.data;
    const ind = affiche.indicateur;
    return getRubansOptions(affiche.data, indicateurs[ind]!, ENTITE_NATIONALE, {
      calcul: (ratio) => `= ${formatCalcul(ind, ratio, unites)}${ratio.fiable === false ? ` · ${PEU_FIABLE} (${getPeuFiable(ind, seuil, unites)})` : ""}`,
      marquee: (annee) => provisoires.includes(annee),
      valeur: (valeur) => formatValeur(ind, valeur),
    });
  }, [affiche, unites]);
  // Légende des pays affichés (réponse appliquée)
  const continents = useMemo(
    () => [...new Set((affiche?.data?.pays ?? []).filter(({ entite_id: id }) => id !== ENTITE_NATIONALE).map(({ entite_id: id }) => getContinent(id)))].sort(),
    [affiche],
  );

  if (isError) return <Alert description="La comparaison des pays n'a pas pu être chargée." title="Erreur de chargement" variant="error" />;
  if (isLoading || !affiche?.data || !chartOptions) return <DefaultSkeleton height="560px" />;

  const comparaison = affiche.data;
  const label = INDICATEURS_PAYS.find(({ key }) => key === affiche.indicateur)?.label ?? "";
  const titre = `${label} ERC : rang des pays chaque année d'appel · ${formatPeriode(comparaison.periode)} · ${disciplineLabel}`;
  const series = comparaison.indicateurs[affiche.indicateur]!.series;
  const peuFiable = getPeuFiable(affiche.indicateur, comparaison.seuil_fiabilite, unites);
  const config = {
    id: "suivi-recherche-financements-erc-rubans",
    title: { fr: titre, look: "h5" as const },
    comment: {
      fr: (
        <>
          {"Chaque ruban est un pays, classé chaque année d'appel de la plus forte à la plus faible valeur ; son épaisseur suit la valeur. "}
          {getCommentaire(affiche.indicateur, unites, comparaison)}
          {comparaison.annees_provisoires.length > 0 && ` * Appels ${comparaison.annees_provisoires.join(", ")} provisoires : tous les résultats ne sont pas publiés.`}
          {affiche.indicateur === "indice_candidature" && comparaison.vivier_provisoire
            && " Indice provisoire pour les appels récents : le top 10 % des plus cités des articles récents n'est pas définitif."}
          {` ${meta.sources}`}
        </>
      ),
    },
  };

  return (
    <>
      <SegmentedControl className="fr-segmented--sm fr-mb-2w" label="Indicateur" name="sr-erc-rubans-indicateur">
        {proposes.map(({ key, label: libelle }) => (
          <SegmentedElement checked={indicateur === key} key={key} label={libelle} onClick={() => setIndicateur(key)} value={key} />
        ))}
      </SegmentedControl>
      {/* Grisé pendant l'appel API (données précédentes affichées) et pendant le redessin */}
      <ChartBusy busy={isPlaceholderData || busy}>
        <ChartWrapper
          config={config}
          legend={<LegendeRubans continents={continents} focus="France" />}
          options={chartOptions}
          renderData={() => (
            <TableRubans
              annees={comparaison.annees}
              caption={titre}
              formatCellule={(ratio) => `${formatValeur(affiche.indicateur, ratio.valeur)} (${formatCalcul(affiche.indicateur, ratio, unites)})${ratio.fiable === false ? ` · ${PEU_FIABLE} (${peuFiable})` : ""}`}
              series={series}
            />
          )}
        />
      </ChartBusy>
    </>
  );
}
