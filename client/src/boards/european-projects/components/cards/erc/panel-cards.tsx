import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SegmentedControl, SegmentedElement, Title } from "@dataesr/dsfr-plus";
import { getErcSynthesisByPanel, ErcPanelData } from "../../../api/erc";
import { formatNumber, formatCurrency, formatToRates } from "../../../../../utils/format";
import { ErcStatCard, ViewMode } from "./stat-card";
import { getI18nLabel } from "../../../../../utils";
import i18nGlobal from "../../../i18n-global.json";

import "./styles.scss";
import { useSearchParams } from "react-router-dom";

// Variables CSS pour les couleurs de domaine
const DOMAIN_CSS_VARS: Record<string, { color: string; bg: string }> = {
  LS: { color: "var(--erc-domain-ls-color)", bg: "var(--erc-domain-ls-bg-color)" },
  PE: { color: "var(--erc-domain-pe-color)", bg: "var(--erc-domain-pe-bg-color)" },
  SH: { color: "var(--erc-domain-sh-color)", bg: "var(--erc-domain-sh-bg-color)" },
};

// Ordre de tri des domaines (Autre en dernier)
const DOMAIN_ORDER: Record<string, number> = {
  LS: 1,
  PE: 2,
  SH: 3,
  Autre: 99,
};

// Fonction de tri naturel pour les panel_id (ex: PE1, PE2, PE10 au lieu de PE1, PE10, PE2)
function naturalSortPanelId(a: string, b: string): number {
  const regex = /^([A-Z]+)(\d+)$/;
  const matchA = a.match(regex);
  const matchB = b.match(regex);

  if (matchA && matchB) {
    // Comparer le préfixe alphabétique
    const prefixCompare = matchA[1].localeCompare(matchB[1]);
    if (prefixCompare !== 0) return prefixCompare;
    // Comparer le numéro
    return parseInt(matchA[2], 10) - parseInt(matchB[2], 10);
  }
  // Fallback au tri alphabétique standard
  return a.localeCompare(b);
}

// Type pour les données de panel agrégées
interface AggregatedPanelData {
  panel_id: string;
  panel_name: string;
  panel_lib: string;
  domaine_scientifique: string;
  domaine_name_scientifique: string;
  evaluated_projects: number;
  successful_projects: number;
  total_funding_entity: number;
  evaluated_pi: number;
  successful_pi: number;
}

// Type pour les données de domaine agrégées
interface AggregatedDomainData {
  domain_code: string;
  domain_name: string;
  evaluated_projects: number;
  successful_projects: number;
  total_funding_entity: number;
  evaluated_pi: number;
  successful_pi: number;
  panels: AggregatedPanelData[];
}

interface ErcPanelCardsProps {
  countryCode?: string;
  callYear?: string;
  destinationCode?: string;
}

