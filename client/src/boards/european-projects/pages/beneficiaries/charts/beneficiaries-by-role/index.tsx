import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { getData } from "./query";
import options from "./options";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import { getDefaultParams } from "./utils";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { useChartColor } from "../../../../../../hooks/useChartColor";
import { EPChartsSources } from "../../../../config";

interface CountryAdjectives {
  m: string;
  f: string;
}

interface BeneficiariesByRoleProps {
  countryAdj?: CountryAdjectives;
}

export default function BeneficiariesByRole({ 
  countryAdj = { m: "français", f: "française" } }: 
  BeneficiariesByRoleProps) 
  {
  const [searchParams] = useSearchParams();
  const params = getDefaultParams(searchParams);
  const currentLang = searchParams.get("language") || "fr";
  const color = useChartColor();

  const adjMascPlural = countryAdj.m.endsWith("s") ? countryAdj.m : `${countryAdj.m}s`;
  
  const { data, isLoading } = useQuery({
    queryKey: ["beneficiariesByRole", params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const config = {
    id: "beneficiariesByRole",
    title: {
      fr: `Financements obtenus par les principaux participants ${adjMascPlural} par rôle`,
      en: `Funding secured by top ${adjMascPlural} participants by role`,
    },
    comment: {
      fr: (
        <>
          Ce graphique présente, pour les 10 principaux participants {adjMascPlural}, le financement obtenu en tant que coordinateur et en tant que partenaire dans les projets lauréats.

        </>
      ),
      en: (
        <>
          This chart shows, for the top 10 {adjMascPlural} participants, the funding secured as coordinator and as partner in successful projects.
        </>
      ),
    },
    sources: EPChartsSources,
    integrationURL: "/european-projects/components/pages/analysis/beneficiaries/charts/beneficiaries-by-role",
  };

  return (
    <div className={`fr-mt-5w chart-container chart-container--${color}`}>
      <ChartWrapper config={config} options={options(data, currentLang)} renderData={() => null} />
    </div>
  );
}
