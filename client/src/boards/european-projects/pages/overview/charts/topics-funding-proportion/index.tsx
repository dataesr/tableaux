import { useQuery } from "@tanstack/react-query";

import { getData } from "./query";
import options from "./options";
import { useGetParams } from "./utils";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { EPChartsSources } from "../../../../config.js";

const titles: Record<string, { fr: string; en: string }> = {
  total_fund_eur: {
    fr: "Part des financements demandés et obtenus par le pays sur l'ensemble des pays",
    en: "Funding requested and obtained by the country on all countries",
  },
  total_coordination_number: {
    fr: "Part des coordinations demandées et obtenues par le pays sur l'ensemble des pays",
    en: "Coordinations requested and obtained by the country on all countries",
  },
  total_number_involved: {
    fr: "Part des participations demandées et obtenues par le pays sur l'ensemble des pays",
    en: "Participations requested and obtained by the country on all countries",
  },
};

// TODO: clé de lecture + commentaires
const config = {
  id: "thematicsFundingProportion",
  title: {
    fr: "Part des financement demandés et obtenus par le pays sur l'ensemble des pays",
    en: "Funding requested and obtained by the country on all countries",
  },
  comment: {
    fr: <>Part des financement demandés et obtenus par le pays sur l'ensemble des pays</>,
    en: <>Funding requested and obtained by the country on all countries</>,
  },
  readingKey: {
    fr: (
      <>
        Pour le pilier "Excellence Scientifique", les projets ont demandé 5 835 M€ de subventions, et en ont obtenu 1 154.3 M€, soit un taux de succès
        de 19.80 %.
      </>
    ),
    en: (
      <>
        For the "Scientific Excellence" pillar, projects requested 5,835 M€ in funding and obtained 1,154.3 M€, representing a success rate of 19.8%.
      </>
    ),
  },
  sources: EPChartsSources,
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/destination-funding-proportion",
};

export default function TopicsFundingProportion({ displayType = "total_fund_eur" }: { displayType: string }) {
  const { params, currentLang } = useGetParams();

  const { data, isLoading } = useQuery({
    queryKey: [config.id, params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  return <ChartWrapper config={config} options={options(data, displayType, (titles[displayType] ?? titles.total_fund_eur)[currentLang === "fr" ? "fr" : "en"])} />;
}
