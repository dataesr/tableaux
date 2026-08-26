import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SegmentedControl, SegmentedElement, Select, SelectOption } from "@dataesr/dsfr-plus";

import { getData } from "./query";
import Options from "./options";
import { useGetParams, processData, renderDataTable, FUNDING_TYPES, type FundingTypeCode } from "./utils";
import i18n from "./i18n.json";
import { getI18nLabel } from "../../../../../../utils";
import { getCountryNameWithDe, getCountryNameWithArticle } from "../../../../utils/country-mapping";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import "./styles.scss";

type MetricType = "projects" | "funding";

interface PositioningFundingTypeChartProps {
  countryCode?: string;
  currentLang?: string;
}

const getConfig = (metric: MetricType) => {
  const isProjects = metric === "projects";
  return {
    id: isProjects ? "mscaPositioningFundingTypeProjects" : "mscaPositioningFundingTypeFunding",
    idQuery: "mscaPositioningFundingType",
    title: {
      en: getI18nLabel(i18n, isProjects ? "title-projects" : "title-funding", "en"),
      fr: getI18nLabel(i18n, isProjects ? "title-projects" : "title-funding", "fr"),
      className: "fr-mt-2w fr-ml-1w",
    },
    comment: {
      fr: <>{getI18nLabel(i18n, isProjects ? "comment-projects" : "comment-funding", "fr")}</>,
      en: <>{getI18nLabel(i18n, isProjects ? "comment-projects" : "comment-funding", "en")}</>,
    },
    readingKey: {
      fr: <>{getI18nLabel(i18n, isProjects ? "reading-key-projects" : "reading-key-funding", "fr")}</>,
      en: <>{getI18nLabel(i18n, isProjects ? "reading-key-projects" : "reading-key-funding", "en")}</>,
    },
    integrationURL: isProjects ? "/european-projects/components/pages/msca/charts/positioning-funding-type" : "/european-projects/components/pages/msca/charts/positioning-funding-type-funding",
  };
};

function PositioningFundingTypeChartInner({ countryCode: propCountryCode, currentLang: propLang }: PositioningFundingTypeChartProps) {
  const [metric, setMetric] = useState<MetricType>("projects");
  const [fundingType, setFundingType] = useState<FundingTypeCode>(FUNDING_TYPES[0].code);

  const { params, currentLang: urlLang, countryCode: urlCountryCode } = useGetParams();
  const currentLang = propLang || urlLang;
  const countryCode = propCountryCode || urlCountryCode;

  const { data, isLoading } = useQuery({
    queryKey: ["mscaPositioningFundingType", params, fundingType],
    queryFn: () => getData(`${params}&funding_type=${fundingType}`),
    enabled: params !== "",
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const processedData = processData(data, countryCode, currentLang, metric, fundingType);

  // Récupérer le nom du pays avec préposition appropriée
  const fallbackName = processedData.selectedCountry
    ? currentLang === "fr"
      ? processedData.selectedCountry.country_name_fr
      : processedData.selectedCountry.country_name_en
    : "";

  // Pour le français, utiliser "de" + article (ex: "de la France", "de l'Allemagne")
  // Pour l'anglais, utiliser le nom simple (ex: "France", "Germany")
  const countryName =
    currentLang === "fr" ? getCountryNameWithDe(countryCode, fallbackName) : getCountryNameWithArticle(countryCode, "en", fallbackName);

  if (processedData.countries.length === 0) {
    return (
      <div className="fr-alert fr-alert--info">
        <p>{getI18nLabel(i18n, "no-data", currentLang)}</p>
      </div>
    );
  }

  const options = Options({
    processedData,
    currentLang,
  });

  const config = getConfig(metric);

  // Construire le titre dynamique avec le nom du pays
  const metricLabel = getI18nLabel(i18n, metric === "projects" ? "projects" : "funding", currentLang).toLowerCase();
  const title = getI18nLabel(i18n, "main-title-with-country", currentLang).replace("{country}", countryName).replace("{metric}", metricLabel);

  config.title.fr = title;
  config.title.en = title;
  return (
    <div className="positioning-funding-type-chart">
      <div className="positioning-funding-type-chart__controls">
        <Select label={getI18nLabel(i18n, "funding-type", currentLang)} selectedKey={fundingType} onSelectionChange={(key) => setFundingType(key as FundingTypeCode)}>
          {FUNDING_TYPES.map((type) => (
            <SelectOption key={type.code}>{type.label[currentLang]}</SelectOption>
          ))}
        </Select>
        <SegmentedControl className="fr-segmented--sm" name="positioning-funding-type-metric">
          <SegmentedElement checked={metric === "projects"} label={getI18nLabel(i18n, "projects", currentLang)} onClick={() => setMetric("projects")} value="projects" />
          <SegmentedElement checked={metric === "funding"} label={getI18nLabel(i18n, "funding", currentLang)} onClick={() => setMetric("funding")} value="funding" />
        </SegmentedControl>
      </div>
      <div className="chart-container chart-container--default">
        <ChartWrapper config={config} options={options} renderData={() => renderDataTable(processedData, currentLang)} />
      </div>
    </div>
  );
}

export default function PositioningFundingTypeChart({ countryCode, currentLang }: PositioningFundingTypeChartProps) {
  return <PositioningFundingTypeChartInner countryCode={countryCode} currentLang={currentLang} />;
}
