import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { getData } from "./query";
import options from "./options";
import { useGetParams, renderDataTable } from "./utils";
import { EPChartsSources } from "../../../../config";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
const title = {
  fr: "Part des financement demandés et obtenus par le pays sur l'ensemble des pays",
  en: "Funding requested and obtained by the country on all countries",
};
const config = {
  id: "pillarsFundingProportion",
  comment: {
    fr: <>Ce graphique affiche la part des financements demandés et obtenus (en M€) par le pays sélectionné sur l'ensemble des pays, pour chaque pilier.</>,
    en: <>This chart displays the share of funding requested and obtained (in M€) by the selected country across all countries, for each pillar.</>,
  },
  readingKey: {
    fr: <>Pour le pilier "Excellence Scientifique", les projets du pays sélectionné ont demandé 583.5 M€ de financements, et en ont obtenu 115.4 M€, soit respectivement 10% et 10% des montants demandés et obtenus par l'ensemble des pays.</>,
    en: <>For the "Scientific Excellence" pillar, projects from the selected country requested 583.5 M€ in funding and obtained 115.4 M€, representing 10% and 10% of the amounts requested and obtained by all countries, respectively.</>,
  },
  sources: EPChartsSources,
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/destination-funding-proportion",
};

export default function PillarsFundingProportion() {
  const params = useGetParams();
    const [searchParams] = useSearchParams();
    const currentLang = searchParams.get("language") || "fr";
  
  const { data, isLoading } = useQuery({
    queryKey: [config.id, params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  return (
    <ChartWrapper
      config={config}
      options={options(data, currentLang === "fr" ? title.fr : title.en)}
      renderData={() => renderDataTable(data, "fr")}
    />
  );
}
