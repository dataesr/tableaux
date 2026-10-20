import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SegmentedControl, SegmentedElement, Select, SelectOption } from "@dataesr/dsfr-plus";

import { getData } from "./query";
import Options from "./options";
import { useGetParams, processData, renderDataTable, SCIENTIFIC_DOMAINS, type ScientificDomainCode } from "./utils";
import i18n from "./i18n.json";
import { getI18nLabel } from "../../../../../../utils";
import { getCountryNameWithDe, getCountryNameWithArticle } from "../../../../utils/country-mapping";
import { formatNumberLang, formatCurrency, formatCurrencyEn } from "../../../../../../utils/format";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import "./styles.scss";

type MetricType = "projects" | "funding";

interface PositioningScientificDomainChartProps {
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
  domain: ScientificDomainCode
) => {
  const l = lang as "fr" | "en";
  const [first, second] = processedData.countries;
  const selected = processedData.selectedCountry;
  const selectedName = selected ? (l === "fr" ? selected.country_name_fr : selected.country_name_en) : "";
  const code = countryCode ?? "";
  const scientificLabel = SCIENTIFIC_DOMAINS.find((t) => t.code === domain)?.label[l] ?? domain;


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
    domain: scientificLabel,
  };
};

// adding dictionary of placeholder names → replacement text { country: "de la France", firstValue: "€598.6 million" }
const getConfig = (metric: MetricType, values: Record<string, string>, lang: string) => {
  const isProjects = metric === "projects";
  const commentKey = isProjects ? "comment-projects" : "comment-funding";
  const readingKeyKey = isProjects ? "reading-key-projects" : "reading-key-funding";
  const text = (key: string, l: string) => withPlaceholders(getI18nLabel(i18n, key, l), values);
  const title = text("main-title-with-country", lang);

  return {
    id: isProjects ? "mscaPositioningScientificDomainProjects" : "mscaPositioningScientificDomainFunding",
    idQuery: "mscaPositioningScientificDomain",
    title: { fr: title, en: title, className: "fr-mt-2w fr-ml-1w"},
    comment: { fr: <>{text(commentKey, "fr")}</>, en: <>{text(commentKey, "en")}</> },
    readingKey: { fr: <>{text(readingKeyKey, "fr")}</>, en: <>{text(readingKeyKey, "en")}</> },
    integrationURL: isProjects ? "/european-projects/components/pages/msca/charts/positioning-scientific-domain" : "/european-projects/components/pages/msca/charts/positioning-scientific-domain-funding",
  };
};

function PositioningScientificDomainChartInner({ countryCode: propCountryCode, currentLang: propLang }: PositioningScientificDomainChartProps) {
  const [metric, setMetric] = useState<MetricType>("funding");
  const [domain, setDomain] = useState<ScientificDomainCode>(SCIENTIFIC_DOMAINS[0].code);

  const { params, currentLang: urlLang, countryCode: urlCountryCode } = useGetParams();
  const currentLang = propLang || urlLang;
  const countryCode = propCountryCode || urlCountryCode;

  const { data, isLoading } = useQuery({
    queryKey: ["mscaPositioningScientificDomain", params, domain],
    queryFn: () => getData(`${params}&scientific_domain=${domain}`),
    enabled: params !== "",
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const processedData = processData(data, countryCode, currentLang, metric, domain);

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
  const values = getPlaceholders(processedData, countryCode, metric, currentLang, domain);
  const config = getConfig(metric, values, currentLang);

  // DEJA TRAITE DANS getPlaceholders
  // Construire le titre dynamique avec le nom du pays
  // const metricLabel = getI18nLabel(i18n, metric === "projects" ? "projects" : "funding", currentLang).toLowerCase();
  // const title = getI18nLabel(i18n, "main-title-with-country", currentLang).replace("{country}", countryName).replace("{metric}", metricLabel);
  // config.title.fr = title;
  // config.title.en = title;
  return (
    <div className="positioning-scientific-domain-chart">
      <div className="positioning-scientific-domain-chart__controls">
        <Select label={getI18nLabel(i18n, "scientific-domain", currentLang)} selectedKey={domain} onSelectionChange={(key) => setDomain(key as ScientificDomainCode)}>
          {SCIENTIFIC_DOMAINS.map((d) => (
            <SelectOption key={d.code}>{d.label[currentLang]}</SelectOption>
          ))}
        </Select>
        <SegmentedControl className="fr-segmented--sm" name="positioning-scientific-domain-metric">
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

export default function PositioningScientificDomainChart({ countryCode, currentLang }: PositioningScientificDomainChartProps) {
  return <PositioningScientificDomainChartInner countryCode={countryCode} currentLang={currentLang} />;
}
