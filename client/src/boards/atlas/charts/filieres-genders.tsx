import type HighchartsInstance from "highcharts/es-modules/masters/highcharts.src.js";
import { useSearchParams } from "react-router-dom";
import { CreateChartOptions } from "../components/chart-atlas";
import ChartWrapper from "../../../components/chart-wrapper";
import Template from "../../../components/template";
import { getCssColor } from "../../../utils/colors";
import { useAtlas } from "../useAtlas.tsx";

type DataProps = {
  label: string;
  effectif_masculin: number;
  effectif_feminin: number;
};

export default function FilieresGendersChart({ data, isLoading }: { data: DataProps[]; isLoading: boolean }) {
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
      labels: {
        style: {
          color: getCssColor("text-default-grey"),
          fontFamily: "Marianne, sans-serif",
        },
      },
      title: {
        text: "",
      },
      gridLineWidth: 0.1,
      lineWidth: 0,
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
        color: getCssColor("men-color"),
      },
      {
        type: "bar",
        name: "Féminin",
        data: data.map((filiere) => (filiere.effectif_feminin ? filiere.effectif_feminin : 0)),
        color: getCssColor("women-color"),
      },
    ],
  };

  const options = CreateChartOptions("bar", filieresOptions);

  return (
    <section className="chart-container--default">
      <ChartWrapper
        config={{
          id: "filieres-genders-chart",
          title: {
            fr: `Nombre d'étudiants inscrits par fillière répartis par genre (${currentYear})`,
            look: "h6",
          },
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
