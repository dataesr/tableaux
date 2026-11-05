import { Col, Row, SegmentedControl, SegmentedElement, Title } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { getI18nLabel } from "../../../../../../utils";
import { formatCurrency, formatCurrencyEn, formatNumber } from "../../../../../../utils/format";
import { getCountryNameWithArticle, getCountryNameWithDe } from "../../../../utils/country-mapping";
import i18n from "./i18n.json";
import Options from "./options";
import { getData } from "./query";
import { processPositioningData, renderDataTable, useGetParams } from "./utils";

type MetricType = "projects" | "funding";

interface PositioningGlobalChartProps {
  countryCode?: string;
  currentLang?: string;
}

// calculation of each country’s rank for inclusion in the readingkey
type RankedCountry = { code: string; name: string; value: number; isSelected: boolean };

// replacement each {item} with the corresponding value in the 'values' object
const withPlaceholders = (text: string, values: Record<string, string>) => text.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);

// Lowercases the article in mid-sentence (La France → la France),
// without touching names that have no article (Madagascar, ...)
const lowerArticle = (s: string) => s.replace(/^(Le |La |Les |L')/, (m) => m.toLowerCase());

// formatting numerical values to display in readingkeys
const formatReadingValue = (value: number, metric: MetricType, lang: "fr" | "en") => {
  if (metric === "funding") return lang === "fr" ? formatCurrency(value) : formatCurrencyEn(value);
  return formatNumber(value);
};

// Grouping all placeholders and collecting the measurements to be displayed
const getPlaceholders = (processedData: { countries: RankedCountry[]; selectedCountry?: { country_name_fr: string; country_name_en: string } | null }, countryCode: string | undefined, metric: MetricType, lang: string) => {
  const l = lang as "fr" | "en";
  const [first, second] = processedData.countries;
  const selected = processedData.selectedCountry;
  const selectedName = selected ? (l === "fr" ? selected.country_name_fr : selected.country_name_en) : "";
  const code = countryCode ?? "";

  const withArticle = (c?: RankedCountry) => (c ? lowerArticle(getCountryNameWithArticle(c.code, l, c.name)) : "");
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

// adding dictionary of placeholder names → replacement text { country: "de la France", firstValue: "€598.6 million" }
const getConfig = (metric: MetricType, values: Record<string, string>, lang: string) => {
  const isProjects = metric === "projects";
  const commentKey = isProjects ? "comment-projects" : "comment-funding";
  const readingKeyKey = isProjects ? "reading-key-projects" : "reading-key-funding";
  const text = (key: string, l: string) => withPlaceholders(getI18nLabel(i18n, key, l), values);

  return {
    id: isProjects ? "mscaPositioningGlobalProjects" : "mscaPositioningGlobalFunding",
    idQuery: "mscaPositioningGlobal",
    title: getI18nLabel(i18n, isProjects ? "chart-title-projects" : "chart-title-funding", lang),
    comment: { fr: <>{text(commentKey, "fr")}</>, en: <>{text(commentKey, "en")}</> },
    readingKey: { fr: <>{text(readingKeyKey, "fr")}</>, en: <>{text(readingKeyKey, "en")}</> },
    integrationURL: `/european-projects/components/pages/msca/charts/${isProjects ? "positioning-global" : "positioning-global-funding"}`,
  };
};

export default function PositioningGlobalChart({ countryCode: propCountryCode, currentLang: propLang }: PositioningGlobalChartProps) {
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
    )
  }

  const options = Options({ processedData, currentLang });
  const values = getPlaceholders(processedData, countryCode, metric, currentLang);
  const config = getConfig(metric, values, currentLang);

  return (
    <>
      <Row>
        <Col>
          <Title as="h2" look="h5">
            {withPlaceholders(getI18nLabel(i18n, "main-title-with-country", currentLang), values)}
          </Title>
        </Col>
      </Row>
      <Row className="fr-mb-1w">
        <Col className="text-right">
          <SegmentedControl className="fr-segmented--sm" name="positioning-global-metric" label={getI18nLabel(i18n, "display-type", currentLang)}>
            <SegmentedElement checked={metric === "projects"} label={getI18nLabel(i18n, "projects", currentLang)} onClick={() => setMetric("projects")} value="projects" />
            <SegmentedElement checked={metric === "funding"} label={getI18nLabel(i18n, "funding", currentLang)} onClick={() => setMetric("funding")} value="funding" />
          </SegmentedControl>
        </Col>
      </Row>
      <Row className="chart-container chart-container--default">
        <ChartWrapper config={config} options={options} renderData={() => renderDataTable(processedData, currentLang)} />
      </Row>
    </>
  );
}