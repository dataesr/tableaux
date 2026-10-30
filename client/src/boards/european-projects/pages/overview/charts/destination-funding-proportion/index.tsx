import { useQuery } from "@tanstack/react-query";

import { getData } from "./query";
import options from "./options";
import { useGetParams } from "./utils";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";

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

const config = {
  id: "destinationFundingProportion",
  title: {
    fr: "Part des financement demandés et obtenus par le pays sur l'ensemble des pays",
    en: "Funding requested and obtained by the country on all countries",
  },
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/destination-funding-proportion",
};

export default function DestinationFundingProportion({ displayType = "total_fund_eur" }: { displayType?: string }) {
  const { params, currentLang } = useGetParams();
  const { data, isLoading } = useQuery({
    queryKey: [config.id, params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  return <ChartWrapper config={config} options={options(data, displayType, (titles[displayType] ?? titles.total_fund_eur)[currentLang === "fr" ? "fr" : "en"])} />;
}
