import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Col, Container, Radio, Row, Title } from "@dataesr/dsfr-plus";

import { getData } from "./query";
import { readingKey, useGetParams, renderDataTableProjects, renderDataTableProjectsSuccessRate } from "./utils";
import optionsProjects from "./options-projects";
import optionProjectsSuccessRate from "./options-projects-succes-rate";
import ChartWrapper from "../../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../../components/charts-skeletons/default";
import { useSearchParams } from "react-router-dom";

import { EPChartsSources } from "../../../../../config.js";

import i18nGlobal from "../../../../../i18n-global.json";
import i18nLocal from "./i18n.json";
import ChartFooter from "../../../../../../../components/chart-footer/index.js";
import Callout from "../../../../../../../components/callout.js";

export default function FundingRankingProjects() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const [sortBy, setSortBy] = useState("evaluated");
  const params = useGetParams();
  const selectedCountry = searchParams.get("country_code");

  const configChart4a = {
    id: "fundingRankingProjects",
    integrationURL: `/integration?chart_id=FundingRankingProjects&${params}`,
  };

  const configChart4b = {
    id: "fundingRankingProjectsSuccessRate",
    integrationURL: `/integration?chart_id=FundingRankingProjects&${params}`,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["fundingRankingProjects", params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const prepareData = (items, sortKey: string) => {
    const sorted = [...items].sort((a, b) => b[sortKey] - a[sortKey]);
    const dataToReturn = sorted.slice(0, 10);
    // Add selected country if it is not in the top 10
    if (selectedCountry) {
      const pos = sorted.findIndex((item) => item.id === selectedCountry);
      if (pos >= 10) {
        dataToReturn.pop();
        dataToReturn.push(sorted[pos]);
      }
    }
    return dataToReturn;
  };

  const i18n = { ...i18nGlobal, ...i18nLocal };
  function getI18nLabel(key) {
    return i18n[key][currentLang];
  }

  const sortKey = sortBy === "evaluated" ? "total_projects_evaluated" : "total_projects_successful";
  const chartData = prepareData(data, sortKey);

  return (
    <Container fluid className="fr-mt-5w">
      <Row>
        <Col>
          <Title as="h2" look="h4">
            {getI18nLabel("title")}
          </Title>
          <Callout className="callout-style">
            Ce graphique illustre le positionnement du pays sélectionné par rapport aux autres pays en fonction du nombre de projets évalués et lauréats. Le second graphique présente le taux de succès du pays sélectionné par rapport à la
            moyenne des pays affichés.
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
              name="FundingRankingProjects-radio"
              onChange={(e) => {
                setSortBy((e.target as HTMLInputElement).value);
              }}
            />
            <Radio
              checked={sortBy === "successful"}
              className="fr-mb-1w"
              defaultValue="successful"
              label={getI18nLabel("sort-by-successful-project")}
              name="FundingRankingProjects-radio"
              onChange={(e) => {
                setSortBy((e.target as HTMLInputElement).value);
              }}
            />
          </fieldset>
        </Col>
      </Row>
      <Row className="chart-container chart-container--default">
        <Col xs={12}>
          <Title as="h3" look="h5" className="fr-mb-0">
            {getI18nLabel("configChart4a-title")}
          </Title>
          <ChartWrapper config={configChart4a} options={optionsProjects(chartData, currentLang)} renderData={() => renderDataTableProjects(chartData, currentLang, selectedCountry)} />
        </Col>
        <Col xs={12}>
          <Title as="h3" look="h5" className="fr-mb-0">
            {getI18nLabel("configChart4b-title")}
          </Title>
          <ChartWrapper
            config={configChart4b}
            options={optionProjectsSuccessRate(chartData, currentLang)}
            renderData={() => renderDataTableProjectsSuccessRate(chartData, currentLang, selectedCountry)}
          />
        </Col>
        <Col xs={12} md={12} className="chart-footer">
          <ChartFooter
            comment={{
              fr: (
                <>
                  Ce graphique présente le positionnement du pays sélectionné par rapport aux autres pays en fonction du nombre de projets évalués et lauréats. {""}
                  Le taux de succès est le rapport entre le nombre de projets lauréats et le nombre projets évalués.
                </>
              ),
              en: (
                <>
                  This chart shows the positioning of the selected country compared to other countries based on the number of evaluated and successful projects.{ " "}
                  The success rate is the ratio of successful projects number to evaluated projects number.
                </>
              ),
            }}
            readingKey={readingKey(data, selectedCountry)}
            sources={EPChartsSources}
          />
        </Col>
      </Row>
    </Container>
  );
}
