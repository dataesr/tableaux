import { useId } from "react";
import { useQuery } from "@tanstack/react-query";
import { Row, Col } from "@dataesr/dsfr-plus";
import { useSearchParams } from "react-router-dom";
import { getErcSynthesis, ErcSynthesisResponse } from "../../../api/erc";
import { formatCurrency, formatNumber, formatToRates } from "../../../../../utils/format";
import { getCountryNameWithDe, getCountryNameWithArticle } from "../../../utils/country-mapping";

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
  const totalProjectsSuccessful = data?.successful?.total_projects || 0;
  const totalProjectsEvaluated = data?.evaluated?.total_projects || 0;
  const totalPiSuccessful = data?.successful?.total_pi || 0;
  const totalPiEvaluated = data?.evaluated?.total_pi || 0;

  // Données du pays sélectionné
  const countrySuccessful = data?.successful?.countries?.[0];
  const countryEvaluated = data?.evaluated?.countries?.[0];

  const countryBudgetSuccessful = countrySuccessful?.total_funding_project || 0;
  const countryBudgetEvaluated = countryEvaluated?.total_funding_project || 0;
  // const countryProjectsSuccessful = countrySuccessful?.total_projects || 0;
  const countryProjectsEvaluated = countryEvaluated?.total_projects || 0;
  const countryPiSuccessful = countrySuccessful?.total_pi || 0;
  const countryPiEvaluated = countryEvaluated?.total_pi || 0;

  // Parts du pays
  const budgetShare = totalBudgetSuccessful > 0 ? countryBudgetSuccessful / totalBudgetSuccessful : 0;
  const piShareEvaluated = totalPiEvaluated > 0 ? countryPiEvaluated / totalPiEvaluated : 0;
  const piShare = totalPiSuccessful > 0 ? countryPiSuccessful / totalPiSuccessful : 0;

  // const projectsShareEvaluated = totalProjectsEvaluated > 0 ? countryProjectsEvaluated / totalProjectsEvaluated : 0;

  // Taux de succès
  const successRateFunding = totalBudgetEvaluated > 0 ? totalBudgetSuccessful / totalBudgetEvaluated : 0;
  const successRateProjects = totalProjectsEvaluated > 0 ? totalProjectsSuccessful / totalProjectsEvaluated : 0;
  const countrySuccessRatePi = countryPiEvaluated > 0 ? countryPiSuccessful / countryPiEvaluated : 0;

  // Adjectifs avec pluriel (ajout du "s" pour le pluriel si nécessaire)
  // const adjFemPlural = countryAdj.f.endsWith("s") ? countryAdj.f : `${countryAdj.f}s`;
  const adjMascPlural = countryAdj.m.endsWith("s") ? countryAdj.m : `${countryAdj.m}s`;

  const [searchParams] = useSearchParams();
  const lang = (searchParams.get("language") === "en" ? "en" : "fr") as "fr" | "en";
  const country = getCountryNameWithArticle(countryCode, lang).replace(/^(Le |La |Les |L')/, (m) => m.toLowerCase());
  console.log(data)

  return (
    <Row className="erc-synthesis-cards" gutters>
      <Col xs={12} md={4}>
        {/* Part du budget capté */}
        <ErcCard
          label={`Part des financements obtenus par ${country}`}
          value={formatToRates(budgetShare)}
          secondaryValue={formatCurrency(countryBudgetSuccessful)}
          secondaryLabel="obtenus"
          progressValue={budgetShare}
          loading={isLoading}
          variant="budget-card"
          tooltipText={`Financements obtenus par ${country} sur le total des financements (${formatCurrency(totalBudgetSuccessful)})`}
        />
      </Col>
      <Col xs={12} md={4}>
        {/* Part des projets lauréats */}
        <ErcCard
          label={`Part des candidats ${adjMascPlural}`}
          value={formatToRates(piShareEvaluated)}
          secondaryValue={formatNumber(countryPiEvaluated)}
          secondaryLabel="candidats"
          progressValue={piShareEvaluated}
          loading={isLoading}
          variant="projects-card"
          tooltipText={`Nombre de candidats ${adjMascPlural} sur le total des candidats (${formatNumber(totalPiEvaluated)})`}
        />
      </Col>
      <Col xs={12} md={4}>
        {/* Part des porteurs (PI) */}
        <ErcCard
          label={`Part des porteurs de projets ${adjMascPlural}`}
          value={formatToRates(piShare)}
          secondaryValue={formatNumber(countryPiSuccessful)}
          secondaryLabel="porteurs de projets"
          progressValue={piShare}
          loading={isLoading}
          variant="pi-card"
          tooltipText={`Nombre de porteurs de projets ${adjMascPlural} sur le total des porteurs de projets (${formatNumber(totalPiSuccessful)})`}
        />
      </Col>
      <Col xs={12} md={4}>
        {/* Taux de succès sur les financements */}
        <ErcCard
          label="Taux de succès des financements"
          value={formatToRates(successRateFunding)}
          progressValue={successRateFunding}
          loading={isLoading}
          variant="funding-rate-card"
          tooltipText={`Financements obtenus sur financements demandés (${formatCurrency(countryBudgetEvaluated)})`}
        />
      </Col>
      <Col xs={12} md={4}>
        {/* Taux de succès sur le nombre de projets */}
        <ErcCard
          label="Taux de succès des projets"
          value={formatToRates(successRateProjects)}
          progressValue={successRateProjects}
          loading={isLoading}
          variant="funding-rate-card"
          tooltipText={`Nombre de projets lauréats sur le nombre de projets évalués (${formatNumber(countryProjectsEvaluated)})`}
        />
      </Col>
      <Col xs={12} md={4}>
        {/* Taux de succès individuel des porteurs */}
        <ErcCard
          label={`Taux de succès des porteurs de projets ${adjMascPlural}`}
          value={formatToRates(countrySuccessRatePi)}
          // secondaryValue={`${formatNumber(countryPiSuccessful)} / `}
          // secondaryLabel="lauréats / candidats"
          progressValue={countrySuccessRatePi}
          loading={isLoading}
          variant="funding-rate-card"
          tooltipText={`Nombre de porteurs lauréats sur le nombre de candidats ${adjMascPlural} (${formatNumber(countryPiEvaluated)})`}
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
