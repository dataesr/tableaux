import { useQuery } from "@tanstack/react-query";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { EPChartsSources } from "../../../../config.js";
import options from "./options";
import { getData } from "./query";
import { readingKey, useGetParams } from "./utils";

export default function ProgramsFundingProportion({ displayType = "total_fund_eur" }: { displayType: string }) {
  const { params } = useGetParams();
  const { data, isLoading } = useQuery({
    queryKey: ["programsFundingProportion", params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const config: {
    comment?: { fr: React.JSX.Element; en: React.JSX.Element };
    id: string;
    integrationURL: string;
    readingKey?: { fr: React.JSX.Element; en: React.JSX.Element };
    sources: typeof EPChartsSources;
    title?: { en: string; fr: string; };
  } = {
    id: "programsFundingProportion",
    comment: {
      fr: <>Part des financement demandés et obtenus par le pays sur l'ensemble des pays</>,
      en: <>Funding requested and obtained by the country on all countries</>,
    },
    readingKey: readingKey(data, isLoading),
    sources: EPChartsSources,
    integrationURL: "/european-projects/components/pages/analysis/overview/charts/programs-funding-proportion",
  };

  switch (displayType) {
    case "total_fund_eur":
      config.title = {
        fr: "Part des financements demandés et obtenus par le pays sur l'ensemble des pays",
        en: "Funding requested and obtained by the country on all countries",
      }
      break;
    case "total_coordination_number":
      config.title = {
        fr: "Part des coordinations demandées et obtenues par le pays sur l'ensemble des pays",
        en: "Coordinations requested and obtained by the country on all countries",
      }
      break;
    case "total_number_involved":
      config.title = {
        fr: "Part des participations demandées et obtenues par le pays sur l'ensemble des pays",
        en: "Participations requested and obtained by the country on all countries",
      }
      break;
    case "total_projects":
      config.title = {
        fr: "Part des projets du pays sur l'ensemble des pays",
        en: "Share of the country's projects on all countries",
      }
      break;
    default:
      break;
  }

  return <ChartWrapper config={config} options={options(data, displayType)} />;
}
