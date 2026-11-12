import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import ChartWrapper from "../../../../components/chart-wrapper";
import { createChartOptions } from "../../../../components/chart-wrapper/default-options";
import Template from "../../../../components/template";
import { getCssColor } from "../../../../utils/colors";

type GenderData = {
  name: string;
  y: number;
}[];

export default function GenderChart({ data = [], isLoading = false, currentYear }: { data: GenderData; isLoading: boolean; currentYear: string }) {
  if (isLoading || !data || data.length === 0 || data.every((item) => item.y === 0)) {
    return <Template height="250px" />;
  }

  const total = data.reduce((acc, item) => acc + item.y, 0);

  const options = createChartOptions("pie", {
    chart: { height: "300px" },
    legend: { enabled: true },
    tooltip: {
      pointFormat: `<b>{point.percentage:.1f} %</b> ({point.y:,.0f} étudiants / ${total.toLocaleString("fr-FR")} étudiants inscrits)`,
    },
    plotOptions: {
      pie: {
        colors: [getCssColor("men-color"), getCssColor("women-color")],
        dataLabels: { enabled: true, distance: -40, format: "{point.percentage:.1f} %", style: { fontSize: "1em" }, filter: { operator: ">", property: "percentage", value: 10 } },
        showInLegend: true,
      },
    },
    series: [{ type: "pie", name: "Nombre d'étudiants", data }],
  } as HighchartsInstance.Options);

  return (
    <ChartWrapper
      config={{
        id: "genders-pie-chart",
        title: { fr: `Pourcentage d'étudiants inscrits regroupés par genre (${currentYear})`, look: "h6" },
        comment: {
          fr: <>Ce graphique présente la part des étudiants inscrits de genre masculin et de genre féminin.</>,
          en: <>This chart shows the share of students enrolled who are male and female.</>,
        },
      }}
      options={options}
    />
  );
}
