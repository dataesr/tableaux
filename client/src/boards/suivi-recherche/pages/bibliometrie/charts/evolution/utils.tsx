import type { Indicateurs } from "../../../../api";
import { getCssColor } from "../../../../../../utils/colors";
import { formatPart, formatRatio } from "../../../../utils";

const SERIES = [
  { key: "poids", name: "Poids", color: "sr-poids" },
  { key: "influence", name: "Influence", color: "sr-influence" },
  { key: "prestige", name: "Prestige", color: "sr-prestige" },
] as const;

export function getOptions(data: (Indicateurs & { annee_publication: number })[], anneesProvisoires: number[]) {
  // Le trait passe en pointillés pour les années dont la fenêtre de citation n'est pas close
  const premiereProvisoire = Math.min(...anneesProvisoires.filter((annee) => data.some((d) => d.annee_publication === annee)));

  return {
    chart: { type: "line", height: 400 },
    credits: { enabled: false },
    legend: { enabled: true },
    title: { text: "" },
    xAxis: { allowDecimals: false, title: { text: "Année de publication" } },
    yAxis: {
      min: 0,
      title: { text: "Part mondiale" },
      labels: { formatter: function (this: any) { return formatPart(this.value); } },
    },
    tooltip: {
      shared: true,
      formatter: function (this: any) {
        const lines = this.points.map((point) => {
          const { indicateur, ratio } = point.point.options.custom;
          return `<span style="color:${point.color}">●</span> ${point.series.name} : <b>${formatPart(point.y)}</b> = ${formatRatio(ratio, indicateur)}`;
        });
        return [`<b>${this.x}</b>`, ...lines].join("<br/>");
      },
    },
    series: SERIES.map(({ key, name, color }) => ({
      color: getCssColor(color),
      data: data.map((d) => ({ x: d.annee_publication, y: d[key].valeur, custom: { indicateur: key, ratio: d[key] } })),
      name,
      ...(key === "influence" && Number.isFinite(premiereProvisoire) && {
        zoneAxis: "x",
        zones: [{ value: premiereProvisoire - 1 }, { dashStyle: "Dash" }],
      }),
    })),
  };
}
