import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import ChartWrapper from "../../../components/chart-wrapper";
import { createChartOptions } from "../../../components/chart-wrapper/default-options";
import type { DataByYear } from "../../../types/atlas";
import { getCssColor } from "../../../utils/colors";
import "../styles.scss";

export default function ColumnsChart({ data, label, currentYear }: { data: DataByYear[]; label: string; currentYear: string }) {
  const selectedYearColor = getCssColor("selected-year-color");
  const otherYearsColor = getCssColor("other-years-color");

  const columnsOptions: HighchartsInstance.Options = {
    chart: {
      height: 250,
    },
    xAxis: {
      categories: data.map((year) => year.annee_universitaire as string),
      gridLineWidth: 1,
      lineWidth: 0,
      title: {
        text: "",
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: "Nombre d'étudiants",
        align: "high",
      },
      labels: {
        overflow: "justify",
      },
      gridLineWidth: 0,
    },
    tooltip: {
      valueSuffix: " étudiants",
    },
    plotOptions: {
      column: {
        groupPadding: 0.1,
      },
    },
    series: [
      {
        type: "column",
        name: "Nombre d'étudiants inscrits",
        data: data.map((year) => ({
          y: year[label] ? Number(year[label]) : 0,
          color: year.annee_universitaire === currentYear ? selectedYearColor : otherYearsColor,
        })),
      },
    ],
  };

  const options = createChartOptions("column", columnsOptions);

  return (
    <section className="chart-container--default">
      <ChartWrapper
        config={{
          id: `columns-chart-${label}`,
          title: {
            fr: "Nombre d'étudiants inscrits par année universitaire",
            look: "h6",
          },
          comment: {
            fr: <>Ce graphique présente le nombre d'étudiants inscrits pour chaque année universitaire. L'année universitaire sélectionnée ({currentYear}) est mise en évidence.</>,
            en: <>This chart shows the number of enrolled students for each academic year. The selected academic year ({currentYear}) is highlighted.</>,
          },
        }}
        options={options}
      />
    </section>
  );
}
