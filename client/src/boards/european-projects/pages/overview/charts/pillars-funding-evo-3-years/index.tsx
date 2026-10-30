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

export default function PillarsFundingEvo3Years() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const [displayType, setDisplayType] = useState("total_fund_eur");

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
    id: "pillarsEvolutionFundingLinesSuccessRate",
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
    configChart1.title = { fr: "Evolution des coordinations", en: "Evolution of coordinations" };
    configChart1.comment = { fr: <></>, en: <></> };
    configChart3.title = { fr: "Evolution de la part des coordinations", en: "Evolution of percentage of country coordinations" };
    configChart3.comment = { fr: <></>, en: <></> };
    break;
  case "total_number_involved":
    configChart1.title = { fr: "Evolution des participants", en: "Evolution of participants" };
    configChart1.comment = { fr: <></>, en: <></> };
    configChart3.title = { fr: "Evolution de la part des participants", en: "Evolution of percentage of participants" };
    configChart3.comment = { fr: <></>, en: <></> };
    break;
  case "total_projects":
    configChart1.title = { fr: "Evolution des projets", en: "Evolution of projects" };
    configChart1.comment = { fr: <></>, en: <></> };
    configChart3.title = { fr: "Evolution de la part des projets", en: "Evolution of percentage of projects" };
    configChart3.comment = { fr: <></>, en: <></> };
    break;
  default:
    configChart1.title = {
      fr: "Evolution des financements demandés et obtenus (M€) sur Horizon Europe",
      en: "Financing applied for and obtained (€m) evolution on Horizon Europe",
    };
    configChart1.comment = {
      fr: <>Ce graphique montre l'évolution des financements demandés et obtenus pour les piliers du programme Horizon Europe. Les barres représentent les montants demandés et obtenus. Le point orange indique le taux de succès correspondant.</>,
      en: <>This chart shows funding applied for and obtained for Horizon Europe pillars. The bars show amounts, the orange point shows success rate.</>,
    };
    configChart3.title = {
      fr: "Part des financements du pays demandés et obtenus par rapport au total des participants",
      en: "Percentage of country funding applied for and obtained as a proportion of total participants",
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
