import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useState } from "react";

import { GetData } from "./query";
import { getDefaultParams } from "./utils";
import { getI18nLabel } from "../../../../../../utils";
import i18n from "../../../../i18n-global.json";
import { RenderData } from "./render-data";
import options from "./options";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { useChartColor } from "../../../../../../hooks/useChartColor";
import { EPChartsSources } from "../../../../config";

const config = {
  id: "typeBeneficiariesEvolution",
  title: {
    fr: "Évolution des subventions par pays (en millions d'euros)",
    en: "Evolution of funding by country (in millions of euros)",
  },
  description: {
    fr: "Évolution des subventions obtenues par type d'entités selon les pays du top 10.",
    en: "Temporal evolution of funding obtained by entity types across top 10 countries.",
  },
  comment: {
    fr: (
      <>
        Ce graphique montre l'évolution des subventions obtenues par type de bénéficiaires (Recherche, Organisme public, Organisme privé,
        Etablissements d'enseignement supérieur, Auttres) selon les pays du top 10. Il permet d'analyser les tendances de financement pour chaque type
        de bénéficiares au fil du temps et de comparer les performances des différents pays dans le contexte des projets européens.
      </>
    ),
    en: (
      <>
        This chart illustrates the evolution of funding obtained by beneficiary types (Research, Public bodies, Private bodies, Higher education
        establishments, Others) across the top 10 countries. It allows for analyzing funding trends for each beneficiary type over time and comparing
        the performance of different countries in the context of European projects.
      </>
    ),
  },
  sources: EPChartsSources,
  integrationURL: "/european-projects/components/pages/analysis/positioning/charts/type-beneficiaries-evolution",
};

export default function TypeOfBeneficiariesEvolution() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const selectedCountry = searchParams.get("country_code") || undefined;
  const [selectedEntityType, setSelectedEntityType] = useState("REC");
  const params = getDefaultParams(searchParams);
  const color = useChartColor();

  const entityTypes = [
    { value: "REC", label: getI18nLabel(i18n, "REC") },
    { value: "PUB", label: getI18nLabel(i18n, "PUB") },
    { value: "PRC", label: getI18nLabel(i18n, "PRC") },
    { value: "HES", label: getI18nLabel(i18n, "HES") },
    { value: "OTH", label: getI18nLabel(i18n, "OTH") },
  ];

  const { data, isLoading } = useQuery({
    queryKey: [config.id, params, selectedEntityType],
    queryFn: () => GetData(params, selectedEntityType),
    enabled: !!params,
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  return (
    <div className={`fr-mt-5w chart-container chart-container--${color}`}>
      <ChartWrapper.Title config={config}>
        <div className="fr-my-3w fr-px-1w">
          <div className="fr-select-group">
            <label className="fr-label" htmlFor="entity-type-select-evolution">
              {getI18nLabel(i18n, "type-of-entity-evolution")}
            </label>
            <select className="fr-select" id="entity-type-select-evolution" name="entity-type-select-evolution" value={selectedEntityType} onChange={(e) => setSelectedEntityType(e.target.value)}>
              {entityTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </ChartWrapper.Title>

      <ChartWrapper config={{ ...config, sources: EPChartsSources }} hideTitle={true} options={options(data, currentLang, selectedCountry)} renderData={() => RenderData(data, currentLang)} />
    </div>
  );
}
