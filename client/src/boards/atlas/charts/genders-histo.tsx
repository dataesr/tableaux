import { useMemo } from "react";
import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import ChartWrapper from "../../../components/chart-wrapper";
import { createChartOptions } from "../../../components/chart-wrapper/default-options";
import Template from "../../../components/template";
import { getCssColor } from "../../../utils/colors";

type HistoData = {
  annee_universitaire: string;
  effectif_feminin: number;
  effectif_masculin: number;
};

export default function GendersHistoChart({ data = [], isLoading = true, type, view }: { data: HistoData[]; isLoading: boolean; type: "column" | "line"; view: "basic" | "percentage" }) {
  const options = useMemo(() => {
    if (!data.length) return null;
    const share = (value: number, item: HistoData) => parseFloat(((value * 100) / (item.effectif_feminin + item.effectif_masculin)).toFixed(1));
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
          const total = item.effectif_feminin + item.effectif_masculin;
          const lines = [
            { name: "Masculin", color: getCssColor("men-color"), count: item.effectif_masculin },
            { name: "Féminin", color: getCssColor("women-color"), count: item.effectif_feminin },
          ].map(
            (line) =>
              `<span style="color:${line.color}">●</span> ${line.name} : <b>${isBasic ? line.count.toLocaleString("fr-FR") : `${share(line.count, item).toLocaleString("fr-FR")} %`}</b> (${line.count.toLocaleString("fr-FR")} / ${total.toLocaleString("fr-FR")} étudiants inscrits)`,
          );
          return `<b>${item.annee_universitaire}</b><br/>${lines.join("<br/>")}`;
        },
      },
      plotOptions: { column: { stacking: "normal", borderWidth: 0 } },
      series: [
        { type, name: "Féminin", color: getCssColor("women-color"), data: data.map((item) => (isBasic ? item.effectif_feminin : share(item.effectif_feminin, item))) },
        { type, name: "Masculin", color: getCssColor("men-color"), data: data.map((item) => (isBasic ? item.effectif_masculin : share(item.effectif_masculin, item))) },
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
          id: "genders-histo-chart",
          title: { fr: "Évolution des effectifs étudiants par genre", look: "h6" },
          comment: {
            fr: <>Ce graphique présente, pour chaque année universitaire, les étudiants inscrits de genre masculin et de genre féminin, en effectifs ou en pourcentage.</>,
            en: <>This chart shows, for each academic year, students enrolled who are male and female, as numbers or percentages.</>,
          },
        }}
        options={options}
      />
    </div>
  );
}
