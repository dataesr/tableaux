import { Col, Container, Row } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.js";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.js";
import { getI18nLabel } from "../../../../../../utils.js";
import { EPChartsSources } from "../../../../config.js";
import i18nGlobal from "../../../../i18n-global.json";
import i18nLocal from "./i18n.json";
import { getEvolChartTexts, getItemsCountFromData, getLevelFromData } from "../../evol-charts-text";
import getOptionsSuccessRates from "./options-success-rates.js";
import getOptionsValues from "./options-values.js";
import { getData } from "./query.js";
import { renderDataTable, renderDataTableRates, successRatesReadingKey, useGetParams, valuesSuccessReadingKey } from "./utils.js";

export default function FundingEvo() {
  const [displayType, setDisplayType] = useState("total_fund_eur");

  const { params, currentLang, countryN, adjMascPlural } = useGetParams();
  const { data, isLoading } = useQuery({
    queryKey: ["FundingEvo", params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data)
    return (
      <>
        <DefaultSkeleton />
        <DefaultSkeleton />
      </>
    );

  // level correspond à pillar | program | topic | destination
  // count : plusieurs thématiques peuvent être sélectionnées
  const level = getLevelFromData(data);
  const count = getItemsCountFromData(data);
  const textsChart1 = getEvolChartTexts({ chart: "values", displayType, level, countryN, adjMascPlural, count });
  const textsChart2 = getEvolChartTexts({ chart: "rates", displayType, level, countryN, adjMascPlural, count });

  const configChart1 = {
    id: "EvolutionFundingLines",
    title: textsChart1.title,
    comment: textsChart1.comment,
    readingKey: valuesSuccessReadingKey(data, displayType, currentLang, countryN, adjMascPlural),
    sources: EPChartsSources,
    integrationURL: "/european-projects/components/pages/analysis/overview/charts/topics-types-3",
  };

  const configChart2 = {
    id: "EvolutionFundingLinesSuccessRate",
    title: textsChart2.title,
    comment: textsChart2.comment,
    readingKey: successRatesReadingKey(data, displayType, currentLang, countryN, adjMascPlural),
    sources: EPChartsSources,
    integrationURL: "/european-projects/components/pages/analysis/overview/charts/topics-types-3",
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
          <ChartWrapper config={configChart2} options={getOptionsSuccessRates(data, displayType, currentLang)} renderData={() => renderDataTableRates(data, currentLang, displayType)} />
        </Col>
      </Row>
    </Container>
  );
}
