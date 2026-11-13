import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";

import { createChartOptions } from "../../../../../../components/chart-wrapper/default-options.ts";
import { getCssColor } from "../../../../../../utils/colors";
import { PEU_FIABLE } from "../../../../utils";
import { getCategorie } from "./utils.tsx";
import type { Vue } from "./utils.tsx";

// Valeurs calculées par le serveur : ici, uniquement du mapping vers Highcharts.
// Chaque point porte son calcul en toutes lettres : l'infobulle affiche le numérateur et le dénominateur.
export default function getOptions({ annees, axes, peuFiable, series }: Vue) {
  // Le trait passe en tirets vers la première année d'appel provisoire (résultats pas tous publiés)
  const premiereProvisoire = annees.findIndex((d) => d.provisoire);

  const newOptions: HighchartsInstance.Options = {
    chart: { height: 400 },
    legend: { enabled: true },
    xAxis: { categories: annees.map((d) => getCategorie(d.annee_appel, d.provisoire)), title: { text: "Année d'appel" } },
    // Effectifs : nombre à gauche, part à droite
    yAxis: axes.map((axe, index) => ({
      min: 0,
      opposite: index === 1,
      title: { text: axe.titre },
      labels: { formatter: function () { return axe.format(Number(this.value)); } },
    })),
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
    series: series.map(({ color, name, points, reference, trait, yAxis }) => ({
      type: "line",
      yAxis: yAxis ?? 0,
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
