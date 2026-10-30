import { Col, Container, Radio, Row, Title } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { useSearchParams } from "react-router-dom";
import ChartFooter from "../../../../../../../components/chart-footer/index.js";
import ChartWrapper from "../../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../../components/charts-skeletons/default";
import { EPChartsSources } from "../../../../../config.js";
import i18nGlobal from "../../../../../i18n-global.json";
import i18nLocal from "./i18n.json";
import optionsNumberInvolved from "./options-number_involved";
import optionNumberInvolvedSuccessRate from "./options-number_involved-succes-rate";
import { getData } from "./query";
import { readingKey, renderDataTableParticipations, renderDataTableParticipationsSuccessRate, useGetParams } from "./utils";

export default function FundingRankingParticipations() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const [sortBy, setSortBy] = useState("candidates");
  const params = useGetParams();

  const configChart3a = {
    id: "fundingRankingInvolved",
    integrationURL: `/integration/chart_id=FundingRankingParticipations&${params}`,
  };

  const configChart3b = {
    id: "fundingRankingInvolvedSuccessRate",
    integrationURL: `/integration/chart_id=FundingRankingParticipations&${params}`,
  };

  const { data, isLoading } = useQuery({
    queryKey: ["fundingRankingParticipations", params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const prepareData = (data, sortKey) => {
    data.sort((a, b) => b[sortKey] - a[sortKey]);
    if (sortBy === "candidates") {
      data.sort((a, b) => b.total_number_involved_evaluated - a.total_number_involved_evaluated);
    } else {
      data.sort((a, b) => b.total_number_involved_successful - a.total_number_involved_successful);
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
          {/* <Callout className="callout-style">
            Ce graphique illustre le positionnement du pays sélectionné par rapport aux autres pays en fonction du nombre de participants impliqués dans les projets évalués et réussis (lauréats). La barre bleue représente le nombre de participants
            dans les projets évalués, tandis que la barre verte indique le nombre de participants dans les projets réussis. Le classement est basé sur ces deux critères, offrant une perspective comparative sur l'engagement des pays dans les projets
            européens.
            <br />
            Le second graphique présente le taux de succès des participants du pays sélectionné par rapport à la moyenne européenne, fournissant ainsi une évaluation de l'efficacité des participations nationales dans les projets financés.
          </Callout> */}
        </Col>
      </Row>
      <Row>
        <Col>
          <fieldset className="fr-mb-2w">
            <legend>{getI18nLabel("sort-by")}</legend>
            <Radio
              checked={sortBy === "candidates"}
              className="fr-mb-1w"
              defaultValue="candidates"
              label={getI18nLabel("sort-by-candidates")}
              name="FundingRankingParticipations-radio"
              onChange={(e) => {
                setSortBy((e.target as HTMLInputElement).value);
              }}
            />
            <Radio
              checked={sortBy === "participants"}
              className="fr-mb-1w"
              defaultValue="participants"
              label={getI18nLabel("sort-by-participants")}
              name="FundingRankingParticipations-radio"
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
            {getI18nLabel("configChart3a-title")}
          </Title>
          <ChartWrapper
            config={configChart3a}
            options={optionsNumberInvolved(prepareData(data, "total_number_involved_successful"), currentLang)}
            renderData={() => renderDataTableParticipations(prepareData(data, "total_number_involved_successful"), currentLang, searchParams.get("country_code") ?? null)}
          />
        </Col>
        <Col xs={12}>
          <Title as="h3" look="h5" className="fr-mb-0">
            {getI18nLabel("configChart3b-title")}
          </Title>
          <ChartWrapper
            config={configChart3b}
            options={optionNumberInvolvedSuccessRate(prepareData(data, "total_number_involved_successful"), currentLang)}
            renderData={() => renderDataTableParticipationsSuccessRate(prepareData(data, "total_number_involved_successful"), currentLang, searchParams.get("country_code") ?? null)}
          />
        </Col>
        <Col xs={12} md={12} className="chart-footer">
          <ChartFooter
            comment={{
              fr: (
                <>
                  Ce graphique compare les taux de succès des pays les plus représentés en terme de candidats et de participants dans les projets.
                </>
              ),
              en: (
                <>
                  This chart compares the success rates of the countries with the highest numbers of applicants and participants in projects.
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
