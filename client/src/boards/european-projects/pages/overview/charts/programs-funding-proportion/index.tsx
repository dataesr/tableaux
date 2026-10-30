import { useQuery } from "@tanstack/react-query";

import { EPChartsSources } from "../../../../config.js";
import { getData } from "./query";
import { readingKey, useGetParams } from "./utils";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import options from "./options";

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
  total_projects: {
    fr: "Part des projets du pays sur l'ensemble des pays",
    en: "Share of the country's projects on all countries",
  },
};

export default function ProgramsFundingProportion({ displayType = "total_fund_eur" }: { displayType: string }) {
  const { params, currentLang } = useGetParams();
  const { data, isLoading } = useQuery({
    queryKey: ["programsFundingProportion", params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const config = {
    id: "programsFundingProportion",
    comment: {
      fr: <>Part des financement demandés et obtenus par le pays sur l'ensemble des pays</>,
      en: <>Funding requested and obtained by the country on all countries</>,
    },
    readingKey: readingKey(data, isLoading),
    sources: EPChartsSources,
    integrationURL: "/european-projects/components/pages/analysis/overview/charts/programs-funding-proportion",
  };

  return <ChartWrapper config={config} options={options(data, displayType, (titles[displayType] ?? titles.total_fund_eur)[currentLang === "fr" ? "fr" : "en"])} />;
}
