import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SegmentedControl, SegmentedElement, Select, SelectOption } from "@dataesr/dsfr-plus";

import { getData } from "./query";
import Options from "./options";
import { useGetParams, processData, renderDataTable, SCIENTIFIC_DOMAINS, type ScientificDomainCode } from "./utils";
import i18n from "./i18n.json";
import { getI18nLabel } from "../../../../../../utils";
import { getCountryNameWithDe, getCountryNameWithArticle } from "../../../../utils/country-mapping";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import "./styles.scss";

type MetricType = "projects" | "funding";

interface PositioningScientificDomainChartProps {
  countryCode?: string;
  currentLang?: string;
}

const getConfig = (metric: MetricType) => {
  const isProjects = metric === "projects";
  return {
    id: isProjects ? "mscaPositioningScientificDomainProjects" : "mscaPositioningScientificDomainFunding",
    idQuery: "mscaPositioningScientificDomain",
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
    integrationURL: isProjects ? "/european-projects/components/pages/msca/charts/positioning-scientific-domain" : "/european-projects/components/pages/msca/charts/positioning-scientific-domain-funding",
  };
};

function PositioningScientificDomainChartInner({ countryCode: propCountryCode, currentLang: propLang }: PositioningScientificDomainChartProps) {
  const [metric, setMetric] = useState<MetricType>("projects");
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
