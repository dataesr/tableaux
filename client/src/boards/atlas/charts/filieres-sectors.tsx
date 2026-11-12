import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { useSearchParams } from "react-router-dom";
import { CreateChartOptions } from "../components/chart-atlas";
import ChartWrapper from "../../../components/chart-wrapper";
import Template from "../../../components/template";
import { getCssColor } from "../../../utils/colors";
import "../styles.scss";
import { useAtlas } from "../useAtlas.tsx";

type DataProps = {
  label: string;
  effectif_PU: number;
  effectif_PR: number;
};

export default function FilieresSectorsChart({ data, isLoading }: { data: DataProps[]; isLoading: boolean }) {
  const { DEFAULT_CURRENT_YEAR } = useAtlas();
  const [searchParams] = useSearchParams();
  const currentYear = searchParams.get("annee_universitaire") || DEFAULT_CURRENT_YEAR;
  if (isLoading || !data || data.length === 0) {
    return <Template />;
  }

  const filieresOptions: HighchartsInstance.Options = {
    chart: {
      height: data.length * 60,
    },
    xAxis: {
      categories: data.map((filiere) => filiere.label),
      title: {
        text: "",
      },
      gridLineWidth: 0.1,
      lineWidth: 0,
      labels: {
        style: {
          color: getCssColor("text-default-grey"),
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
          color: getCssColor("text-default-grey"),
          fontFamily: "Marianne, sans-serif",
        },
      },
      labels: {
        overflow: "justify",
        style: {
          color: getCssColor("text-default-grey"),
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
        borderWidth: 0,
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
        color: getCssColor("public-sector"),
      },
      {
        type: "bar",
        name: "Secteur privé",
        data: data.map((filiere) => (filiere.effectif_PR ? filiere.effectif_PR : 0)),
        color: getCssColor("private-sector"),
      },
    ],
  };

  const options = CreateChartOptions("bar", filieresOptions);

  return (
    <section className="chart-container--default">
      <ChartWrapper
        config={{
          id: "filieres-sectors-chart",
          title: {
            fr: `Nombre d'étudiants inscrits par filière répartis par secteur (${currentYear})`,
            look: "h6",
          },
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
