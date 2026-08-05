import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Col, Container, Radio, Row, Title } from "@dataesr/dsfr-plus";

import { getData } from "./query";
import { readingKey, useGetParams, renderDataTableParticipations, renderDataTableParticipationsSuccessRate } from "./utils";
import optionsNumberInvolved from "./options-number_involved";
import optionNumberInvolvedSuccessRate from "./options-number_involved-succes-rate";
import ChartWrapper from "../../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../../components/charts-skeletons/default";
import { useSearchParams } from "react-router-dom";

import { EPChartsSources } from "../../../../../config.js";

import i18nGlobal from "../../../../../i18n-global.json";
import i18nLocal from "./i18n.json";
import ChartFooter from "../../../../../../../components/chart-footer/index.js";
import Callout from "../../../../../../../components/callout.js";

export default function FundingRankingParticipations() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const [sortBy, setSortBy] = useState("evaluated");
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
            Ce graphique illustre le positionnement du pays sélectionné par rapport aux autres pays en fonction du nombre de participants impliqués dans les projets évalués et réussis (lauréats). La barre bleue représente le nombre de participants
            dans les projets évalués, tandis que la barre verte indique le nombre de participants dans les projets réussis. Le classement est basé sur ces deux critères, offrant une perspective comparative sur l'engagement des pays dans les projets
            européens.
            <br />
            Le second graphique présente le taux de succès des participants du pays sélectionné par rapport à la moyenne européenne, fournissant ainsi une évaluation de l'efficacité des participations nationales dans les projets financés.
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
              name="FundingRankingParticipations-radio"
              onChange={(e) => {
                setSortBy((e.target as HTMLInputElement).value);
              }}
            />
            <Radio
              checked={sortBy === "successful"}
              className="fr-mb-1w"
              defaultValue="successful"
              label={getI18nLabel("sort-by-successful-project")}
              name="FundingRankingParticipations-radio"
              onChange={(e) => {
                setSortBy((e.target as HTMLInputElement).value);
              }}
            />
          </fieldset>
        </Col>
      </Row>
      <Row className="chart-container chart-container--default">
        <Col>
          <Title as="h3" look="h5" style={{ minHeight: "4.5rem", lineHeight: "1.5rem" }} className="fr-mb-0">
            {getI18nLabel("configChart3a-title")}
          </Title>
          <ChartWrapper
            config={configChart3a}
            options={optionsNumberInvolved(prepareData(data, "total_number_involved_successful"), currentLang)}
            renderData={() => renderDataTableParticipations(prepareData(data, "total_number_involved_successful"), currentLang, searchParams.get("country_code") ?? null)}
          />
        </Col>
        <Col>
          <Title as="h3" look="h5" style={{ minHeight: "4.5rem", lineHeight: "1.5rem" }} className="fr-mb-0">
            {getI18nLabel("configChart3b-title")}
          </Title>
          <ChartWrapper
            config={configChart3b}
            options={optionNumberInvolvedSuccessRate(prepareData(data, "total_number_involved_successful"), currentLang)}
            renderData={() => renderDataTableParticipationsSuccessRate(prepareData(data, "total_number_involved_successful"), currentLang, searchParams.get("country_code") ?? null)}
          />
        </Col>
        <Col md={12} className="chart-footer">
          <ChartFooter
            comment={{
              fr: (
                <>
                  Ce graphique représente le positionnement du pays sélectionné par rapport aux autres pays en fonction du nombre de participants impliqués dans les projets évalués et réussis. La barre bleue correspond aux participants dans les
                  projets évalués, la barre verte aux participants dans les projets réussis. Le taux de succès compare le pays sélectionné avec la moyenne européenne.
                </>
              ),
              en: (
                <>
                  This chart shows the positioning of the selected country compared to other countries based on the number of participants involved in evaluated and successful projects. The blue bar corresponds to participants in evaluated projects,
                  the green bar to participants in successful projects. The success rate compares the selected country with the European average.
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
