import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { getData } from "./query";
import options from "./options";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import { readingKey, useGetParams, renderDataTable } from "./utils";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { useChartColor } from "../../../../../../hooks/useChartColor";
import { EPChartsSources } from "../../../../config";

export default function MainPartners() {
  const params = useGetParams();
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const color = useChartColor();

  const { data, isLoading } = useQuery({
    queryKey: ["mainPartners", params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const config = {
    id: "mainPartners",
    title: {
      fr: "Liste des principaux bénéficiaires récupérants 50% des financements",
      en: "List of main beneficiaries receiving 50% of subsidies",
    },
    comment: {
      fr: (
        <>
          Ce graphique présente les principaux bénéficiaires des financements européens, en mettant en évidence ceux qui reçoivent 50% des fonds
          alloués. Il permet d'identifier les acteurs clés dans la répartition des financements et d'analyser leur rôle dans le contexte des projets
          européens. Chaque barre représente un bénéficiaire, avec la longueur de la barre indiquant le montant total des financements reçus. Les
          bénéficiaires sont classés par ordre décroissant de financement, permettant ainsi d'identifier rapidement les acteurs les plus importants.
        </>
      ),
      en: (
        <>
          This chart presents the main beneficiaries of European funding, highlighting those who receive 50% of the allocated funds. It helps identify
          key players in the distribution of funding and analyze their role in the context of European projects. Each bar represents a beneficiary,
          with the length of the bar indicating the total amount of funding received. Beneficiaries are ranked in descending order of funding,
          allowing for quick identification of the most important actors.
        </>
      ),
    },
    readingKey: readingKey(data),
    sources: EPChartsSources,
    integrationURL: "/european-projects/components/pages/analysis/overview/charts/main-beneficiaries",
  };

  return (
    <div className={`fr-mt-5w chart-container chart-container--${color}`}>
      <ChartWrapper config={config} options={options(data, currentLang)} renderData={() => renderDataTable(data, currentLang)} />
    </div>
  );
}
