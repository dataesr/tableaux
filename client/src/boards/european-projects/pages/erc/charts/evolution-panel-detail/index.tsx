import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Col, Row, Title, SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";

import { getData } from "./query";
import OptionsEvolution, { processPanelDetailData } from "./options";
import { EvolutionIndicator, evolutionConfig, useEvolutionMetric } from "../evolution-indicator";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";

// Labels des domaines scientifiques
export const DOMAIN_LABELS: Record<string, { fr: string; en: string }> = {
  LS: { fr: "Sciences de la vie", en: "Life Sciences" },
  PE: { fr: "Sciences physiques et ingénierie", en: "Physical Sciences & Engineering" },
  SH: { fr: "Sciences sociales et humaines", en: "Social Sciences & Humanities" },
};

// Variables CSS pour les couleurs de domaine
export const DOMAIN_CSS_VARS: Record<string, string> = {
  LS: "var(--erc-domain-ls-color)",
  PE: "var(--erc-domain-pe-color)",
  SH: "var(--erc-domain-sh-color)",
};

// Ordre des domaines
export const DOMAIN_ORDER = ["LS", "PE", "SH"];

function useGetParams() {
  const [searchParams] = useSearchParams();

  const params: string[] = [];

  const countryCode = searchParams.get("country_code") || "FRA";
  params.push(`country_code=${countryCode}`);

  const currentLang = searchParams.get("language") || "fr";

  return { params: params.join("&"), currentLang };
}

interface EvolutionPanelDetailProps {
  countryCode?: string;
  currentLang?: string;
}

const configWeight = {
  id: "ercEvolutionPanelDetailWeight",
  idQuery: "ercEvolutionPanelDetail",
  integrationURL: "/european-projects/components/pages/erc/charts/evolution-panel-detail-weight",
};

const configSuccessRate = {
  id: "ercEvolutionPanelDetailSuccessRate",
  idQuery: "ercEvolutionPanelDetail",
  integrationURL: "/european-projects/components/pages/erc/charts/evolution-panel-detail-success-rate",
};

export default function EvolutionPanelDetail({ currentLang: propLang }: EvolutionPanelDetailProps) {
  const { params, currentLang: urlLang } = useGetParams();
  const currentLang = propLang || urlLang;
  const [selectedDomain, setSelectedDomain] = useState(DOMAIN_ORDER[0]);
  const { metric, setMetric } = useEvolutionMetric("erc_panel_evolution_metric");

  const { data, isLoading } = useQuery({
    queryKey: ["ercPanelDetailEvolution", params],
    queryFn: () => getData(params),
    enabled: params !== "",
  });
  const availableDomains = useMemo(
    () => (data ? DOMAIN_ORDER.filter((domain) => data.country.successful.some((item) => item.domaine_scientifique === domain) || data.country.evaluated.some((item) => item.domaine_scientifique === domain)) : []),
    [data],
  );
  const effectiveDomain = availableDomains.includes(selectedDomain) ? selectedDomain : availableDomains[0];
  const processedData = useMemo(() => (data && effectiveDomain ? processPanelDetailData(data, effectiveDomain, metric) : null), [data, effectiveDomain, metric]);

  if (isLoading || !data) return <DefaultSkeleton />;

  if (!processedData) return null;

  return (
    <div className="evolution-panel-detail">
      <Title as="h3">{currentLang === "fr" ? "Évolution par panel ERC" : "Evolution by ERC panel"}</Title>

      <Row gutters>
        <Col xs={12} lg={7}>
          <SegmentedControl className="fr-segmented--sm fr-mb-2w" name="evolution-panel-detail-domain" label={currentLang === "en" ? "Scientific domain" : "Domaine scientifique"}>
            {availableDomains.map((domain) => {
              const domainColor = DOMAIN_CSS_VARS[domain];
              const label = DOMAIN_LABELS[domain]?.[currentLang as "fr" | "en"] || domain;
              return (
                <SegmentedElement
                  key={domain}
                  checked={effectiveDomain === domain}
                  label={label}
                  onClick={() => setSelectedDomain(domain)}
                  value={domain}
                  style={effectiveDomain === domain ? { backgroundColor: domainColor, color: "white", borderColor: domainColor } : {}}
                />
              );
            })}
          </SegmentedControl>
        </Col>
        <Col xs={12} lg={5}>
          <EvolutionIndicator metric={metric} setMetric={setMetric} currentLang={currentLang} name="erc-panel-evolution-metric" />
        </Col>
      </Row>

      {/* Graphique 1: Poids des projets par panel */}
      <div className="fr-mb-1w chart-container chart-container--default">
        <ChartWrapper
          config={evolutionConfig(configWeight, "weight", metric, { fr: "panel", en: "panel" }, processedData.years, processedData.weightSeries)}
          options={OptionsEvolution({
            years: processedData.years,
            series: processedData.weightSeries,
            metric,
            currentLang,
          })}
        />
      </div>

      {/* Graphique 2: Taux de succès par panel */}
      <div className="fr-mb-4w chart-container chart-container--default">
        <ChartWrapper
          config={evolutionConfig(configSuccessRate, "successRate", metric, { fr: "panel", en: "panel" }, processedData.years, processedData.successRateSeries)}
          options={OptionsEvolution({
            years: processedData.years,
            series: processedData.successRateSeries,
            metric,
            currentLang,
          })}
        />
      </div>
    </div>
  );
}
