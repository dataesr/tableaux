import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Col, Container, Radio, Row, Title } from "@dataesr/dsfr-plus";

import { getData } from "./query";
import { readingKey, useGetParams, renderDataTableCoordination, renderDataTableCoordinationSuccessRate } from "./utils";
import optionsCoordinationNumber from "./options-coordination_number";
import optionCoordinationNumberSuccessRate from "./options-coordination_number-succes-rate";
import ChartWrapper from "../../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../../components/charts-skeletons/default";
import { useSearchParams } from "react-router-dom";

import { EPChartsSources } from "../../../../../config.js";

import i18nGlobal from "../../../../../i18n-global.json";
import i18nLocal from "./i18n.json";
import ChartFooter from "../../../../../../../components/chart-footer/index.js";
import Callout from "../../../../../../../components/callout.js";

export default function FundingRankingCoordination() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const [sortBy, setSortBy] = useState("evaluated");
  const params = useGetParams();

  const { data, isLoading } = useQuery({
    queryKey: ["fundingRankingCoordination", params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const configChart2a = {
    id: "fundingRankingCoordination",
    integrationURL: `/integration?chart_id=FundingRankingCoordination&${params}`,
  };

  const configChart2b = {
    id: "fundingRankingCoordinationSuccessRate",
    integrationURL: `/integration?chart_id=FundingRankingCoordination&${params}`,
  };

  const prepareData = (data, sortKey) => {
    data.sort((a, b) => b[sortKey] - a[sortKey]);
    if (sortBy === "evaluated") {
      data.sort((a, b) => b.total_evaluated - a.total_evaluated);
    } else {
      data.sort((a, b) => b.total_successful - a.total_successful);
    }
    // Add selected country if it is not in the top 10
    const dataToReturn = data.slice(0, 10);
    const selectedCountry = searchParams.get("country_code");
    if (selectedCountry) {
      const pos = data.findIndex((item) => item.id === selectedCountry);
      if (pos >= 10 && pos !== -1) {
        dataToReturn.pop();
        const countryData = data[pos];
        dataToReturn.push(countryData);
      }
    }
    return dataToReturn;
  };

  const i18n = { ...i18nGlobal, ...i18nLocal };
  function getI18nLabel(key) {
    return i18n[key][currentLang];
  }

  return (
    <Container fluid className="fr-mt-5w">
      <Row>
        <Col>
          <Title as="h2" look="h4">
            {getI18nLabel("title")}
          </Title>
          <Callout className="callout-style">
            Ce graphique présente le classement des pays en fonction du nombre de coordinations de projets européens déposés et lauréats. Les coordinations représentent le rôle principal dans un projet européen. La barre bleue indique le nombre de
            coordinations de projets déposés (évalués), tandis que la barre verte indique le nombre de coordinations de projets lauréats.
            <br />
            Le second graphique illustre le taux de succès des coordinations de projets pour chaque pays, comparant le pays sélectionné à la moyenne européenne.
          </Callout>
        </Col>
      </Row>
      <Row>
        <Col>
          <fieldset className="fr-mb-2w">
            <legend>{getI18nLabel("sort-by")}</legend>
            <Radio
              checked={sortBy === "evaluated"}
              className="fr-mb-1w"
              defaultValue="evaluated"
              label={getI18nLabel("sort-by-evaluated-project")}
              name="FundingRankingCoordination-radio"
              onChange={(e) => {
                setSortBy((e.target as HTMLInputElement).value);
              }}
            />
            <Radio
              checked={sortBy === "successful"}
              className="fr-mb-1w"
              defaultValue="successful"
              label={getI18nLabel("sort-by-successful-project")}
              name="FundingRankingCoordination-radio"
              onChange={(e) => {
                setSortBy((e.target as HTMLInputElement).value);
              }}
            />
          </fieldset>
        </Col>
      </Row>
      <Row className="chart-container chart-container--default">
        <Col md={6}>
          <Title as="h3" look="h5" style={{ minHeight: "4.5rem", lineHeight: "1.5rem" }} className="fr-mb-0">
            {getI18nLabel("configChart2a-title")}
          </Title>
          <ChartWrapper
            config={configChart2a}
            options={optionsCoordinationNumber(prepareData(data, "total_coordination_number_successful"), currentLang)}
            renderData={() => renderDataTableCoordination(prepareData(data, "total_coordination_number_successful"), currentLang, searchParams.get("country_code") ?? null)}
          />
        </Col>
        <Col md={6}>
          <Title as="h3" look="h5" style={{ minHeight: "4.5rem", lineHeight: "1.5rem" }} className="fr-mb-0">
            {getI18nLabel("configChart2b-title")}
          </Title>
          <ChartWrapper
            config={configChart2b}
            options={optionCoordinationNumberSuccessRate(prepareData(data, "total_coordination_number_successful"), currentLang)}
            renderData={() => renderDataTableCoordinationSuccessRate(prepareData(data, "total_coordination_number_successful"), currentLang, searchParams.get("country_code") ?? null)}
          />
        </Col>
        <Col md={12} className="chart-footer">
          <ChartFooter
            comment={{
              fr: (
                <>
                  Ce graphique représente le positionnement du pays sélectionné par rapport aux autres pays en fonction du nombre de coordinations de projets déposés et lauréats. La barre bleue correspond aux coordinations déposées, la barre verte
                  aux coordinations lauréates. Le taux de succès compare le pays sélectionné avec la moyenne européenne.
                </>
              ),
              en: (
                <>
                  This chart shows the positioning of the selected country compared to other countries based on the number of project coordinations submitted and winners. The blue bar corresponds to submitted coordinations, the green bar to winning
                  coordinations. The success rate compares the selected country with the European average.
                </>
              ),
            }}
            readingKey={readingKey(data)}
            sources={EPChartsSources}
          />
        </Col>
      </Row>
    </Container>
  );
}
