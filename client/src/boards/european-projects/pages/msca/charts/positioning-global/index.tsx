import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";

import { getData } from "./query";
import Options from "./options";
import { useGetParams, processPositioningData, renderDataTable } from "./utils";
import i18n from "./i18n.json";
import { getI18nLabel } from "../../../../../../utils";
import { getCountryNameWithDe, getCountryNameWithArticle } from "../../../../utils/country-mapping";
import { formatCurrency, formatCurrencyEn, formatNumber } from "../../../../../../utils/format";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import "./styles.scss";

type MetricType = "projects" | "funding";

interface PositioningGlobalChartProps {
  countryCode?: string;
  currentLang?: string;
}

type RankedCountry = { code: string; name: string; value: number; isSelected: boolean };

const withPlaceholders = (text: string, values: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);

// Met l'article en minuscule en milieu de phrase (La France → la France),
// sans toucher aux noms sans article (Madagascar,...)
const lowerArticle = (s: string) => s.replace(/^(Le |La |Les |L')/, (m) => m.toLowerCase());

const formatReadingValue = (value: number, metric: MetricType, lang: "fr" | "en") => {
  if (metric === "funding") return lang === "fr" ? formatCurrency(value) : formatCurrencyEn(value);
  return formatNumber(value);
};

// Tous les placeholders au même endroit
const getPlaceholders = (
  processedData: { countries: RankedCountry[]; selectedCountry?: { country_name_fr: string; country_name_en: string } | null },
  countryCode: string | undefined,
  metric: MetricType,
  lang: string
) => {
  const l = lang as "fr" | "en";
  const [first, second] = processedData.countries;
  const selected = processedData.selectedCountry;
  const selectedName = selected ? (l === "fr" ? selected.country_name_fr : selected.country_name_en) : "";
  const code = countryCode ?? "";

  const withArticle = (c?: RankedCountry) =>
    c ? lowerArticle(getCountryNameWithArticle(c.code, l, c.name)) : "";
  const valueOf = (c?: RankedCountry) => (c ? formatReadingValue(c.value, metric, l) : "");

  return {
    country: l === "fr" ? getCountryNameWithDe(code, selectedName) : getCountryNameWithArticle(code, "en", selectedName),
    metric: getI18nLabel(i18n, metric, l).toLowerCase(),
    firstCountry: withArticle(first),
    firstValue: valueOf(first),
    secondCountry: withArticle(second),
    secondValue: valueOf(second),
  };
};

const getConfig = (metric: MetricType, values: Record<string, string>, lang: string) => {
  const isProjects = metric === "projects";
  const commentKey = isProjects ? "comment-projects" : "comment-funding";
  const readingKeyKey = isProjects ? "reading-key-projects" : "reading-key-funding";
  const text = (key: string, l: string) => withPlaceholders(getI18nLabel(i18n, key, l), values);
  const title = text("main-title-with-country", lang);

  return {
    id: isProjects ? "mscaPositioningGlobalProjects" : "mscaPositioningGlobalFunding",
    idQuery: "mscaPositioningGlobal",
    title: { fr: title, en: title, className: "fr-mt-2w fr-ml-1w" },
    comment: { fr: <>{text(commentKey, "fr")}</>, en: <>{text(commentKey, "en")}</> },
    readingKey: { fr: <>{text(readingKeyKey, "fr")}</>, en: <>{text(readingKeyKey, "en")}</> },
    integrationURL: isProjects
      ? "/european-projects/components/pages/msca/charts/positioning-global"
      : "/european-projects/components/pages/msca/charts/positioning-global-funding",
  };
};

function PositioningGlobalChartInner({ countryCode: propCountryCode, currentLang: propLang }: PositioningGlobalChartProps) {
  const [metric, setMetric] = useState<MetricType>("funding");
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

  if (processedData.countries.length === 0) {
    return (
      <div className="fr-alert fr-alert--info">
        <p>{getI18nLabel(i18n, "no-data", currentLang)}</p>
      </div>
    );
  }

const options = Options({ processedData, currentLang });
const values = getPlaceholders(processedData, countryCode, metric, currentLang);
const config = getConfig(metric, values, currentLang);

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
