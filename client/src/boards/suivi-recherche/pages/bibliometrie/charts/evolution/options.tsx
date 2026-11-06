import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import type { Evolution } from "../../../../api";
import { createChartOptions } from "../../../../../../components/chart-wrapper/default-options.ts";
import { getCssColor } from "../../../../../../utils/colors";
import { formatPart, formatRatio } from "../../../../utils";
import { SERIES } from "./utils.tsx";

// Les parts et ratios sont calculés par le serveur : ici, uniquement du mapping vers Highcharts
export default function getOptions(data: Evolution, anneesProvisoires: number[]) {
  // Le trait passe en pointillés à partir de la première année dont la fenêtre de citation n'est pas close
  const premiereProvisoire = data.find((d) => anneesProvisoires.includes(d.annee_publication))?.annee_publication;

  const newOptions: HighchartsInstance.Options = {
    chart: { height: 400 },
    legend: { enabled: true },
    xAxis: { allowDecimals: false, title: { text: "Année de publication" } },
    yAxis: {
      min: 0,
      title: { text: "Part mondiale" },
      labels: { formatter: function () { return formatPart(Number(this.value)); } },
    },
    tooltip: {
      shared: true,
      formatter: function () {
        const lines = (this.points ?? []).map((point) => {
          const { indicateur, ratio } = point.options.custom ?? {};
          return `<span style="color:${point.color}">●</span> ${point.series.name} : <b>${formatPart(point.y ?? null)}</b> = ${formatRatio(ratio, indicateur)}`;
        });
        return [`<b>${this.x}</b>`, ...lines].join("<br/>");
      },
    },
    series: SERIES.map(({ key, name, color }) => ({
      type: "line",
      color: getCssColor(color),
      data: data.map((d) => ({ x: d.annee_publication, y: d[key].valeur, custom: { indicateur: key, ratio: d[key] } })),
      name,
      ...(key === "influence" && premiereProvisoire !== undefined && {
        zoneAxis: "x",
        zones: [{ value: premiereProvisoire - 1 }, { dashStyle: "Dash" }],
      }),
    })),
  };

  return createChartOptions("line", newOptions);
}
