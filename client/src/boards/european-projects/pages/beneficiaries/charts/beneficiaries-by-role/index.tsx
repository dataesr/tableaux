import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { getData } from "./query";
import options from "./options";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import { getDefaultParams } from "./utils";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { useChartColor } from "../../../../../../hooks/useChartColor";
import { EPChartsSources } from "../../../../config";

export default function BeneficiariesByRole() {
  const [searchParams] = useSearchParams();
  const params = getDefaultParams(searchParams);
  const currentLang = searchParams.get("language") || "fr";
  const color = useChartColor();

  const { data, isLoading } = useQuery({
    queryKey: ["beneficiariesByRole", params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const config = {
    id: "beneficiariesByRole",
    title: {
      fr: "Top 10 des bénéficiaires par rôle en fonction des subventions allouées",
      en: "Top 10 beneficiaries by role based on allocated funding",
    },
    comment: {
      fr: (
        <>
          Ce graphique présente les 10 principaux bénéficiaires de financements européens, classés par montant total décroissant (somme des
          subventions en tant que coordinateur et partenaire). Chaque barre représente un bénéficiaire, décomposée entre la part reçue en tant que
          coordinateur et la part reçue en tant que partenaire.
        </>
      ),
      en: (
        <>
          This chart presents the top 10 beneficiaries of European funding, ranked by total funding in descending order (sum of grants as coordinator
          and partner). Each bar represents a beneficiary, broken down between the share received as coordinator and the share received as partner.
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
