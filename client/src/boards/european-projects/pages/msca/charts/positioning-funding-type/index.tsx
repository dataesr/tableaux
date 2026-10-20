import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SegmentedControl, SegmentedElement, Select, SelectOption } from "@dataesr/dsfr-plus";

import { getData } from "./query";
import Options from "./options";
import { useGetParams, processData, renderDataTable, FUNDING_TYPES, type FundingTypeCode } from "./utils";
import i18n from "./i18n.json";
import { getI18nLabel } from "../../../../../../utils";
import { getCountryNameWithDe, getCountryNameWithArticle } from "../../../../utils/country-mapping";
import { formatNumberLang, formatCurrency, formatCurrencyEn } from "../../../../../../utils/format";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import "./styles.scss";

type MetricType = "projects" | "funding";

interface PositioningFundingTypeChartProps {
  countryCode?: string;
  currentLang?: string;
}

// calculation of each country’s rank for inclusion in the readingkey
type RankedCountry = { code: string; name: string; value: number; isSelected: boolean };

// replacement each {item} with the corresponding value in the 'values' object
const withPlaceholders = (text: string, values: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);

// Lowercases the article in mid-sentence (La France → la France),
// without touching names that have no article (Madagascar, ...)
const lowerArticle = (s: string) => s.replace(/^(Le |La |Les |L')/, (m) => m.toLowerCase());

// formatting numerical values to display in readingkeys
const formatReadingValue = (value: number, metric: MetricType, lang: "fr" | "en") => {
  if (metric === "funding") return lang === "fr" ? formatCurrency(value) : formatCurrencyEn(value);
  return formatNumberLang(value);
};

// Grouping all placeholders and collecting the measurements to be displayed
const getPlaceholders = (
  processedData: { countries: RankedCountry[]; selectedCountry?: { country_name_fr: string; country_name_en: string } | null },
  countryCode: string | undefined,
  metric: MetricType,
  lang: string,
  fundingType: FundingTypeCode
) => {
  const l = lang as "fr" | "en";
  const [first, second] = processedData.countries;
  const selected = processedData.selectedCountry;
  const selectedName = selected ? (l === "fr" ? selected.country_name_fr : selected.country_name_en) : "";
  const code = countryCode ?? "";
  const fundingTypeLabel = FUNDING_TYPES.find((t) => t.code === fundingType)?.label[l] ?? fundingType;


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
    fundingType: fundingTypeLabel,
  };
};

const getConfig = (metric: MetricType, values: Record<string, string>, lang: string) => {
  const isProjects = metric === "projects";
  const commentKey = isProjects ? "comment-projects" : "comment-funding";
  const readingKeyKey = isProjects ? "reading-key-projects" : "reading-key-funding";
  const text = (key: string, l: string) => withPlaceholders(getI18nLabel(i18n, key, l), values);
  const title = text("main-title-with-country", lang);

  return {
    id: isProjects ? "mscaPositioningFundingTypeProjects" : "mscaPositioningFundingTypeFunding",
    idQuery: "mscaPositioningFundingType",
    title: { fr: title, en: title, className: "fr-mt-2w fr-ml-1w"},
    comment: { fr: <>{text(commentKey, "fr")}</>, en: <>{text(commentKey, "en")}</> },
    readingKey: { fr: <>{text(readingKeyKey, "fr")}</>, en: <>{text(readingKeyKey, "en")}</> },
    integrationURL: isProjects ? "/european-projects/components/pages/msca/charts/positioning-funding-type" : "/european-projects/components/pages/msca/charts/positioning-funding-type-funding",
  };
};

function PositioningFundingTypeChartInner({ countryCode: propCountryCode, currentLang: propLang }: PositioningFundingTypeChartProps) {
  const [metric, setMetric] = useState<MetricType>("funding");
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

  // DEJA TRAITE DANS getPlaceholders
  // Récupérer le nom du pays avec préposition appropriée
  // const fallbackName = processedData.selectedCountry
  //   ? currentLang === "fr"
  //     ? processedData.selectedCountry.country_name_fr
  //     : processedData.selectedCountry.country_name_en
  //   : "";

  // Pour le français, utiliser "de" + article (ex: "de la France", "de l'Allemagne")
  // Pour l'anglais, utiliser le nom simple (ex: "France", "Germany")
  // const countryName =
  //   currentLang === "fr" ? getCountryNameWithDe(countryCode, fallbackName) : getCountryNameWithArticle(countryCode, "en", fallbackName);

  if (processedData.countries.length === 0) {
    return (
      <div className="fr-alert fr-alert--info">
        <p>{getI18nLabel(i18n, "no-data", currentLang)}</p>
      </div>
    );
  }

  // adding values with getPlaceholders values and calling getconfig with values
  const options = Options({ processedData, currentLang });
  const values = getPlaceholders(processedData, countryCode, metric, currentLang, fundingType);
  const config = getConfig(metric, values, currentLang);

  // DEJA TRAITE DANS getPlaceholders
  // Construire le titre dynamique avec le nom du pays
  // const metricLabel = getI18nLabel(i18n, metric === "projects" ? "projects" : "funding", currentLang).toLowerCase();
  // const title = getI18nLabel(i18n, "main-title-with-country", currentLang).replace("{country}", countryName);

  // config.title.fr = title;
  // config.title.en = title;
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
