import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";

import { getData } from "./query";
import Options from "./options";
import { useGetParams, processPositioningData, renderDataTable } from "./utils";
import i18n from "./i18n.json";
import { getI18nLabel } from "../../../../../../utils";
import { getCountryNameWithDe, getCountryNameWithArticle } from "../../../../utils/country-mapping";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import "./styles.scss";

type MetricType = "projects" | "funding";

interface PositioningGlobalChartProps {
  countryCode?: string;
  currentLang?: string;
}

const getConfig = (metric: MetricType) => {
  const isProjects = metric === "projects";
  return {
    id: isProjects ? "mscaPositioningGlobalProjects" : "mscaPositioningGlobalFunding",
    idQuery: "mscaPositioningGlobal",
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
      ? "/european-projects/components/pages/msca/charts/positioning-global"
      : "/european-projects/components/pages/msca/charts/positioning-global-funding",
  };
};

function PositioningGlobalChartInner({ countryCode: propCountryCode, currentLang: propLang }: PositioningGlobalChartProps) {
  const [metric, setMetric] = useState<MetricType>("projects");
  const { params, currentLang: urlLang, countryCode: urlCountryCode } = useGetParams();
  const currentLang = propLang || urlLang;
  const countryCode = propCountryCode || urlCountryCode;

  const { data, isLoading } = useQuery({
    queryKey: ["mscaPositioningGlobal", params],
    queryFn: () => getData(params),
    enabled: params !== "",
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const processedData = processPositioningData(data, countryCode, currentLang, metric);

  // Récupérer le nom du pays avec préposition appropriée
  const fallbackName = processedData.selectedCountry
    ? currentLang === "fr"
      ? processedData.selectedCountry.country_name_fr
      : processedData.selectedCountry.country_name_en
    : "";

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
  const metricLabel = getI18nLabel(i18n, metric === "projects" ? "projects" : "funding", currentLang).toLowerCase();
  const title = getI18nLabel(i18n, "main-title-with-country", currentLang).replace("{country}", countryName).replace("{metric}", metricLabel);

  config.title.fr = title;
  config.title.en = title;
  return (
    <div className="positioning-global-chart">
      <div className="positioning-global-chart__controls">
        <SegmentedControl className="fr-segmented--sm" name="positioning-global-metric">
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

export default function PositioningGlobalChart({ countryCode, currentLang }: PositioningGlobalChartProps) {
  return <PositioningGlobalChartInner countryCode={countryCode} currentLang={currentLang} />;
}
