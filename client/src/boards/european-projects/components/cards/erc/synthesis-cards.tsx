import { useId } from "react";
import { useQuery } from "@tanstack/react-query";
import { Row, Col } from "@dataesr/dsfr-plus";
import { getErcSynthesis, ErcSynthesisResponse } from "../../../api/erc";
import { formatCurrency, formatNumber, formatToRates } from "../../../../../utils/format";

import "./styles.scss";

interface CountryAdjectives {
  m: string;
  f: string;
}

interface ErcSynthesisCardsProps {
  countryCode?: string;
  callYear?: string;
  destinationCode?: string;
  countryAdj?: CountryAdjectives;
}

export default function ErcSynthesisCards({
  countryCode = "FRA",
  callYear,
  destinationCode,
  countryAdj = { m: "français", f: "française" },
}: ErcSynthesisCardsProps) {
  const { data, isLoading } = useQuery<ErcSynthesisResponse>({
    queryKey: ["erc-synthesis", countryCode, callYear, destinationCode],
    queryFn: () =>
      getErcSynthesis({
        country_code: countryCode,
        call_year: callYear,
        destination_code: destinationCode,
      }),
  });

  // Calculer les métriques
  const totalBudgetSuccessful = data?.successful?.total_funding_project || 0;
  const totalBudgetEvaluated = data?.evaluated?.total_funding_project || 0;
  const totalProjectsSuccessful = data?.successful?.total_involved || 0;
  const totalProjectsEvaluated = data?.evaluated?.total_involved || 0;
  const totalPiSuccessful = data?.successful?.total_pi || 0;

  // Données du pays sélectionné
  const countrySuccessful = data?.successful?.countries?.[0];
  const countryEvaluated = data?.evaluated?.countries?.[0];

  const countryBudgetSuccessful = countrySuccessful?.total_funding_project || 0;
  const countryProjectsSuccessful = countrySuccessful?.total_involved || 0;
  const countryPiSuccessful = countrySuccessful?.total_pi || 0;
  const countryPiEvaluated = countryEvaluated?.total_pi || 0;

  // Parts du pays
  const budgetShare = totalBudgetSuccessful > 0 ? countryBudgetSuccessful / totalBudgetSuccessful : 0;
  const projectsShare = totalProjectsSuccessful > 0 ? countryProjectsSuccessful / totalProjectsSuccessful : 0;
  const piShare = totalPiSuccessful > 0 ? countryPiSuccessful / totalPiSuccessful : 0;

  // Taux de succès
  const successRateFunding = totalBudgetEvaluated > 0 ? totalBudgetSuccessful / totalBudgetEvaluated : 0;
  const successRateProjects = totalProjectsEvaluated > 0 ? totalProjectsSuccessful / totalProjectsEvaluated : 0;
  const countrySuccessRatePi = countryPiEvaluated > 0 ? countryPiSuccessful / countryPiEvaluated : 0;

  // Adjectifs avec pluriel (ajout du "s" pour le pluriel si nécessaire)
  const adjFemPlural = countryAdj.f.endsWith("s") ? countryAdj.f : `${countryAdj.f}s`;
  const adjMascPlural = countryAdj.m.endsWith("s") ? countryAdj.m : `${countryAdj.m}s`;

  return (
    <Row className="erc-synthesis-cards" gutters>
      <Col xs={12} md={4}>
        {/* Part du budget capté */}
        <ErcCard
          label={`Part du budget capté par les équipes ${adjFemPlural}`}
          value={formatToRates(budgetShare)}
          secondaryValue={formatCurrency(countryBudgetSuccessful)}
          secondaryLabel="obtenus"
          progressValue={budgetShare}
          loading={isLoading}
          variant="budget-card"
          tooltipText={`Budget total lauréat: ${formatCurrency(totalBudgetSuccessful)}`}
        />
      </Col>
      <Col xs={12} md={4}>
        {/* Part des projets lauréats */}
        <ErcCard
          label={`Part des projets lauréats avec participation ${countryAdj.f}`}
          value={formatToRates(projectsShare)}
          secondaryValue={formatNumber(countryProjectsSuccessful)}
          secondaryLabel="projets"
          progressValue={projectsShare}
          loading={isLoading}
          variant="projects-card"
          tooltipText={`Total projets lauréats: ${formatNumber(totalProjectsSuccessful)}`}
        />
      </Col>
      <Col xs={12} md={4}>
        {/* Part des porteurs (PI) */}
        <ErcCard
          label={`Part des porteurs ${adjMascPlural} (PI) dans les projets lauréats`}
          value={formatToRates(piShare)}
          secondaryValue={formatNumber(countryPiSuccessful)}
          secondaryLabel="porteurs"
          progressValue={piShare}
          loading={isLoading}
          variant="pi-card"
          tooltipText={`Total porteurs: ${formatNumber(totalPiSuccessful)}`}
        />
      </Col>
      <Col xs={12} md={4}>
        {/* Taux de succès sur les financements */}
        <ErcCard
          label="Taux de succès global sur les financements"
          value={formatToRates(successRateFunding)}
          progressValue={successRateFunding}
          loading={isLoading}
          variant="funding-rate-card"
          tooltipText="Ratio entre financements lauréats et financements demandés"
        />
      </Col>
      <Col xs={12} md={4}>
        {/* Taux de succès sur le nombre de projets */}
        <ErcCard
          label="Taux de succès global sur le nombre de projets"
          value={formatToRates(successRateProjects)}
          progressValue={successRateProjects}
          loading={isLoading}
          variant="rate-card"
          tooltipText="Ratio entre projets lauréats et projets évalués"
        />
      </Col>
      <Col xs={12} md={4}>
        {/* Taux de succès individuel des porteurs */}
        <ErcCard
          label={`Taux de succès des porteurs ${adjMascPlural} (PI)`}
          value={formatToRates(countrySuccessRatePi)}
          secondaryValue={`${formatNumber(countryPiSuccessful)} / ${formatNumber(countryPiEvaluated)}`}
          secondaryLabel="lauréats / candidats"
          progressValue={countrySuccessRatePi}
          loading={isLoading}
          variant="rate-card"
          tooltipText="Ratio entre porteurs lauréats et porteurs candidats"
        />
      </Col>
    </Row>
  );
}

interface ErcCardProps {
  label: string;
  value: string;
  secondaryValue?: string;
  secondaryLabel?: string;
  progressValue?: number;
  loading: boolean;
  variant?: string;
  tooltipText?: string;
}

function ErcCard({ label, value, secondaryValue, secondaryLabel, progressValue = 0, loading, variant = "", tooltipText }: ErcCardProps) {
  const tooltipId = useId();

  return (
    <div className={`erc-synthesis-card ${variant}`}>
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
