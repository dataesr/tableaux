import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { createChartOptions } from "../../../../../../components/chart-wrapper/default-options.ts";
import { getCssColor } from "../../../../../../utils/colors";
import type { ErcEvolution } from "../../../../api/erc.ts";
import { formatPart } from "../../../../utils";
import { formatRatio, getCategorie, PEU_FIABLE } from "./utils.tsx";
import type { IndicateurEvolution, Serie } from "./utils.tsx";

const AXES: Record<IndicateurEvolution, string> = {
  parts: "Part de l'ensemble de l'ERC",
  taux: "Taux de succès",
};

// Ratios calculés par le serveur : ici, uniquement du mapping vers Highcharts.
// Chaque point porte son ratio : l'infobulle affiche le numérateur et le dénominateur.
// `peuFiable` : mention ajoutée à l'infobulle d'un point peu fiable (« moins de 20 candidatures »)
export default function getOptions(data: ErcEvolution["annees"], indicateur: IndicateurEvolution, series: Serie[], peuFiable: string) {
  // Le trait passe en pointillés vers la première année d'appel provisoire (résultats pas tous publiés)
  const premiereProvisoire = data.findIndex((d) => d.provisoire);

  const newOptions: HighchartsInstance.Options = {
    chart: { height: 400 },
    legend: { enabled: true },
    xAxis: { categories: data.map((d) => getCategorie(d.annee_appel, d.provisoire)), title: { text: "Année d'appel" } },
    yAxis: {
      min: 0,
      title: { text: AXES[indicateur] },
      labels: { formatter: function () { return formatPart(Number(this.value)); } },
    },
    tooltip: {
      shared: true,
      formatter: function () {
        const lines = (this.points ?? []).map((point) => {
          const { ratio, unites, fiable } = point.options.custom ?? {};
          const mention = fiable === false ? ` · ${PEU_FIABLE} (${peuFiable})` : "";
          return `<span style="color:${point.color}">●</span> ${point.series.name} : <b>${formatRatio(ratio, unites)}</b>${mention}`;
        });
        return [`<b>${this.x}</b>`, ...lines].join("<br/>");
      },
    },
    series: series.map(({ color, name, ratios, reference, unites }) => ({
      type: "line",
      color: getCssColor(color),
      dashStyle: reference ? "ShortDot" : "Solid",
      name,
      data: ratios.map((ratio, index) => {
        const fiable = reference || data[index].fiable;
        return {
          y: ratio.valeur,
          custom: { ratio, unites, fiable },
          // Point peu fiable : marqueur évidé (forme, pas seulement couleur), précisé dans l'infobulle et le tableau
          ...(!fiable && { marker: { fillColor: "transparent", lineColor: getCssColor(color), lineWidth: 2 } }),
        };
      }),
      ...(!reference && premiereProvisoire > 0 && {
        zoneAxis: "x",
        zones: [{ value: premiereProvisoire - 1 }, { dashStyle: "Dash" }],
      }),
    })),
  };

  return createChartOptions("line", newOptions);
}
