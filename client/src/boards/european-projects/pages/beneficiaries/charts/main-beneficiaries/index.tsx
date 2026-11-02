import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import Cookies from "js-cookie";

import { GetData } from "./query";
import options from "./options";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import { getDefaultParams } from "./utils";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";

const config = {
  id: "mainBeneficiaries",
  title: {
    fr: "Participants {} qui concentrent 50 % des financements allouées ",
    en: "Main beneficiaries who concentrate 50% of the grants allocated to teams",
  },
  subtitle: "",
  description: {
    fr: "Ad duis occaecat voluptate deserunt tempor enim nulla officia.",
    en: "Ad duis occaecat voluptate deserunt tempor enim nulla officia.",
  },
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/main-beneficiaries",
};

export default function MainBeneficiaries() {
  const [searchParams] = useSearchParams();
  const params = getDefaultParams(searchParams);
  const country_code = searchParams.get("country_code") || "FRA";
  const currentLang = searchParams.get("language") || "fr";

  const { data, isLoading } = useQuery({
    queryKey: [
      config.id,
      params,
      Cookies.get("selectedPillars"),
      Cookies.get("selectedPrograms"),
      Cookies.get("selectedThematics"),
      Cookies.get("selectedDestinations"),
      country_code,
    ],
    queryFn: () => GetData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  return (
    <ChartWrapper
      config={config}
      options={options(data, currentLang)}
      renderData={() => null} // TODO: add data table
    />
  );
}
