import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { CreateChartOptions } from "../components/chart-atlas";
import ChartWrapper from "../../../components/chart-wrapper";
import Template from "../../../components/template";

type DataProps = {
  label: string;
  effectif_masculin: number;
  effectif_feminin: number;
};

export default function FilieresGendersChart({ data, isLoading }: { data: DataProps[]; isLoading: boolean }) {
  if (isLoading || !data || data.length === 0) {
    return <Template />;
  }

  const rootStyles = getComputedStyle(document.documentElement);

  const filieresOptions: HighchartsInstance.Options = {
    xAxis: {
      categories: data.map((filiere) => filiere.label),
      labels: {
        style: {
          color: rootStyles.getPropertyValue("--label-color"),
          fontFamily: "Marianne, sans-serif",
        },
      },
      title: {
        text: "",
      },
      gridLineWidth: 0.5,
      lineWidth: 0,
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
        name: "Masculin",
        data: data.map((filiere) => (filiere.effectif_masculin ? filiere.effectif_masculin : 0)),
        color: "#efcb3a",
      },
      {
        type: "bar",
        name: "Féminin",
        data: data.map((filiere) => (filiere.effectif_feminin ? filiere.effectif_feminin : 0)),
        color: "#e18b76",
      },
    ],
  };

  const options = CreateChartOptions("bar", filieresOptions);

  return (
    <section>
      <ChartWrapper
        config={{
          id: "filieres-genders-chart",
          comment: {
            fr: (
              <>
                Ce graphique présente la répartition par genre des étudiants inscrits dans les différentes filières. Il permet de visualiser les disparités entre les effectifs masculins et féminins au sein de chaque filière, offrant ainsi une
                perspective sur l'équilibre des genres dans le domaine de l'enseignement supérieur.
              </>
            ),
            en: <>This chart shows the gender distribution of students enrolled in different fields of study. It allows to visualize the disparities between male</>,
          },
        }}
        options={options}
      />
    </section>
  );
}
