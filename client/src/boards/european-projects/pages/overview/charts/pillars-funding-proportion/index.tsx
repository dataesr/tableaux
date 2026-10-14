import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { getData } from "./query";
import options from "./options";
import { useGetParams } from "./utils";
import { EPChartsSources } from "../../../../config";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { formatToRates } from "../../../../../../utils/format";

const titles: Record<string, { fr: string; en: string }> = {
  total_fund_eur: {
    fr: "Part des financements demandés et obtenus par le pays",
    en: "Share of total funding requested and secured by the country's participants",
  },
  total_coordination_number: {
    fr: "Part des coordinations de projets évalués et lauréats par le pays",
    en: "Share of evaluated and successful project coordinations by the country",
  },
  total_number_involved: {
    fr: "Part des candidats et des participants du pays",
    en: "Share of applicants and participants from the country",
  },
};
const config : {
  id: string;
  idQuery: string;
  sources: typeof EPChartsSources;
  integrationURL: string;
  comment?: { fr: React.JSX.Element; en: React.JSX.Element };
  readingKey?: { fr: React.JSX.Element; en: React.JSX.Element };
} = {
  id: "pillarsFundingProportion",
  idQuery: "pillarsFundingProportion",
  sources: EPChartsSources,
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/destination-funding-proportion",

};

export default function PillarsFundingProportion({ displayType = "total_fund_eur" }: { displayType: string }) {
  const params = useGetParams();
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr ";

  const { data, isLoading } = useQuery({
    queryKey: [config.idQuery, params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;
  const readingDataEvaluated = data.data.filter((d) => d.stage === "evaluated")[0];
  const readingDataSuccessful = data.data.find((d) => d.stage === "successful" && d.pillar === readingDataEvaluated.pillar);


  switch (displayType) {
    case "total_coordination_number":
      config.comment = {
        fr: <>Ce graphique présente, pour chaque pilier, la part du pays sélectionné dans l’ensemble des coordinations de projets évalués et lauréats, tous pays confondus.</>,
        en: <>This chart shows, for each pillar, the selected country's share of all evaluated and successful project coordinations, across all countries.</>,
        },
        config.readingKey = {
          fr: <>Dans le cadre des appels à projets concernant « {readingDataEvaluated.name_fr} », les entités du pays sélectionné coordonnent{" "}
                {readingDataEvaluated.proportion_coordination_number} de l'ensemble des projets évalués et{" "}
                {readingDataSuccessful.proportion_coordination_number} de l'ensemble des projets lauréats.</>,
          en: <>Under calls for proposals concerning "{readingDataEvaluated.name_en}", entities from the selected country coordinate{" "}
                {readingDataEvaluated.proportion_coordination_number} of all evaluated projects and{" "}
                {readingDataSuccessful.proportion_coordination_number} of all successful projects.</>,
        }
      break;
    
    case "total_number_involved":
      config.comment = {
        fr: <>Ce graphique présente, pour chaque pilier, la part du pays sélectionné dans l'ensemble des candidats (entités présentes dans les propositions évaluées) et dans l'ensemble des participants (entités présentes dans les projets lauréats), tous pays confondus.</>,
        en: <>This chart shows, for each pillar, the selected country's share of all applicants (entities named in evaluated proposals) and of all participants (entities named in successful projects), across all countries.</>,
        },
        config.readingKey = {
          fr: <>Dans le cadre des appels à projets concernant « {readingDataEvaluated.name_fr} », les entités du pays sélectionné représentent {readingDataEvaluated.proportion_number_involved} de l'ensemble des candidats et{" "}
          {readingDataSuccessful.proportion_number_involved} de l'ensemble des participants.</>,
          en: <>Under calls for proposals concerning "{readingDataEvaluated.name_en}", entities from the selected country account for {readingDataEvaluated.proportion_number_involved} of all applicants and{" "}
          {readingDataSuccessful.proportion_number_involved} of all participants.</>,
        }
      break;

    default:
      config.comment = {
        fr: <>Ce graphique présente, pour chaque pilier, la part du pays sélectionné dans l’ensemble des financements demandés et obtenus par les participants de tous les pays.</>,
        en: <>This chart shows, for each pillar, the selected country’s share of all funding requested and secured by participants from all countries.</>,
        },
        config.readingKey = {
          fr: <>Dans le cadre des appels à projets concernant "{readingDataEvaluated.name_fr}", le montant des financements demandés par les participants du pays sélectionné représentent {readingDataEvaluated.proportion} de l'ensemble des financements demandés et{" "}
          le montant des financements obtenus par les participants du pays sélectionné représentent {readingDataSuccessful.proportion} de l'ensemble des financements obtenus.</>,
          en: <>Under "{readingDataEvaluated.name_en}" calls for proposals, the funding requested by participants from the selected country represents {readingDataEvaluated.proportion} of all funding requested and{" "}
          the funding secured by participants from the selected country represents {readingDataSuccessful.proportion} of all funding secured.</>,
        }
      break;
  }


  return <ChartWrapper config={config} options={options(data, displayType, (titles[displayType] ?? titles.total_fund_eur)[currentLang === "fr" ? "fr" : "en"])} />;
}
