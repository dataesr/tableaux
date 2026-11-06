import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { createChartOptions } from "../../../../../../components/chart-wrapper/default-options.ts";
import { getCssColor } from "../../../../../../utils/colors";
import type { ErcEvolution } from "../../../../api/erc.ts";
import { AXES, getCategorie, PEU_FIABLE } from "./utils.tsx";
import type { IndicateurEvolution, Serie } from "./utils.tsx";

// Ratios calculés par le serveur : ici, uniquement du mapping vers Highcharts.
// Chaque point porte son calcul en toutes lettres : l'infobulle affiche le numérateur et le dénominateur.
// `peuFiable` : mention ajoutée à l'infobulle d'un point peu fiable (« moins de 20 candidatures »)
export default function getOptions(data: ErcEvolution["annees"], indicateur: IndicateurEvolution, series: Serie[], peuFiable: string) {
  // Le trait passe en tirets vers la première année d'appel provisoire (résultats pas tous publiés)
  const premiereProvisoire = data.findIndex((d) => d.provisoire);
  const axe = AXES[indicateur];
  const mentionColor = getCssColor("text-mention-grey");

  const newOptions: HighchartsInstance.Options = {
    chart: { height: 400 },
    legend: { enabled: true },
    xAxis: { categories: data.map((d) => getCategorie(d.annee_appel, d.provisoire)), title: { text: "Année d'appel" } },
    yAxis: {
      min: 0,
      title: { text: axe.titre },
      labels: { formatter: function () { return axe.format(Number(this.value)); } },
      // Indices : 1 = comme les pays de référence
      ...(indicateur === "indices" && {
        plotLines: [{
          value: 1,
          color: mentionColor,
          width: 1.5,
          zIndex: 3,
          label: { text: "Pays de l'UE", align: "right", x: -4, style: { color: mentionColor, fontSize: "11px" } },
        }],
      }),
    },
    tooltip: {
      shared: true,
      formatter: function () {
        const lines = (this.points ?? []).map((point) => {
          const { texte, fiable } = point.options.custom ?? {};
          const mention = fiable === false ? ` · ${PEU_FIABLE} (${peuFiable})` : "";
          return `<span style="color:${point.color}">●</span> ${point.series.name} : <b>${texte}</b>${mention}`;
        });
        return [`<b>${this.key}</b>`, ...lines].join("<br/>");
      },
    },
    series: series.map(({ color, name, points, reference, trait }) => ({
      type: "line",
      color: getCssColor(color),
      dashStyle: trait,
      name,
      data: points.map(({ fiable, texte, valeur }) => ({
        y: valeur,
        custom: { texte, fiable },
        // Point peu fiable : marqueur évidé (forme, pas seulement couleur), précisé dans l'infobulle et le tableau
        ...(!fiable && { marker: { fillColor: "transparent", lineColor: getCssColor(color), lineWidth: 2 } }),
      })),
      // Seuls les traits pleins passent en tirets sur les années provisoires : les autres gardent leur trait distinctif
      ...(!reference && trait === "Solid" && premiereProvisoire > 0 && {
        zoneAxis: "x",
        zones: [{ value: premiereProvisoire - 1 }, { dashStyle: "Dash" }],
      }),
    })),
  };

  return createChartOptions("line", newOptions);
}
