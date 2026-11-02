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
      fr: "Principaux participants bénéficiaires {} par rôle",
      en: "Top beneficiary participants {} by role",
    },
    comment: {
      fr: (
        <>
          Ce graphique présente les 10 principaux bénéficiaires des financements alloués par la CE, classés par montant total décroissant (somme des
          financements en tant que coordinateur et partenaire). Chaque barre représente un participant bénéficiaire, décomposée entre la part obtenue en tant que
          coordinateur et celle en tant que partenaire.
        </>
      ),
      en: (
        <>
          This chart shows the top 10 beneficiaries of funding awarded by the EC, ranked by total amount in descending order (sum of
          funding received as coordinator and as partner). Each bar represents a beneficiary participant, broken down into the share secured as
          coordinator and the share secured as partner.
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
