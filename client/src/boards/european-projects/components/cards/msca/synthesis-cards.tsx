import { useId } from "react";
import { useQuery } from "@tanstack/react-query";
import { Row, Col } from "@dataesr/dsfr-plus";
import { getMscaSynthesis, MscaSynthesisResponse } from "../../../api/msca";
import { formatCurrency, formatNumber, formatToRates } from "../../../../../utils/format";

import "./styles.scss";

interface CountryAdjectives {
  m: string;
  f: string;
}

interface MscaSynthesisCardsProps {
  countryCode?: string;
  callYear?: string;
  countryAdj?: CountryAdjectives;
}

export default function MscaSynthesisCards({
  countryCode = "FRA",
  callYear,
  countryAdj = { m: "français", f: "française" },
}: MscaSynthesisCardsProps) {
  const { data, isLoading } = useQuery<MscaSynthesisResponse>({
    queryKey: ["msca-synthesis", countryCode, callYear],
    queryFn: () => getMscaSynthesis({ country_code: countryCode, call_year: callYear }),
  });

  const adjFemPlural = countryAdj.f.endsWith("s") ? countryAdj.f : `${countryAdj.f}s`;
  const adjMascPlural = countryAdj.m.endsWith("s") ? countryAdj.m : `${countryAdj.m}s`;

  // Totaux globaux
  const totalFundingSuccessful = data?.successful?.total_funding_project || 0;
  const totalProjectsSuccessful = data?.successful?.total_projects || 0;
  const totalProjectsEvaluated = data?.evaluated?.total_projects || 0;

  // Données du pays
  const country = data?.successful?.countries?.[0];
  const countryEval = data?.evaluated?.countries?.[0];

  const countryFunding = country?.total_funding_project || 0;
  const countryProjects = country?.total_projects || 0;
  const countryCoordinations = country?.total_pi || 0;
  const countryProjectsEvaluated = countryEval?.total_projects || 0;

  // Parts et taux
  const fundingShare = totalFundingSuccessful > 0 ? countryFunding / totalFundingSuccessful : 0;
  const projectsShare = totalProjectsSuccessful > 0 ? countryProjects / totalProjectsSuccessful : 0;
  const successRateProjects = totalProjectsEvaluated > 0 ? totalProjectsSuccessful / totalProjectsEvaluated : 0;
  const countrySuccessRate = countryProjectsEvaluated > 0 ? countryProjects / countryProjectsEvaluated : 0;

  return (
    <Row className="msca-synthesis-cards" gutters>
      <Col md={4}>
        <MscaCard
          label={`Part du budget MSCA capté par les équipes ${adjFemPlural}`}
          value={formatToRates(fundingShare)}
          secondaryValue={formatCurrency(countryFunding)}
          secondaryLabel="obtenus"
          progressValue={fundingShare}
          loading={isLoading}
          variant="funding-card"
          tooltipText={`Budget total des projets lauréats : ${formatCurrency(totalFundingSuccessful)}`}
        />
      </Col>
      <Col md={4}>
        <MscaCard
          label={`Part des projets lauréats avec participation ${countryAdj.f}`}
          value={formatToRates(projectsShare)}
          secondaryValue={formatNumber(countryProjects)}
          secondaryLabel="projets"
          progressValue={projectsShare}
          loading={isLoading}
          variant="projects-card"
          tooltipText={`Total projets lauréats : ${formatNumber(totalProjectsSuccessful)}`}
        />
      </Col>
      <Col md={4}>
        <MscaCard
          label={`Coordinateurs ${adjMascPlural} dans les projets lauréats`}
          value={formatNumber(countryCoordinations)}
          progressValue={projectsShare}
          loading={isLoading}
          variant="coord-card"
          tooltipText="Nombre de participations en tant que coordinateur dans des projets lauréats"
        />
      </Col>
      <Col md={4}>
        <MscaCard
          label="Taux de succès global sur le nombre de projets"
          value={formatToRates(successRateProjects)}
          progressValue={successRateProjects}
          loading={isLoading}
          variant="rate-card"
          tooltipText="Ratio entre projets lauréats et projets évalués (tous pays)"
        />
      </Col>
      <Col md={4}>
        <MscaCard
          label={`Taux de succès des équipes ${adjFemPlural}`}
          value={formatToRates(countrySuccessRate)}
          secondaryValue={`${formatNumber(countryProjects)} / ${formatNumber(countryProjectsEvaluated)}`}
          secondaryLabel="lauréats / candidats"
          progressValue={countrySuccessRate}
          loading={isLoading}
          variant="rate-card"
          tooltipText="Ratio projets lauréats / évalués pour ce pays"
        />
      </Col>
    </Row>
  );
}

// ─── Composant de carte interne ───────────────────────────────────────────────

interface MscaCardProps {
  label: string;
  value: string;
  secondaryValue?: string;
  secondaryLabel?: string;
  progressValue?: number;
  loading: boolean;
  variant?: string;
  tooltipText?: string;
}

function MscaCard({ label, value, secondaryValue, secondaryLabel, progressValue = 0, loading, variant = "", tooltipText }: MscaCardProps) {
  const tooltipId = useId();

  return (
    <div className={`msca-synthesis-card ${variant}`}>
      {loading ? (
        <>
          <div className="loader-skeleton loader-label"></div>
          <div className="loader-skeleton loader-number"></div>
          {secondaryValue && <div className="loader-skeleton loader-secondary"></div>}
          <div className="loader-skeleton loader-bottom-bar"></div>
        </>
      ) : (
        <>
          <div className="card-content">
            <div className="card-header">
              <p className="label">{label}</p>
              {tooltipText && (
                <div className="fr-tooltip__container">
                  <button className="info-button" aria-describedby={tooltipId} type="button">
                    <span className="fr-icon-information-line" aria-hidden="true"></span>
                  </button>
                  <span className="fr-tooltip fr-placement" id={tooltipId} role="tooltip" aria-hidden="true">
                    {tooltipText}
                  </span>
                </div>
              )}
            </div>
            <p className="nb">{value}</p>
            {secondaryValue && (
              <p className="secondary-value">
                {secondaryValue}
                {secondaryLabel && <span className="secondary-label">{secondaryLabel}</span>}
              </p>
            )}
          </div>
          <div className="bottom-progress-bar">
            <div className="progress-fill" style={{ width: `${Math.min(progressValue * 100, 100)}%` }}></div>
          </div>
        </>
      )}
    </div>
  );
}
