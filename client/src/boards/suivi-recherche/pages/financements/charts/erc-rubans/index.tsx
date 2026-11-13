import { Alert, Notice, SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import { useMemo, useState } from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import type { ErcComparaison, ErcMeta, ErcVivierRubans, IndicateurPays, RatioFiable, TauxVivier } from "../../../../api/erc.ts";
import ChartBusy from "../../../../components/chart-busy/index.tsx";
import getRubansOptions from "../../../../components/rubans/options.tsx";
import { getContinent, getLectureRubans, LegendeRubans, TableRubans } from "../../../../components/rubans/utils.tsx";
import { getChartSources } from "../../../../components/sources.tsx";
import { useRenderTransition } from "../../../../hooks/use-render-transition";
import { ENTITE_NATIONALE } from "../../../../hooks/use-selection";
import { formatNombre, formatPart, formatPeriode, PEU_FIABLE } from "../../../../utils";
import { UNITES } from "../../comptage.ts";
import type { Unites } from "../../comptage.ts";
import { formatCalculVivier, formatValeurVivier, getCommentaireVivier, getTexteIndisponible, TITRE_TAUX_VIVIER, UNITE_TAUX_VIVIER } from "../../vivier.ts";

import "../../../../components/rubans/styles.scss";

type Comparaison = Extract<ErcComparaison, { periode: [number, number] }>;

// Indicateurs des rubans : les trois de la réponse (`indicateurs`) et le taux de candidature au vivier (`vivier`).
// « Part dans les candidatures » : part du pays dans l'ensemble des candidatures ERC (les pays se partagent 100 %) ;
// « Candidatures pour 1 000 chercheurs » : candidatures du pays rapportées à ses propres chercheurs.
export type IndicateurRubans = IndicateurPays | "candidatures_vivier";

export const INDICATEURS_PAYS: { key: IndicateurPays; label: string }[] = [
  { key: "part_laureats", label: "Part dans les lauréats" },
  { key: "part_candidatures", label: "Part dans les candidatures" },
  { key: "taux_succes", label: "Taux de succès" },
];
export const LABEL_VIVIER = "Candidatures pour 1\u00a0000 chercheurs";


// Calcul en toutes lettres : « 567 / 4 862 lauréats », « 143 lauréats / 773 candidatures »
export function formatCalcul(indicateur: IndicateurPays, { numerateur, denominateur }: RatioFiable, unites: Unites): string {
  if (indicateur === "part_laureats") return `${formatNombre(numerateur)} / ${formatNombre(denominateur)} ${unites.laureats}`;
  if (indicateur === "part_candidatures") return `${formatNombre(numerateur)} / ${formatNombre(denominateur)} ${unites.candidatures}`;
  return `${formatNombre(numerateur)} ${unites.laureats} / ${formatNombre(denominateur)} ${unites.candidatures}`;
}

// Seuil de fiabilité en toutes lettres
export function getPeuFiable(seuil: number, unites: Unites): string {
  return `moins de ${seuil} ${unites.candidatures}`;
}

function getCommentaire(indicateur: IndicateurRubans, unites: Unites, vivier: ErcVivierRubans | null): string {
  if (indicateur === "part_laureats") {
    return `Part de chaque pays dans l'ensemble des ${unites.laureats} ERC (structure de signature) : les pays se partagent l'ensemble.`;
  }
  if (indicateur === "part_candidatures") {
    return `Part de chaque pays dans l'ensemble des ${unites.candidatures} ERC (structure de dépôt) : les pays se partagent l'ensemble, `
      + "un grand pays a donc une grande part. Pour comparer à taille égale, voir « Candidatures pour 1\u00a0000 chercheurs ».";
  }
  if (indicateur === "taux_succes") {
    return `Taux de succès : ${unites.laureats} (structure de signature) / ${unites.candidatures} (structure de dépôt). `
      + "La Suisse et le Royaume-Uni, exclus de certains appels, ont des taux faussés vers le bas.";
  }
  if (!vivier) return "";
  return `${getCommentaireVivier(vivier, "chaque pays (structure de dépôt)")} `
    + "À la différence de la part dans les candidatures, ce taux compare les pays à nombre de chercheurs égal. "
    + "Pays comparés présents dans le vivier. La Suisse et le Royaume-Uni, exclus de certains appels, ont des taux faussés vers le bas.";
}

// Ce que les rubans affichent pour un indicateur : années, pays et géométrie (ceux du vivier pour le taux de candidature
// au vivier), rubans, format des valeurs et du calcul
function getVue(data: Comparaison, indicateur: IndicateurRubans) {
  const unites = UNITES[data.comptage];
  const peuFiable = getPeuFiable(data.seuil_fiabilite, unites);
  const mention = (ratio: RatioFiable) => (ratio.fiable === false ? ` · ${PEU_FIABLE} (${peuFiable})` : "");

  if (indicateur === "candidatures_vivier") {
    if (data.vivier.indisponible) return null;
    const vivier = data.vivier as ErcVivierRubans;
    const calcul = (ratio: RatioFiable) => `${formatCalculVivier(ratio as TauxVivier, vivier.vivier, unites)}${mention(ratio)}`;
    return {
      vivier,
      donnees: vivier,
      rubans: vivier.rubans,
      provisoires: vivier.appels_provisoires,
      periode: vivier.appels,
      valeur: formatValeurVivier,
      calcul,
      formatCellule: (ratio: RatioFiable) => `${formatValeurVivier(ratio.valeur)} ${UNITE_TAUX_VIVIER} (${calcul(ratio)})`,
    };
  }
  const calcul = (ratio: RatioFiable) => `${formatCalcul(indicateur, ratio, unites)}${mention(ratio)}`;
  return {
    vivier: null,
    donnees: data,
    rubans: data.indicateurs[indicateur]!,
    provisoires: data.annees_provisoires,
    periode: data.periode,
    valeur: formatPart,
    calcul,
    formatCellule: (ratio: RatioFiable) => `${formatPart(ratio.valeur)} (${calcul(ratio)})`,
  };
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
  const [indicateur, setIndicateur] = useState<IndicateurRubans>("part_laureats");
  const proposes = [...INDICATEURS_PAYS, ...(meta.vivier ? [{ key: "candidatures_vivier" as const, label: LABEL_VIVIER }] : [])];

  // Tous les indicateurs sont dans la réponse : changer d'indicateur ne relance pas de requête, mais le redessin
  // des rubans prend du temps. Toute nouvelle valeur n'est appliquée qu'une fois le grisé peint.
  const demande = useMemo(() => ({ data, indicateur }), [data, indicateur]);
  const { applied, busy } = useRenderTransition(demande);
  const vue = useMemo(() => (applied.data ? getVue(applied.data, applied.indicateur) : null), [applied]);
  const chartOptions = useMemo(() => (vue
    ? getRubansOptions(vue.donnees, vue.rubans, ENTITE_NATIONALE, {
      calcul: (ratio) => `= ${vue.calcul(ratio)}`,
      marquee: (annee) => vue.provisoires.includes(annee),
      valeur: vue.valeur,
    })
    : null), [vue]);
  // Légende des pays affichés (réponse appliquée)
  const continents = useMemo(
    () => [...new Set((vue?.donnees.pays ?? []).filter(({ entite_id: id }) => id !== ENTITE_NATIONALE).map(({ entite_id: id }) => getContinent(id)))].sort(),
    [vue],
  );

  const choix = (
    <SegmentedControl className="fr-segmented--sm fr-mb-2w" label="Indicateur" name="sr-erc-rubans-indicateur">
      {proposes.map(({ key, label: libelle }) => (
        <SegmentedElement checked={indicateur === key} key={key} label={libelle} onClick={() => setIndicateur(key)} value={key} />
      ))}
    </SegmentedControl>
  );

  if (isError) return <Alert description="La comparaison des pays n'a pas pu être chargée." title="Erreur de chargement" variant="error" />;
  // Taux de candidature au vivier non calculable pour cette sélection : on dit pourquoi, le choix reste disponible
  if (applied.data && applied.indicateur === "candidatures_vivier" && applied.data.vivier.indisponible) {
    return (
      <>
        {choix}
        <Notice closeMode="disallow" type="info">{getTexteIndisponible(applied.data.vivier)}</Notice>
      </>
    );
  }
  if (isLoading || !vue || !chartOptions) return <DefaultSkeleton height="560px" />;

  const unites = UNITES[applied.data!.comptage];
  const label = proposes.find(({ key }) => key === applied.indicateur)?.label ?? "";
  const titre = `${vue.vivier ? TITRE_TAUX_VIVIER : `${label} ERC`} : rang des pays chaque année d'appel · ${formatPeriode(vue.periode)} · ${disciplineLabel}`;
  const { series } = vue.rubans;
  const lecture = getLectureRubans(vue.donnees.annees, series, ENTITE_NATIONALE, vue.formatCellule);
  const config = {
    id: "suivi-recherche-financements-erc-rubans",
    title: { fr: titre, look: "h5" as const },
    comment: {
      fr: (
        <>
          {"Chaque ruban est un pays, classé chaque année d'appel de la plus forte à la plus faible valeur ; son épaisseur suit la valeur. "}
          {getCommentaire(applied.indicateur, unites, vue.vivier)}
          {vue.provisoires.length > 0 && ` * Appels ${vue.provisoires.join(", ")} provisoires : tous les résultats ne sont pas publiés.`}
        </>
      ),
    },
    ...(lecture && { readingKey: { fr: <>{lecture}</> } }),
    // Taux de candidature au vivier : les chercheurs viennent d'OpenAlex
    sources: getChartSources(vue.vivier ? [...meta.sources, ...(meta.vivier?.sources ?? [])] : meta.sources),
  };

  return (
    <>
      {choix}
      {/* Grisé pendant l'appel API (données précédentes affichées) et pendant le redessin */}
      <ChartBusy busy={isPlaceholderData || busy}>
        <ChartWrapper
          config={config}
          legend={<LegendeRubans continents={continents} focus="France" />}
          options={chartOptions}
          renderData={() => (
            <TableRubans
              annees={vue.donnees.annees}
              caption={titre}
              formatCellule={vue.formatCellule}
              series={series}
            />
          )}
        />
      </ChartBusy>
    </>
  );
}
