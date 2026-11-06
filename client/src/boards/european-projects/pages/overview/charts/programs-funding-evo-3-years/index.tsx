import { Col, Container, Row } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { getI18nLabel } from "../../../../../../utils";
import { EPChartsSources } from "../../../../config.js";
import i18nGlobal from "../../../../i18n-global.json";
import i18nLocal from "./i18n.json";
import getOptionsSuccessRates from "./options-success-rates";
import getOptionsValues from "./options-values";
import { getData } from "./query";
import { renderDataTable, renderDataTableRates, successRatesReadingKey, useGetParams, valuesSuccessReadingKey } from "./utils";

export default function ProgramsFundingEvo3Years() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const [displayType, setDisplayType] = useState("total_fund_eur");

  const { params } = useGetParams();
  const { data, isLoading } = useQuery({
    queryKey: ["ProgramsFundingEvo3Years", params],
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
    id: "programsEvolutionFundingLines",
    readingKey: valuesSuccessReadingKey(data, displayType),
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
    id: "programsEvolutionFundingLinesSuccessRate",
    readingKey: successRatesReadingKey(data, displayType),
    sources: EPChartsSources,
    integrationURL: "/european-projects/components/pages/analysis/overview/charts/projects-types-3",
  };

  const i18n = {
    ...i18nLocal,
    ...i18nGlobal,
  };

  switch (displayType) {
    case "total_coordination_number":
      configChart1.title = { fr: "Evolution du nombre de projets coordonnés par le pays sélectionné sur Horizon Europe", en: "Trends in the number of projects coordinated by the selected country under Horizon Europe" };
      configChart1.comment = { fr: <></>, en: <></> };
      configChart3.title = { fr: "Part des projets coordonnés par le pays sélectionné sur l'ensemble des coordinations", en: "Proportion of projects coordinated by the selected country out of the total number of coordination roles" };
      configChart3.comment = { fr: <></>, en: <></> };
      break;
    case "total_number_involved":
      configChart1.title = { fr: "Evolution du nombre de candidats et de participants du pays sélectionné sur Horizon Europe", en: "Trends in the number of applicants and participants from the selected country under Horizon Europe" };
      configChart1.comment = { fr: <></>, en: <></> };
      configChart3.title = { fr: "Part du nombre de candidats et de participants du pays sélectionné", en: "Proportion of the total number of candidates and participants from the selected country" };
      configChart3.comment = { fr: <></>, en: <></> };
      break;
    case "total_projects":
      configChart1.title = { fr: "Evolution du nombre de projets impliquant au moins un participant du pays sélectionné sur Horizon Europe", en: "Trends in the number of projects involving at least one participant from the selected country under Horizon Europe" };
      configChart1.comment = { fr: <></>, en: <></> };
      configChart3.title = { fr: "Part du nombre de projets impliquant au moins un participant du pays sélectionné", en: "Proportion of projects involving at least one participant from the selected country" };
      configChart3.comment = { fr: <></>, en: <></> };
      break;
    default:
      configChart1.title = {
        fr: "Evolution des financements demandés et obtenus sur Horizon Europe",
        en: "Trends in funding requested and secured under Horizon Europe",
      };
      configChart1.comment = {
        fr: <>Ce graphique montre l'évolution des financements demandés et obtenus pour les programmes du programme Horizon Europe sur les trois dernières années. Les barres représentent les montants demandés et obtenus. La ligne verte indique le taux de
          succès correspondant.</>,
        en: <>This chart shows the evolution of funding applied for and obtained for the programs of the Horizon Europe programme over the last three years. The bars represent the amounts applied for and obtained. The line indicates the corresponding
          success rate.</>,
      };
      configChart3.title = {
        fr: "Part des financements du pays demandés et obtenus par rapport au total des participants sur Horizon Europe",
        en: "Proportion of funding requested and secured by the country as a proportion of the total number of participants in Horizon Europe",
      };
      configChart3.comment = {
        fr: <>Ce graphique montre le pourcentage des financements demandés et obtenus par le pays sélectionné par rapport au total des participants.</>,
        en: <>This chart shows the percentage of funding applied for and obtained by the selected country as a proportion of total participants.</>,
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
            <option value="total_projects">{getI18nLabel(i18n, "total-projects")}</option>
          </select>
        </Col>
      </Row>
      <Row>
        <Col md={12}>
          <ChartWrapper config={configChart1} options={getOptionsValues(data, displayType, currentLang)} renderData={() => renderDataTable(data, currentLang, displayType)} />
        </Col>
      </Row>
      <Row className="fr-my-1w">
        <Col>
          <ChartWrapper config={configChart3} options={getOptionsSuccessRates(data, displayType, currentLang)} renderData={() => renderDataTableRates(data, currentLang, displayType)} />
        </Col>
      </Row>
    </Container>
  );
}
