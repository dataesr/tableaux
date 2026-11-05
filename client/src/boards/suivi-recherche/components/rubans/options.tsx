import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import type { Comparaison, Etiquette, Ratio, Ruban, Rubans } from "../../api";
import { createChartOptions } from "../../../../components/chart-wrapper/default-options.ts";
import { getFlagEmoji } from "../../../../utils";
import { getCssColor } from "../../../../utils/colors";
import { getContinent, getContinentColor } from "./utils.tsx";

// Ce qui distingue un indicateur d'un autre : format de la valeur (étiquettes), calcul en toutes lettres (infobulle)
export type RubansTextes = {
  // « 11,7 % (567 / 4 862 lauréats) » ; `fiable` : faux sous le seuil d'effectifs de la route
  calcul: (ratio: Ratio & { fiable?: boolean }) => string;
  // Année marquée d'un astérisque (provisoire)
  marquee: (annee: number) => boolean;
  valeur: (valeur: number | null) => string;
};

// Les rangs, épaisseurs et transitions sont calculés par le serveur : ici, uniquement du mapping vers Highcharts
// `data` : années, pays et géométrie communs à tous les indicateurs ; `rubans` : ceux de l'indicateur affiché
export default function getRubansOptions(
  data: Pick<Comparaison, "annees" | "geometrie" | "pays">,
  rubans: Rubans,
  focusId: string,
  textes: RubansTextes,
) {
  const { annees, geometrie, pays } = data;
  const { etiquettes, series } = rubans;
  if (annees.length === 0) return null;

  const focusColor = getCssColor("sr-france");
  const continentColors = new Map<string, string>();
  const colorOf = (id: string) => {
    const continent = getContinent(id);
    if (!continentColors.has(continent)) continentColors.set(continent, getContinentColor(continent));
    return continentColors.get(continent)!;
  };

  // Noms à l'extérieur du tracé : graduations de deux axes verticaux, à gauche (début) et à droite (fin)
  const axe = (liste: Etiquette[], gauche: boolean): HighchartsInstance.YAxisOptions => {
    const libelles = new Map(liste.map(({ entite_id: id, nom, valeur, y }) => {
      const texte = gauche ? `${getFlagEmoji(id)} ${nom} ${textes.valeur(valeur)}` : `${textes.valeur(valeur)} ${nom} ${getFlagEmoji(id)}`;
      return [y.toFixed(3), id === focusId ? `<b>${texte}</b>` : texte];
    }));
    return {
      reversed: true,
      min: 0,
      max: geometrie.hauteur,
      opposite: !gauche,
      title: { text: undefined },
      gridLineWidth: 0,
      startOnTick: false,
      endOnTick: false,
      tickPositions: liste.map(({ y }) => y),
      labels: {
        step: 1,
        style: { color: "var(--text-default-grey)", fontFamily: "Marianne, sans-serif", fontSize: "12px" },
        formatter: function () { return libelles.get(Number(this.value).toFixed(3)) ?? ""; },
      },
    };
  };

  const newOptions: HighchartsInstance.Options = {
    // Sans animation : un changement d'indicateur redessine 25 rubans d'un coup, sans transition de ~1 s
    chart: { animation: false, height: Math.max(560, pays.length * 34) },
    xAxis: {
      opposite: true,
      lineWidth: 0,
      tickLength: 0,
      min: annees[0] - geometrie.demi_colonne,
      max: annees[annees.length - 1] + geometrie.demi_colonne,
      tickPositions: annees,
      labels: { formatter: function () { return textes.marquee(Number(this.value)) ? `${this.value}*` : `${this.value}`; } },
    },
    tooltip: {
      formatter: function () {
        // Highcharts 12 : le contexte de l'infobulle est le point lui-même
        const point = this as HighchartsInstance.Point & { j: number };
        const ruban = this.series.userOptions.custom as Ruban;
        const { rang, ratio } = ruban.annees[point.j];
        return [
          `<b>${ruban.nom}</b> · ${annees[point.j]}`,
          `Rang ${rang} sur ${pays.length} · <b>${textes.valeur(ratio?.valeur ?? null)}</b>`,
          ratio ? textes.calcul(ratio) : "",
        ].join("<br/>");
      },
    },
    plotOptions: {
      arearange: {
        animation: false,
        lineWidth: 0,
        marker: { enabled: false },
        states: { hover: { lineWidth: 0 }, inactive: { opacity: 0.25 } },
      },
    },
    series: series.map((ruban) => {
      const focus = ruban.entite_id === focusId;
      return {
        type: "arearange",
        name: ruban.nom,
        color: focus ? focusColor : colorOf(ruban.entite_id),
        fillOpacity: focus ? 1 : 0.75,
        zIndex: focus ? 2 : 1,
        // Points en tableaux (rapides à tracer) ; la 4ᵉ valeur est l'indice de l'année, lu par l'infobulle
        keys: ["x", "low", "high", "j"],
        data: ruban.data.map(([low, high], i) => [geometrie.abscisses[i][0], low, high, geometrie.abscisses[i][1]]),
        custom: ruban,
      };
    }),
  };

  // Les deux axes verticaux sont posés après createChartOptions, qui concatène les listes d'axes
  // (deepMerge fusionne les tableaux bout à bout) et dupliquerait chacun d'eux
  const chartOptions = createChartOptions("arearange", newOptions);
  chartOptions.yAxis = [axe(etiquettes.debut, true), axe(etiquettes.fin, false)];
  return chartOptions;
}
