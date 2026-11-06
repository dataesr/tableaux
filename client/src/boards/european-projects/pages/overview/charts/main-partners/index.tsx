import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { useChartColor } from "../../../../../../hooks/useChartColor";
import { EPChartsSources } from "../../../../config";
import { getCountryNameWithArticle } from "../../../../utils/country-mapping";
import getOptions from "./options";
import { getData } from "./query";
import { readingKey, renderDataTable, useGetParams } from "./utils";

interface CountryAdjectives {
  m: string;
  f: string;
}

interface MainPartnersProps {
  countryAdj?: CountryAdjectives;
}


export default function MainPartners({ 
  countryAdj = { m: "français", f: "française" } }: 
  MainPartnersProps) 
  {
  const params = useGetParams();
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const countryCode = searchParams.get("country_code") || "FRA";
  const color = useChartColor();

  const adjMascPlural = countryAdj.m.endsWith("s") ? countryAdj.m : `${countryAdj.m}s`;
  // country name with article, but in lowercase if name is in middle sentence (la France)
  const country = getCountryNameWithArticle(countryCode, currentLang as "fr" | "en").replace(/^(Le |La |Les |L')/, (m) => m.toLowerCase());
  
  const { data, isLoading } = useQuery({
    queryKey: ["mainPartners", params],
    queryFn: () => getData(params),
    enabled: !!params,
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const config = {
    id: "mainPartners",
    title: {
      fr: `Participants ${adjMascPlural} qui concentrent 50 % des financements obtenus par ${country}`,
      en: `${adjMascPlural} participants that account for 50% of the funding secured by ${country}`,
    },
    comment: {
      fr: (
        <>
          Ce graphique présente les participants {adjMascPlural} qui concentrent 50 % du total des financements obtenus par {country}. 
          Il permet d'identifier les acteurs clés dans la répartition des financements et d'analyser leur rôle dans le contexte des projets
          européens. Chaque barre représente un participant, avec la longueur de la barre indiquant le montant total des financements obtenus. Les
          participants sont classés par ordre décroissant de financement, permettant ainsi d'identifier rapidement les acteurs les plus importants.
        </>
      ),
      en: (
        <>
          This chart shows the {adjMascPlural} participants that account for 50% of the total funding secured by {country}. 
          It helps identify the key players in the distribution of funding and analyse their role in the context of European projects. 
          Each bar represents a participant, with the length of the bar indicating the total amount of funding secured. 
          Participants are ranked in descending order of funding, making it easy to quickly identify the most important players.
        </>
      ),
    },
    readingKey: readingKey(data),
    sources: EPChartsSources,
    integrationURL: "/european-projects/components/pages/analysis/overview/charts/main-beneficiaries",
  };

  return (
    <div className={`fr-mt-5w chart-container chart-container--${color}`}>
      <ChartWrapper config={config} options={getOptions(data, currentLang)} renderData={() => renderDataTable(data, currentLang)} />
    </div>
  );
}
