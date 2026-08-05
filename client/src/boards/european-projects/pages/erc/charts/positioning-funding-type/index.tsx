import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";

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
    id: isProjects ? "ercPositioningFundingTypeProjects" : "ercPositioningFundingTypeFunding",
    idQuery: "ercPositioningFundingType",
    title: {
      en: getI18nLabel(i18n, isProjects ? "title-projects" : "title-funding", "en"),
      fr: getI18nLabel(i18n, isProjects ? "title-projects" : "title-funding", "fr"),
    },
    comment: {
      fr: <>{getI18nLabel(i18n, isProjects ? "comment-projects" : "comment-funding", "fr")}</>,
      en: <>{getI18nLabel(i18n, isProjects ? "comment-projects" : "comment-funding", "en")}</>,
    },
    readingKey: {
      fr: <>{getI18nLabel(i18n, isProjects ? "reading-key-projects" : "reading-key-funding", "fr")}</>,
      en: <>{getI18nLabel(i18n, isProjects ? "reading-key-projects" : "reading-key-funding", "en")}</>,
    },
    integrationURL: isProjects
      ? "/european-projects/components/pages/erc/charts/positioning-funding-type"
      : "/european-projects/components/pages/erc/charts/positioning-funding-type-funding",
  };
};

function PositioningFundingTypeChartInner({ countryCode: propCountryCode, currentLang: propLang }: PositioningFundingTypeChartProps) {
  const [metric, setMetric] = useState<MetricType>("projects");
  const [fundingType, setFundingType] = useState<FundingTypeCode>(FUNDING_TYPES[0].code);

  const { params, currentLang: urlLang, countryCode: urlCountryCode } = useGetParams();
  const currentLang = propLang || urlLang;
  const countryCode = propCountryCode || urlCountryCode;

  // Construire les params avec le type de financement sélectionné
  const queryParams = params ? `${params}&destination_code=${fundingType}` : `destination_code=${fundingType}`;

  const { data, isLoading } = useQuery({
    queryKey: ["ercPositioningFundingType", queryParams],
    queryFn: () => getData(queryParams),
    enabled: params !== "",
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const processedData = processData(data, countryCode, currentLang, metric, fundingType);

  // Nom du pays avec préposition
  const fallbackName = processedData.selectedCountry
    ? currentLang === "fr"
      ? processedData.selectedCountry.country_name_fr
      : processedData.selectedCountry.country_name_en
    : "";

  const countryName =
    currentLang === "fr" ? getCountryNameWithDe(countryCode, fallbackName) : getCountryNameWithArticle(countryCode, "en", fallbackName);

  const fundingTypeLabel = FUNDING_TYPES.find((f) => f.code === fundingType)?.label[currentLang as "fr" | "en"] ?? fundingType;

  const metricLabel = getI18nLabel(i18n, metric === "projects" ? "projects" : "funding", currentLang).toLowerCase();
  const title = getI18nLabel(i18n, "main-title-with-country", currentLang)
    .replace("{country}", countryName)
    .replace("{metric}", metricLabel)
    .replace("{fundingType}", fundingTypeLabel);

  const options = processedData.countries.length > 0 ? Options({ processedData, currentLang }) : null;

  const config = getConfig(metric);

  return (
    <div className="positioning-funding-type-chart">
      <h3>{title}</h3>
      <div className="positioning-funding-type-chart__controls">
        <div className="select-wrapper">
          <div className="fr-select-group">
            <label className="fr-label" htmlFor="funding-type-select">
              {getI18nLabel(i18n, "select-funding-type", currentLang)}
            </label>
            <select className="fr-select" id="funding-type-select" value={fundingType} onChange={(e) => setFundingType(e.target.value as FundingTypeCode)}>
              {FUNDING_TYPES.map((ft) => (
                <option key={ft.code} value={ft.code}>
                  {ft.label[currentLang as "fr" | "en"]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="segmented-wrapper">
          <SegmentedControl className="fr-segmented--sm" name="positioning-funding-type-metric">
            <SegmentedElement checked={metric === "projects"} label={getI18nLabel(i18n, "projects", currentLang)} onClick={() => setMetric("projects")} value="projects" />
            <SegmentedElement checked={metric === "funding"} label={getI18nLabel(i18n, "funding", currentLang)} onClick={() => setMetric("funding")} value="funding" />
          </SegmentedControl>
        </div>
      </div>

      {processedData.countries.length === 0 ? (
        <div className="fr-alert fr-alert--info">
          <p>{getI18nLabel(i18n, "no-data", currentLang)}</p>
        </div>
      ) : (
        <div className="chart-container chart-container--default">
          <ChartWrapper config={config} options={options} renderData={() => renderDataTable(processedData, currentLang)} />
        </div>
      )}
    </div>
  );
}

export default function PositioningFundingTypeChart({ countryCode, currentLang }: PositioningFundingTypeChartProps) {
  return <PositioningFundingTypeChartInner countryCode={countryCode} currentLang={currentLang} />;
}
