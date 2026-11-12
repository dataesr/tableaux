import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import ChartWrapper from "../../../../components/chart-wrapper";
import { createChartOptions } from "../../../../components/chart-wrapper/default-options";
import Template from "../../../../components/template";
import { getCssColor } from "../../../../utils/colors";

type SectorData = {
  name: string;
  y: number;
}[];

export default function SectortsChart({ data = [], isLoading = false, currentYear }: { data: SectorData; isLoading: boolean; currentYear: string }) {
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
        colors: [getCssColor("public-sector"), getCssColor("private-sector")],
        dataLabels: { enabled: true, distance: -40, format: "{point.percentage:.1f} %", style: { fontSize: "1em" }, filter: { operator: ">", property: "percentage", value: 10 } },
        showInLegend: true,
      },
    },
    series: [{ type: "pie", name: "Nombre d'étudiants", data }],
  } as HighchartsInstance.Options);

  return (
    <ChartWrapper
      config={{
        id: "sectors-pie-chart",
        title: { fr: `Pourcentage d'étudiants inscrits regroupés par secteur (${currentYear})`, look: "h6" },
        comment: {
          fr: <>Ce graphique présente la part des étudiants inscrits dans le secteur public et dans le secteur privé.</>,
          en: <>This chart shows the share of students enrolled in the public and private sectors.</>,
        },
      }}
      options={options}
    />
  );
}
