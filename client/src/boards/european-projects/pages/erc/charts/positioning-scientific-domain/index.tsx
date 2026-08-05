import { useState, useEffect } from "react";
import { useQuery, useQueries } from "@tanstack/react-query";
import { SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";

import { getData, getDataByPanel, getPanelsList } from "./query";
import Options, { OptionsMultiPanel } from "./options";
import {
  useGetParams,
  processData,
  processDataMultiPanel,
  renderDataTable,
  renderDataTableMultiPanel,
  SCIENTIFIC_DOMAINS,
  type ScientificDomainCode,
} from "./utils";
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

const getConfig = (metric: MetricType, isPanelMode: boolean) => {
  const isProjects = metric === "projects";
  const suffix = isPanelMode ? "-panel" : "";
  const titleKey = isProjects ? (isPanelMode ? "title-projects-panel" : "title-projects") : isPanelMode ? "title-funding-panel" : "title-funding";
  return {
    id: isProjects ? `ercPositioningScientificDomainProjects${suffix}` : `ercPositioningScientificDomainFunding${suffix}`,
    idQuery: "ercPositioningScientificDomain",
    title: {
      en: getI18nLabel(i18n, titleKey, "en"),
      fr: getI18nLabel(i18n, titleKey, "fr"),
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
      ? "/european-projects/components/pages/erc/charts/positioning-scientific-domain"
      : "/european-projects/components/pages/erc/charts/positioning-scientific-domain-funding",
  };
};

function PositioningScientificDomainChartInner({ countryCode: propCountryCode, currentLang: propLang }: PositioningScientificDomainChartProps) {
  const [metric, setMetric] = useState<MetricType>("projects");
  const [domainCode, setDomainCode] = useState<ScientificDomainCode>(SCIENTIFIC_DOMAINS[0].code);
  const [selectedPanels, setSelectedPanels] = useState<"all" | string[]>("all");

  const { params, currentLang: urlLang, countryCode: urlCountryCode } = useGetParams();
  const currentLang = propLang || urlLang;
  const countryCode = propCountryCode || urlCountryCode;

  // Réinitialise la sélection de panels quand le domaine change
  useEffect(() => {
    setSelectedPanels("all");
  }, [domainCode]);

  const isCumul = selectedPanels === "all";
  const isPanelMode = Array.isArray(selectedPanels);

  // Params pour le mode "cumul" (domaine entier)
  const allModeParams = params ? `${params}&domaine_scientifique=${domainCode}` : `domaine_scientifique=${domainCode}`;

  // Récupération de la liste des panels du domaine
  const { data: allPanelsData } = useQuery({
    queryKey: ["ercPanelsList", params],
    queryFn: () => getPanelsList(params),
    enabled: params !== "",
  });

  const domainPanels = (allPanelsData || [])
    .filter((p) => p.domaine_scientifique === domainCode)
    .sort((a, b) => a.panel_id.localeCompare(b.panel_id, undefined, { numeric: true }));

  // Toggle d'un panel : exclusif avec "cumul"
  const togglePanel = (panelId: string) => {
    setSelectedPanels((prev) => {
      if (prev === "all") {
        return [panelId];
      }
      const idx = prev.indexOf(panelId);
      if (idx >= 0) {
        const next = prev.filter((p) => p !== panelId);
        return next.length === 0 ? "all" : next;
      }
      return [...prev, panelId].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    });
  };

  // Requête principale (mode cumul)
  const { data: mainData, isLoading: mainLoading } = useQuery({
    queryKey: ["ercPositioningScientificDomain", allModeParams],
    queryFn: () => getData(allModeParams),
    enabled: params !== "" && isCumul,
  });

  // Requêtes par panel (mode multi-panel)
  const panelQueryResults = useQueries({
    queries: (isPanelMode ? (selectedPanels as string[]) : []).map((panelId) => ({
      queryKey: ["ercPositioningByPanel", params, panelId],
      queryFn: () => getDataByPanel(params, panelId),
      enabled: params !== "",
    })),
  });

  const isPanelLoading = isPanelMode && panelQueryResults.some((q) => q.isLoading);
  const isChartLoading = isCumul ? mainLoading || !mainData : isPanelLoading || !panelQueryResults.every((q) => !!q.data);

  // Valeurs d'affichage disponibles sans attendre les données
  const domainLabel = SCIENTIFIC_DOMAINS.find((d) => d.code === domainCode)?.label[currentLang as "fr" | "en"] ?? domainCode;
  const metricLabel = getI18nLabel(i18n, metric === "projects" ? "projects" : "funding", currentLang).toLowerCase();

  // Nom du pays (la préposition ne requiert pas les données API)
  let fallbackName = "";
  if (!isChartLoading) {
    if (isCumul && mainData?.successful?.countries) {
      const found = mainData.successful.countries.find((c) => c.country_code === countryCode);
      fallbackName = found ? (currentLang === "fr" ? found.country_name_fr : found.country_name_en) : "";
    } else if (isPanelMode && panelQueryResults[0]?.data?.successful?.countries) {
      const found = panelQueryResults[0].data.successful.countries.find((c) => c.country_code === countryCode);
      fallbackName = found ? (currentLang === "fr" ? found.country_name_fr : found.country_name_en) : "";
    }
  }

  const countryName =
    currentLang === "fr" ? getCountryNameWithDe(countryCode, fallbackName) : getCountryNameWithArticle(countryCode, "en", fallbackName);

  const title = getI18nLabel(i18n, "main-title-with-country", currentLang)
    .replace("{country}", countryName)
    .replace("{metric}", metricLabel)
    .replace("{domain}", domainLabel);

  const config = getConfig(metric, isPanelMode);

  // --- Calcul des données et options du graphique (uniquement si chargé) ---
  let chartOptions: ReturnType<typeof Options> = null;
  let renderDataFn: () => JSX.Element | null = () => null;
  let hasNoData = false;

  if (!isChartLoading) {
    if (isCumul) {
      const processedData = processData(mainData!, countryCode, currentLang, metric, domainCode);
      hasNoData = processedData.countries.length === 0;
      if (!hasNoData) {
        chartOptions = Options({ processedData, currentLang });
        renderDataFn = () => renderDataTable(processedData, currentLang);
      }
    } else {
      const panelDataArray = (selectedPanels as string[]).map((panelId, i) => {
        const panel = domainPanels.find((p) => p.panel_id === panelId);
        return {
          panelId,
          panelName: panel?.panel_name || panelId,
          data: panelQueryResults[i].data!,
        };
      });

      const multiPanelData = processDataMultiPanel(panelDataArray, countryCode, currentLang, metric, domainCode);
      hasNoData = multiPanelData.countries.length === 0;
      if (!hasNoData) {
        chartOptions = OptionsMultiPanel({ multiPanelData, currentLang });
        renderDataFn = () => renderDataTableMultiPanel(multiPanelData, currentLang);
      }
    }
  }

  return (
    <div className="positioning-scientific-domain-chart">
      <h3>{title}</h3>
      <div className="positioning-scientific-domain-chart__controls">
        <div className="select-wrapper">
          <div className="fr-select-group">
            <label className="fr-label" htmlFor="domain-select">
              {getI18nLabel(i18n, "select-domain", currentLang)}
            </label>
            <select className="fr-select" id="domain-select" value={domainCode} onChange={(e) => setDomainCode(e.target.value as ScientificDomainCode)}>
              {SCIENTIFIC_DOMAINS.map((d) => (
                <option key={d.code} value={d.code}>
                  {d.label[currentLang as "fr" | "en"]}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="segmented-wrapper">
          <SegmentedControl className="fr-segmented--sm" name="positioning-scientific-domain-metric">
            <SegmentedElement checked={metric === "projects"} label={getI18nLabel(i18n, "projects", currentLang)} onClick={() => setMetric("projects")} value="projects" />
            <SegmentedElement checked={metric === "funding"} label={getI18nLabel(i18n, "funding", currentLang)} onClick={() => setMetric("funding")} value="funding" />
          </SegmentedControl>
        </div>
      </div>

      {/* Sélecteur de panels */}
      {domainPanels.length > 0 && (
        <div className="positioning-scientific-domain-chart__panel-selector">
          <span className="fr-label fr-text--sm">{getI18nLabel(i18n, "select-panel", currentLang)}&nbsp;:</span>
          <div className="panel-toggle-group" role="group" aria-label={getI18nLabel(i18n, "select-panel", currentLang)}>
            <button type="button" className={`fr-tag fr-tag--sm${isCumul ? " fr-tag--selected" : ""}`} onClick={() => setSelectedPanels("all")} aria-pressed={isCumul}>
              {getI18nLabel(i18n, "all-panels", currentLang)}
            </button>
            {domainPanels.map((p) => {
              const isActive = isPanelMode && (selectedPanels as string[]).includes(p.panel_id);
              return (
                <button key={p.panel_id} type="button" className={`fr-tag fr-tag--sm${isActive ? " fr-tag--selected" : ""}`} onClick={() => togglePanel(p.panel_id)} aria-pressed={isActive} title={p.panel_lib || p.panel_name || p.panel_id}>
                  {p.panel_name || p.panel_id}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {hasNoData ? (
        <div className="fr-alert fr-alert--info">
          <p>{getI18nLabel(i18n, "no-data", currentLang)}</p>
        </div>
      ) : isChartLoading ? (
        <DefaultSkeleton />
      ) : (
        <div className="chart-container chart-container--default">
          <ChartWrapper config={config} options={chartOptions} renderData={renderDataFn} />
        </div>
      )}
    </div>
  );
}

export default function PositioningScientificDomainChart({ countryCode, currentLang }: PositioningScientificDomainChartProps) {
  return <PositioningScientificDomainChartInner countryCode={countryCode} currentLang={currentLang} />;
}
