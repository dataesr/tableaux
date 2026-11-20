import { Col, Container, Row } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { getI18nLabel } from "../../../../../../utils";
import { EPChartsSources } from "../../../../config.js";
import i18nGlobal from "../../../../i18n-global.json";
import i18nLocal from "./i18n.json";
import { getEvolChartTexts, getLevelFromData } from "../../evol-charts-text" 
import optionsSuccessRates from "./options-success-rates";
import optionsValues from "./options-values";
import { getData } from "./query";
import { renderDataTable, renderDataTableRates, successRatesReadingKey, useGetParams, valuesSuccessReadingKey } from "./utils";


export default function PillarsFundingEvo3Years() {

  const [displayType, setDisplayType] = useState("total_fund_eur");
  const { params, currentLang, countryN, adjMascPlural } = useGetParams();

  // const { params } = useGetParams();
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

  // level correspond à pilier |program|topic
  const level = getLevelFromData(data);
  const textsChart1 = getEvolChartTexts({ chart: "values", displayType, level, countryN, adjMascPlural });
  const textsChart3 = getEvolChartTexts({ chart: "rates", displayType, level, countryN, adjMascPlural });


  const configChart1: {
    id: string;
    title?: { fr: string; en: string };
    comment?: { fr: React.JSX.Element; en: React.JSX.Element };
    readingKey: any;
    sources: any;
    integrationURL: string;
  } = {
    id: "pillarsEvolutionFundingLines",
    title: textsChart1.title,
    comment: textsChart1.comment,
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
    title: textsChart3.title,
    comment: textsChart3.comment,
    readingKey: successRatesReadingKey(data, displayType, currentLang, countryN, adjMascPlural),
    sources: EPChartsSources,
    integrationURL: "/european-projects/components/pages/analysis/overview/charts/projects-types-3",
  };

  const i18n = {
    ...i18nLocal,
    ...i18nGlobal,
  };

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
