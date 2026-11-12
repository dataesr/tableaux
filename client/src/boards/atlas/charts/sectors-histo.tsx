import { useMemo } from "react";
import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import ChartWrapper from "../../../components/chart-wrapper";
import { createChartOptions } from "../../../components/chart-wrapper/default-options";
import Template from "../../../components/template";
import { getCssColor } from "../../../utils/colors";

type HistoData = {
  annee_universitaire: string;
  effectif_pr: number;
  effectif_pu: number;
};

export default function SectorsHistoChart({ data = [], isLoading = true, type, view }: { data: HistoData[]; isLoading: boolean; type: "column" | "line"; view: "basic" | "percentage" }) {
  const options = useMemo(() => {
    if (!data.length) return null;
    const share = (value: number, item: HistoData) => parseFloat(((value * 100) / (item.effectif_pr + item.effectif_pu)).toFixed(1));
    const isBasic = view === "basic";

    return createChartOptions(type, {
      legend: { enabled: true },
      xAxis: { categories: data.map((item) => item.annee_universitaire) },
      yAxis: {
        min: 0,
        title: { text: isBasic ? "Nombre d'étudiants" : "Part des étudiants inscrits (%)" },
      },
      tooltip: {
        shared: true,
        formatter: function () {
          const item = data[this.points?.[0]?.index ?? 0];
          const total = item.effectif_pr + item.effectif_pu;
          const lines = [
            { name: "Secteur public", color: getCssColor("public-sector"), count: item.effectif_pu },
            { name: "Secteur privé", color: getCssColor("private-sector"), count: item.effectif_pr },
          ].map(
            (line) =>
              `<span style="color:${line.color}">●</span> ${line.name} : <b>${isBasic ? line.count.toLocaleString("fr-FR") : `${share(line.count, item).toLocaleString("fr-FR")} %`}</b> (${line.count.toLocaleString("fr-FR")} / ${total.toLocaleString("fr-FR")} étudiants inscrits)`,
          );
          return `<b>${item.annee_universitaire}</b><br/>${lines.join("<br/>")}`;
        },
      },
      plotOptions: { column: { stacking: "normal", borderWidth: 0 } },
      series: [
        { type, name: "Secteur privé", color: getCssColor("private-sector"), data: data.map((item) => (isBasic ? item.effectif_pr : share(item.effectif_pr, item))) },
        { type, name: "Secteur public", color: getCssColor("public-sector"), data: data.map((item) => (isBasic ? item.effectif_pu : share(item.effectif_pu, item))) },
      ],
    } as HighchartsInstance.Options);
  }, [data, type, view]);

  if (isLoading || !options) {
    return <Template height="400px" />;
  }

  return (
    <div className="chart-container--default">
      <ChartWrapper
        config={{
          id: "sectors-histo-chart",
          title: { fr: "Évolution des effectifs étudiants par secteur", look: "h6" },
          comment: {
            fr: <>Ce graphique présente, pour chaque année universitaire, les étudiants inscrits dans le secteur public et dans le secteur privé, en effectifs ou en pourcentage.</>,
            en: <>This chart shows, for each academic year, students enrolled in the public and private sectors, as numbers or percentages.</>,
          },
        }}
        options={options}
      />
    </div>
  );
}
