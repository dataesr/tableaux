import { useQuery } from "@tanstack/react-query";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { EPChartsSources } from "../../../../config.js";
import options from "./options";
import { getData } from "./query";
import { readingKey, useGetParams } from "./utils"


export default function ProgramsFundingProportion({ displayType = "total_fund_eur" }: { displayType: string }) {
  // const { params } = useGetParams();
  
  const { params, currentLang, countryN, adjMascPlural } = useGetParams()
  const { data, isLoading } = useQuery({
    queryKey: ["programsFundingProportion", params],
    queryFn: () => getData(params),
  })


  if (isLoading || !data) return <DefaultSkeleton />

  const config: {
    comment?: { fr: React.JSX.Element; en: React.JSX.Element }
    id: string;
    integrationURL: string;
    readingKey?: { fr: React.JSX.Element; en: React.JSX.Element }
    sources: typeof EPChartsSources;
    title?: { en: string; fr: string; }
  } = {
    id: "programsFundingProportion",
    readingKey: readingKey(data, isLoading, displayType, currentLang, countryN, adjMascPlural),
    sources: EPChartsSources,
    integrationURL: "/european-projects/components/pages/analysis/overview/charts/programs-funding-proportion",
  }

  switch (displayType) {
    case "total_coordination_number":
      config.title = {
        fr: `Part des projets coordonnés par ${countryN} sur l'ensemble des coordinations`,
        en: `Share of projects coordinated by ${countryN} out of the total number of coordination roles`
      }
      config.comment = { 
        fr: <>Ce graphique présente, pour les programmes du pilier sélectionné, le nombre de projets évalués et lauréats coordonnés par le pays sélectionné, en part de l'ensemble des coordinations.</>, 
        en: <>This chart shows, for the programmes of the selected pillar, the number of evaluated and successful projects coordinated by the selected country, as a share of all coordinations.</>
       }
      break
    case "total_number_involved":
      config.title = {
        fr: `Part des candidats et de participants ${adjMascPlural} sur l'ensemble des pays`,
        en: `Share of the ${adjMascPlural} applicants and participants out of all countries`
      }
      config.comment = { 
        fr: <>Ce graphique présente, pour les programmes du pilier sélectionné, le nombre de candidats et participants implantés dans le pays sélectionné, en part de l'ensemble des pays.</>, 
        en: <>This chart shows, for the programmes of the selected pillar, the number of applicants and participants established in the selected country, as a share of all countries.</>,      
      }
      break
    case "total_projects":
      config.title = {
        fr: `Part du nombre de projets évalués et lauréats impliquant ${countryN} sur l'ensemble des pays`,
        en: `Share of evaluated and successful projects involving ${countryN} out of all countries`
      }
      config.comment = { 
        fr: <>Ce graphique présente, pour les programmes du pilier sélectionné, le nombre de projets évalués et lauréats impliquant le pays sélectionné, en part de l'ensemble des pays.</>, 
        en: <>This chart shows, for the programmes of the selected pillar, the number of evaluated and successful projects involving the selected country, as a share of all countries.</>,
      }      
      break
    default:
      config.title = {
        fr: `Part des financements demandés et obtenus par ${countryN} sur l'ensemble des pays`,
        en: `Share of funding requested and secured by ${countryN} out of all countries`
      }
      config.comment = {
        fr: <>Ce graphique présente, pour les programmes du pilier sélectionné, les financements demandés et obtenus par le pays sélectionné, en part de l'ensemble des pays.</>,
        en: <>This chart shows, for the programmes of the selected pillar, the funding requested and secured by the selected country, as a share of all countries.</>,
      }      
  }

  return <ChartWrapper config={config} options={options(data, displayType)} />
}
