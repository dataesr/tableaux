import { useId, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { SegmentedControl, SegmentedElement, Title } from "@dataesr/dsfr-plus";
import { getMscaSynthesisByPanel, MscaPanelData } from "../../../api/msca";
import { formatNumber, formatCurrency, formatToRates } from "../../../../../utils/format";
import "./styles.scss";

type ViewMode = "projects" | "funding";

interface MscaPanelCardsProps {
  countryCode?: string;
  callYear?: string;
}

export default function MscaPanelCards({ countryCode, callYear }: MscaPanelCardsProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("projects");

  const { data, isLoading } = useQuery<MscaPanelData[]>({
    queryKey: ["msca-synthesis-by-panel", countryCode, callYear],
    queryFn: () => getMscaSynthesisByPanel({ country_code: countryCode, call_year: callYear }),
  });

  if (isLoading) {
    return (
      <div className="msca-panel-section">
        <div className="section-header">
          <h3>Par panel scientifique</h3>
        </div>
        <div className="msca-stat-cards">
          {[1, 2, 3, 4].map((i) => (
            <MscaPanelCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  const validData = (data || []).filter((p) => p.panel_id);
  if (validData.length === 0) return null;

  const sorted = [...validData].sort((a, b) => a.panel_id.localeCompare(b.panel_id));

  return (
    <div className="msca-panel-section">
      <div className="section-header">
        <Title as="h2" look="h5">
          Par panel scientifique
        </Title>
        <SegmentedControl className="fr-segmented--sm" name="msca-panel-view-mode">
          <SegmentedElement checked={viewMode === "projects"} label="Projets" onClick={() => setViewMode("projects")} value="projects" />
          <SegmentedElement checked={viewMode === "funding"} label="Financements" onClick={() => setViewMode("funding")} value="funding" />
        </SegmentedControl>
      </div>
      <div className="msca-stat-cards">
        {sorted.map((panel) => (
          <MscaPanelCard key={panel.panel_id} data={panel} viewMode={viewMode} />
        ))}
      </div>
    </div>
  );
}

function MscaPanelCard({ data, viewMode }: { data: MscaPanelData; viewMode: ViewMode }) {
  const tooltipId = useId();
  const label = data.panel_name || data.panel_id;
  const evaluatedProjects = data.evaluated?.total_projects || 0;
  const successfulProjects = data.successful?.total_projects || 0;
  const successRate = evaluatedProjects > 0 ? successfulProjects / evaluatedProjects : 0;

  return (
    <div className="msca-stat-card">
      <div className="stat-card-header">
        <Title as="h3" className="stat-card-title">
          {label}
        </Title>
        <span className="stat-card-code">{data.panel_id}</span>
      </div>

      {viewMode === "projects" ? (
        <>
          <div className="stat-card-stats">
            <div className="stat-group">
              <div className="stat-label">Projets évalués</div>
              <div className="stat-value">{formatNumber(evaluatedProjects)}</div>
            </div>
            <div className="stat-group">
              <div className="stat-label">Projets lauréats</div>
              <div className="stat-value">{formatNumber(successfulProjects)}</div>
            </div>
          </div>
          <div className="success-rate">
            <span className="rate-label">
              Taux de succès
              <button className="info-button" aria-describedby={tooltipId} type="button">
                <span className="fr-icon-information-line" aria-hidden="true"></span>
              </button>
              <span className="fr-tooltip fr-placement" id={tooltipId} role="tooltip" aria-hidden="true">
                Projets lauréats / Projets évalués = {formatNumber(successfulProjects)} / {formatNumber(evaluatedProjects)}
              </span>
            </span>
            <span className="rate-value">{formatToRates(successRate)}</span>
          </div>
        </>
      ) : (
        <div className="stat-card-stats">
          <div className="stat-group">
            <div className="stat-label">Participants</div>
            <div className="stat-value">{formatNumber(data.successful?.total_involved || 0)}</div>
          </div>
          <div className="stat-group">
            <div className="stat-label">Financement</div>
            <div className="stat-value funding">{formatCurrency(data.successful?.total_funding_project || 0)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function MscaPanelCardSkeleton() {
  return (
    <div className="msca-stat-card">
      <div className="stat-card-header">
        <div style={{ width: "60%", height: "1rem", background: "rgba(0,0,0,.08)", borderRadius: 4 }}></div>
        <div style={{ width: "3rem", height: "1.5rem", background: "rgba(0,0,0,.08)", borderRadius: 4 }}></div>
      </div>
      <div className="stat-card-stats">
        <div className="stat-group">
          <div style={{ width: "80%", height: "0.75rem", background: "rgba(0,0,0,.06)", borderRadius: 4, marginBottom: 4 }}></div>
          <div style={{ width: "50%", height: "1.1rem", background: "rgba(0,0,0,.08)", borderRadius: 4 }}></div>
        </div>
        <div className="stat-group">
          <div style={{ width: "80%", height: "0.75rem", background: "rgba(0,0,0,.06)", borderRadius: 4, marginBottom: 4 }}></div>
          <div style={{ width: "50%", height: "1.1rem", background: "rgba(0,0,0,.08)", borderRadius: 4 }}></div>
        </div>
      </div>
    </div>
  );
}