export default function ErcPanelCards({ countryCode, callYear, destinationCode }: ErcPanelCardsProps) {
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<ViewMode>("pi");
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  
  const { data, isLoading } = useQuery<ErcPanelData[]>({
    queryKey: ["erc-synthesis-by-panel", countryCode, callYear, destinationCode],
    queryFn: () =>
      getErcSynthesisByPanel({
        country_code: countryCode,
        call_year: callYear,
        destination_code: destinationCode,
      }),
  });

  const toggleDomain = (domain: string) => {
    setExpandedDomains((prev) => ({
      ...prev,
      [domain]: !prev[domain],
    }));
  };

  if (isLoading) {
    return (
      <div className="erc-panel-section">
        <h3>Par panel ERC</h3>
        <div className="erc-domain-cards">
          {[1, 2, 3].map((i) => (
            <DomainCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return null;
  }

  // Agréger les données par panel
  const aggregatedPanels: AggregatedPanelData[] = data.map((panel) => ({
    panel_id: panel.panel_id,
    panel_name: panel.panel_name,
    panel_lib: panel.panel_lib,
    domaine_scientifique: panel.domaine_scientifique,
    domaine_name_scientifique: panel.domaine_name_scientifique,
    evaluated_projects: panel.evaluated?.total_projects || 0,
    successful_projects: panel.successful?.total_projects || 0,
    total_funding_entity: panel.successful?.total_funding_entity || 0,
    evaluated_pi: panel.evaluated?.total_pi || 0,
    successful_pi: panel.successful?.total_pi || 0,
  }));

  // Grouper par domaine scientifique et calculer les totaux
  const domainData: AggregatedDomainData[] = Object.entries(
    aggregatedPanels.reduce(
      (acc, panel) => {
        const domain = panel.domaine_scientifique || "Autre";
        if (!acc[domain]) {
          acc[domain] = {
            domain_code: domain,
            domain_name: panel.domaine_name_scientifique || domain,
            evaluated_projects: 0,
            successful_projects: 0,
            total_funding_entity: 0,
            evaluated_pi: 0,
            successful_pi: 0,
            panels: [],
          };
        }
        acc[domain].evaluated_projects += panel.evaluated_projects;
        acc[domain].successful_projects += panel.successful_projects;
        acc[domain].total_funding_entity += panel.total_funding_entity;
        acc[domain].evaluated_pi += panel.evaluated_pi;
        acc[domain].successful_pi += panel.successful_pi;
        acc[domain].panels.push(panel);
        return acc;
      },
      {} as Record<string, AggregatedDomainData>,
    ),
  )
    .map(([, data]) => {
      // Trier les panels par ordre naturel (PE1, PE2, PE10 au lieu de PE1, PE10, PE2)
      data.panels.sort((a, b) => naturalSortPanelId(a.panel_id, b.panel_id));
      return data;
    })
    .sort((a, b) => (DOMAIN_ORDER[a.domain_code] || 50) - (DOMAIN_ORDER[b.domain_code] || 50));

  return (
    <div className="erc-panel-section">
      <div className="section-header">
        <Title as="h4">Chiffres clés</Title>
        <SegmentedControl className="fr-segmented--sm" name="panel-view-mode">
          <SegmentedElement checked={viewMode === "pi"} label={getI18nLabel(i18nGlobal, "pi", currentLang)} onClick={() => setViewMode("pi")} value="pi" />
          <SegmentedElement checked={viewMode === "funding"} label={getI18nLabel(i18nGlobal, "total-fund-eur", currentLang)} onClick={() => setViewMode("funding")} value="funding" />
          <SegmentedElement checked={viewMode === "projects"} label={getI18nLabel(i18nGlobal, "projects", currentLang)} onClick={() => setViewMode("projects")} value="projects" />
        </SegmentedControl>
      </div>
      <div className="erc-domain-cards">
        {domainData.map((domain) => (
          <DomainCard key={domain.domain_code} data={domain} isExpanded={expandedDomains[domain.domain_code] || false} onToggle={() => toggleDomain(domain.domain_code)} viewMode={viewMode} />
        ))}
      </div>
    </div>
  );
}

interface DomainCardProps {
  data: AggregatedDomainData;
  isExpanded: boolean;
  onToggle: () => void;
  viewMode: ViewMode;
}

function DomainCard({ data, isExpanded, onToggle, viewMode }: DomainCardProps) {
  const domainVars = DOMAIN_CSS_VARS[data.domain_code] || { color: "#6b7280", bg: "#6b728020" };
  const successRate = data.evaluated_projects > 0 ? data.successful_projects / data.evaluated_projects : 0;

  return (
    <div className="erc-domain-card" style={{ borderLeftColor: domainVars.color }}>
      <button className="domain-card-header" onClick={onToggle} type="button">
        <div className="domain-info">
          <span className="domain-badge" style={{ backgroundColor: domainVars.bg, color: domainVars.color }}>
            {data.domain_code}
          </span>
          <h4 className="domain-name">{data.domain_name}</h4>
        </div>
        <div className="domain-stats">
          {viewMode === "projects" ? (
            <>
              <div className="stat">
                <span className="stat-value">{formatNumber(data.successful_projects)}</span>
                <span className="stat-label">projets lauréats</span>
              </div>
              <div className="stat">
                <span className="stat-value success-rate">{formatToRates(successRate)}</span>
              </div>
            </>
          ) : viewMode === "pi" ? (
            <>
              <div className="stat">
                <span className="stat-value">{formatNumber(data.evaluated_pi)}</span>
                <span className="stat-label">Porteurs évalués</span>
              </div>
              <div className="stat">
                <span className="stat-value">{formatNumber(data.successful_pi)}</span>
                <span className="stat-label">Porteurs lauréats</span>
              </div>
            </>
          ) : (
            <>
              <div className="stat">
                <span className="stat-value">{formatNumber(data.successful_pi)}</span>
                <span className="stat-label">PI lauréats</span>
              </div>
              <div className="stat">
                <span className="stat-value funding">{formatCurrency(data.total_funding_entity)}</span>
              </div>
            </>
          )}
          <span className={`expand-icon ${isExpanded ? "expanded" : ""}`}>
            <span className="fr-icon-arrow-down-s-line" aria-hidden="true"></span>
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="domain-card-content">
          <div className="erc-stat-cards">
            {data.panels.map((panel) => {
              const domainVars = DOMAIN_CSS_VARS[panel.domaine_scientifique] || { color: "#6b7280", bg: "#6b728020" };
              return (
                <ErcStatCard
                  key={panel.panel_id}
                  data={{
                    title: panel.panel_id,
                    code: panel.domaine_scientifique,
                    subtitle: panel.panel_name,
                    evaluatedCount: panel.evaluated_projects,
                    successfulCount: panel.successful_projects,
                    fundingAmount: panel.total_funding_entity,
                    piCountEvaluated: panel.evaluated_pi,
                    piCountSuccessful: panel.successful_pi,
                  }}
                  viewMode={viewMode}
                  accentColor={domainVars.color}
                  badgeColor={domainVars.color}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function DomainCardSkeleton() {
  return (
    <div className="erc-domain-card">
      <div className="domain-card-header">
        <div className="domain-info">
          <div className="loader-skeleton" style={{ width: "2.5rem", height: "1.5rem" }}></div>
          <div className="loader-skeleton" style={{ width: "150px", height: "1.25rem" }}></div>
        </div>
        <div className="domain-stats">
          <div className="loader-skeleton" style={{ width: "3rem", height: "1.25rem" }}></div>
          <div className="loader-skeleton" style={{ width: "5rem", height: "1.25rem" }}></div>
        </div>
      </div>
    </div>
  );
}
