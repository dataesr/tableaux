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
  // const totalFundingEvaluated = data?.evaluated?.total_funding_project || 0;
  // const totalProjectsEvaluated = data?.evaluated?.total_projects || 0;
  const totalCandidats = data?.evaluated?.total_involved || 0;

  // Données du pays
  const country = data?.successful?.countries?.[0];
  const countryEval = data?.evaluated?.countries?.[0];

  const countryFunding = country?.total_funding_project || 0;
  const countryFundingEvaluated = countryEval?.total_funding_project || 0;

  const countryParticipants = country?.total_involved || 0;
  const countryCandidats = countryEval?.total_involved || 0;

  const countryProjects = country?.total_projects || 0;
  const countryProjectsEvaluated = countryEval?.total_projects || 0;

  // Parts et taux
  const fundingShare = totalFundingSuccessful > 0 ? countryFunding / totalFundingSuccessful : 0;
  const candidatShare = totalCandidats > 0 ? countryCandidats / totalCandidats : 0;
  const projectsShare = totalProjectsSuccessful > 0 ? countryProjects / totalProjectsSuccessful : 0;

  const succesRateFunding = countryFundingEvaluated > 0 ? countryFunding / countryFundingEvaluated : 0;
  const countrySuccessRate = countryCandidats > 0 ? countryParticipants / countryCandidats : 0;
  const successRateProjects = countryProjectsEvaluated > 0 ? countryProjects / countryProjectsEvaluated : 0;
  
  return (
    <Row className="msca-synthesis-cards" gutters>
      <Col xs={12} md={4}>
        <MscaCard
          label={`Part des financements obtenus par les participants ${adjMascPlural}`}
          value={formatToRates(fundingShare)}
          secondaryValue={formatCurrency(countryFunding)}
          secondaryLabel="obtenus"
          progressValue={fundingShare}
          loading={isLoading}
          variant="funding-card"
          tooltipText={`Montant des financements obtenus par {} sur le montant des financements obtenus par l'ensemble des participants`}
        />
      </Col>
      <Col xs={12} md={4}>
        <MscaCard
          label={`Part des candidatures ${adjFemPlural}`}
          value={formatToRates(candidatShare)}
          secondaryValue={formatNumber(countryCandidats)}
          secondaryLabel="candidats"
          progressValue={candidatShare}
          loading={isLoading}
          variant="candidats-card"
          tooltipText={`Nombre de candidats ${adjMascPlural} sur le nombre total des candidats`}
        />
      </Col>
      <Col xs={12} md={4}>
        <MscaCard
          label="Part des projets lauréats"
          value={formatToRates(projectsShare)}
          secondaryValue={formatNumber(countryProjects)}
          secondaryLabel="projets"
          progressValue={projectsShare}
          loading={isLoading}
          variant="projects-card"
          tooltipText={`Nombre de projets lauréats impliquant au moins un participant ${countryAdj.m} sur le total des projets lauréats`}
        />
      </Col>
      <Col xs={12} md={4}>
        <MscaCard
          label={`Taux de succès des financements`}
          value={formatToRates(succesRateFunding)}
          progressValue={succesRateFunding}
          loading={isLoading}
          variant="fund-rate-card"
          tooltipText={`Montant des financements obtenus sur le montant des financements demandés par {}`}
        />
      </Col>
      <Col xs={12} md={4}>
        <MscaCard
          label={`Taux de succès individuel des participants ${adjMascPlural}`}
          value={formatToRates(countrySuccessRate)}
          secondaryValue={`${formatNumber(countryParticipants)} participants / ${formatNumber(countryCandidats)} candidats`}
          progressValue={countrySuccessRate}
          loading={isLoading}
          variant="rate-card"
          tooltipText={`Nombre de participants ${adjMascPlural} sur le nombre de candidats ${adjMascPlural}`}
        />
      </Col>
      <Col xs={12} md={4}>
        <MscaCard
          label="Taux de succès des projets"
          value={formatToRates(successRateProjects)}
          progressValue={successRateProjects}
          loading={isLoading}
          variant="rate-card"
          tooltipText={`Nombre de projets lauréats sur le nombre de projets évalués impliquant au moins une entité ${countryAdj.f}`}
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
