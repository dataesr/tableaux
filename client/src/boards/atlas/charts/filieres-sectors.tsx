import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../components/chart-atlas";
import ChartWrapper from "../../../components/chart-wrapper";
import Template from "../../../components/template";

type DataProps = {
  label: string;
  effectif_PU: number;
  effectif_PR: number;
};

export default function FilieresSectorsChart({ data, isLoading }: { data: DataProps[]; isLoading: boolean }) {
  if (isLoading || !data || data.length === 0) {
    return <Template />;
  }

  const rootStyles = getComputedStyle(document.documentElement);

  const filieresOptions: HighchartsInstance.Options = {
    xAxis: {
      categories: data.map((filiere) => filiere.label),
      title: {
        text: "",
      },
      gridLineWidth: 0.5,
      lineWidth: 0,
      labels: {
        style: {
          color: rootStyles.getPropertyValue("--label-color"),
          fontFamily: "Marianne, sans-serif",
        },
      },
    },
    yAxis: {
      min: 0,
      title: {
        text: "Nombre d'étudiants",
        align: "high",
        style: {
          color: rootStyles.getPropertyValue("--label-color"),
          fontFamily: "Marianne, sans-serif",
        },
      },
      labels: {
        overflow: "justify",
        style: {
          color: rootStyles.getPropertyValue("--label-color"),
          fontFamily: "Marianne, sans-serif",
        },
      },
      gridLineWidth: 0,
    },
    tooltip: {
      valueSuffix: " étudiants",
    },
    plotOptions: {
      bar: {
        borderRadius: "20%",
        dataLabels: {
          enabled: true,
        },
        groupPadding: 0.1,
      },
    },
    series: [
      {
        type: "bar",
        name: "Secteur public",
        data: data.map((filiere) => (filiere.effectif_PU ? filiere.effectif_PU : 0)),
        color: "#748CC0",
      },
      {
        type: "bar",
        name: "Secteur privé",
        data: data.map((filiere) => (filiere.effectif_PR ? filiere.effectif_PR : 0)),
        color: "#755F4D",
      },
    ],
  };

  const options = CreateChartOptions("bar", filieresOptions);

  return (
    <section>
      <ChartWrapper
        config={{
          id: "filieres-sectors-chart",
          comment: {
            fr: <>Ce graphique présente le nombre d'étudiants inscrits dans chaque fillière, répartis entre le secteur public et le secteur privé.</>,
            en: <>This chart shows the number of students enrolled in each field, broken down by public and private sectors.</>,
          },
        }}
        options={options}
      />
    </section>
  );
}
