import { Col, Container, Row } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { getI18nLabel } from "../../../../../../utils";
import { EPChartsSources } from "../../../../config.js";
import i18nGlobal from "../../../../i18n-global.json";
import i18nLocal from "./i18n.json";
import optionsSuccessRates from "./options-success-rates";
import optionsValues from "./options-values";
import { getData } from "./query";
import { renderDataTable, renderDataTableRates, successRatesReadingKey, useGetParams, valuesSuccessReadingKey } from "./utils";
import { getCountryNameWithArticle } from "../../../../utils/country-mapping";
import { getCountryAdjectives } from "../../../../../../components/country-selector/utils.jsx";


export default function PillarsFundingEvo3Years() {
  const [searchParams] = useSearchParams();
  const currentLang = (searchParams.get("language") === "en" ? "en" : "fr") as "fr" | "en";
  const [displayType, setDisplayType] = useState("total_fund_eur");

  const countryCode = searchParams.get("country_code") || "FRA";
  const countryN = getCountryNameWithArticle(countryCode, currentLang).replace(/^(Le |La |Les |L')/, (m) => m.toLowerCase());

  const countryAdj = getCountryAdjectives(countryCode, currentLang);

  // Pluriel seulement en français
  const adjMascPlural =
  currentLang === "fr" && !countryAdj.m.endsWith("s") ? `${countryAdj.m}s` : countryAdj.m;
  // const adjFemPlural =
  // currentLang === "fr" && !countryAdj.f.endsWith("s") ? `${countryAdj.f}s` : countryAdj.f;

  const { params } = useGetParams();
  const { data, isLoading } = useQuery({
    queryKey: ["PillarsFundingEvo3Years", params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data)
    return (
      <>
        <DefaultSkeleton />
        <DefaultSkeleton />
      </>
    );

  const configChart1: {
    id: string;
    title?: { fr: string; en: string };
    comment?: { fr: React.JSX.Element; en: React.JSX.Element };
    readingKey: any;
    sources: any;
    integrationURL: string;
  } = {
    id: "pillarsEvolutionFundingLines",
    readingKey: valuesSuccessReadingKey(data, displayType, currentLang, countryN, adjMascPlural),
    sources: EPChartsSources,
    integrationURL: "/european-projects/components/pages/analysis/overview/charts/projects-types-3",
  };

  const configChart3: {
    id: string;
    title?: { fr: string; en: string };
    comment?: { fr: React.JSX.Element; en: React.JSX.Element };
    readingKey: any;
    sources: any;
    integrationURL: string;
  } = {
    id: "pillarsEvolutionFundingLinesSuccessRate",
    readingKey: successRatesReadingKey(data, displayType, countryN, adjMascPlural),
    sources: EPChartsSources,
    integrationURL: "/european-projects/components/pages/analysis/overview/charts/projects-types-3",
  };

  const i18n = {
    ...i18nLocal,
    ...i18nGlobal,
  };

  switch (displayType) {
    case "total_coordination_number":
      configChart1.title = { 
        fr: `Evolution du nombre de projets coordonnés par ${countryN} sur Horizon Europe`, 
        en: `Trends in the number of projects coordinated by ${countryN} under Horizon Europe` };
      configChart1.comment = { 
        fr: <>Ce graphique présente, pour le pilier sélectionné, l'évolution du nombre de projets évalués et lauréats coordonnés par le pays sélectionné ainsi que son taux de succès i.e le nombre de coordinations de projets lauréates sur évaluées.</>, 
        en: <>This chart shows, for the selected pillar, the trends in projects evaluated and successful coordinated by the selected country, together with its success rate, i.e. the number of successful project coordinations over evaluated ones.</> };
      configChart3.title = { 
        fr: `Part des projets coordonnés par ${countryN} sur l'ensemble des coordinations`, 
        en: `Share of projects coordinated by ${countryN} out of the total number of coordination roles` 
      };
      configChart3.comment = { 
        fr: <>Ce graphique présente, pour le pilier sélectionné, l'évolution du nombre de projets évalués et lauréats coordonnés par le pays sélectionné, en part de l'ensemble des coordinations.</>, 
        en: <>This chart shows, for the selected pillar, the trends in the number of evaluated and successful projects coordinated by the selected country, as a share of all coordinations.</> 
      };
      break;
    case "total_number_involved":
      configChart1.title = { 
        fr: `Evolution du nombre de candidats et de participants ${adjMascPlural} sur Horizon Europe`, 
        en: `Trends in the number of ${adjMascPlural} applicants and participants under Horizon Europe` 
      };
      configChart1.comment = { 
        fr: <>Ce graphique présente, pour le pilier sélectionné, l'évolution du nombre de candidats et de participants implantés dans le pays sélectionné ainsi que son taux de succès i.e le nombre de participants sur le nombre de candidats.</>, 
        en: <>This chart shows, for the selected pillar, the trends in the number of applicants and participants established in the selected country, together with its success rate, i.e. the number of participants over the number of applicants.</> 
      };
      configChart3.title = { 
        fr: `Part des candidats et de participants ${adjMascPlural} sur l'ensemble des pays`, 
        en: `Share of the ${adjMascPlural} applicants and participants out of all countries` 
      };
      configChart3.comment = { 
        fr: <>Ce graphique présente, pour le pilier sélectionné, l'évolution du nombre de candidats et participants implantés dans le pays sélectionné, en part de l'ensemble des pays.</>, 
        en: <>This chart shows, for the selected pillar, the trends in the number of applicants and participants established in the selected country, as a share of all countries.</> 
      };
      break;
    case "total_projects":
      configChart1.title = { 
        fr: `Evolution du nombre de projets évalués et lauréats impliquant ${countryN} sur Horizon Europe`, 
        en: `Trends in the number of evaluated and successful projects involving ${countryN} under Horizon Europe`
      };
      configChart1.comment = { 
        fr: <>Ce graphique présente, pour le pilier sélectionné, l'évolution du nombre de projets évalués et lauréats impliquant le pays sélectionné ainsi que son taux de succès i.e le nombre de projets lauréats sur évalués.</>, 
        en: <>This chart shows, for the selected pillar, the trends in the number of evaluated and successful projects involving the selected country, together with its success rate, i.e. the ratio of successful projects to evaluated projects.</> 
      };
      configChart3.title = { 
        fr: `Part du nombre de projets évalués et lauréats impliquant ${countryN} sur l'ensemble des pays`, 
        en: `Share of evaluated and successful projects involving ${countryN} out of all countries` 
      };
      configChart3.comment = { 
        fr: <>Ce graphique présente, pour le pilier sélectionné, l'évolution du nombre de projets évalués et lauréats impliquant le pays sélectionné, en part de l'ensemble des pays.</>, 
        en: <>This chart shows, for the selected pillar, the trends in the number of evaluated and successful projects involving the selected country, as a share of all countries.</> 
      };
      break;
    default:
      configChart1.title = {
        fr: `Evolution des financements demandés et obtenus par ${countryN} sur Horizon Europe`,
        en: `Trends in funding requested and secured by ${countryN} in Horizon Europe`,
      };
      configChart1.comment = {
        fr: <>Ce graphique présente, pour le pilier sélectionné, l'évolution des financements demandés et obtenus par le pays sélectionné ainsi que son taux de succès i.e le montant des financements obtenus sur demandés.</>,
        en: <>This chart shows, for the selected pillar, the trends in funding requested and secured by the selected country, together with its funding success rate, i.e. the ratio of funding secured to funding requested.</>,
      };
      configChart3.title = {
        fr: `Part des financements demandés et obtenus par ${countryN} sur l'ensemble des pays`,
        en: `Share of funding requested and secured by ${countryN} out of all countries`,
      };
      configChart3.comment = {
        fr: <>Ce graphique présente, pour le pilier sélectionné, l'évolution des financements demandés et obtenus par le pays sélectionné, en part de l'ensemble des pays.</>,
        en: <>This chart shows, for the selected pillar, the trends in funding requested and secured by the selected country, as a share of all countries.</>,
      };
  }

  return (
    <Container fluid className="chart-container chart-container--default">
      <Row className="fr-my-1w">
        <Col className="fr-px-1w">
          <select className="fr-select" onChange={(e) => setDisplayType(e.target.value)}>
            <option value="total_fund_eur">{getI18nLabel(i18n, "total-fund-eur")}</option>
            <option value="total_coordination_number">{getI18nLabel(i18n, "total-coordination-number")}</option>
            <option value="total_number_involved">{getI18nLabel(i18n, "total-number-involved")}</option>
            <option value="total_projects">{getI18nLabel(i18nGlobal, "total-projects")}</option>
          </select>
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <ChartWrapper config={configChart1} options={optionsValues(data, displayType, currentLang)} renderData={() => renderDataTable(data, currentLang, displayType)} />
        </Col>
      </Row>
      <Row className="fr-my-1w">
        <Col>
          <ChartWrapper config={configChart3} options={optionsSuccessRates(data, displayType, currentLang)} renderData={() => renderDataTableRates(data, currentLang, displayType)} />
        </Col>
      </Row>
    </Container>
  );
}
