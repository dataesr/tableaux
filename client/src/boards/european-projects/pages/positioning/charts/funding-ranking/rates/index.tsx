import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Col, Container, Radio, Row, Title } from "@dataesr/dsfr-plus";

import { getData } from "./query";
import { useGetParams, renderDataTable } from "./utils";
import optionsSubRates from "./options-sub-rates";
import ChartWrapper from "../../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../../components/charts-skeletons/default";
import { useSearchParams } from "react-router-dom";

import { EPChartsSources } from "../../../../../config.js";

import i18nGlobal from "../../../../../i18n-global.json";
import i18nLocal from "./i18n.json";
import Callout from "../../../../../../../components/callout.js";
import { readingKey } from "./utils.js";

export default function FundingRankingRates() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const [sortBy, setSortBy] = useState("evaluated");
  const params = useGetParams();

  const chartId = "fundingRankingRates";
  const { data, isLoading } = useQuery({
    queryKey: [chartId, params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton />;

  const configChartFundingRankingSubRates = {
    id: chartId,
    title: {
      fr: "Part des financements demandés et obtenus par les principaux pays bénéficiaires (M€)",
      en: "Share of funding requested and secured by top beneficiary countries (€M)",
    },
    comment: {
      fr: (
        <>
          Ce graphique présente la part de chaque pays dans l’ensemble des financements demandés et obtenus par les participants de tous les pays.
        </>
      ),
      en: (
        <>
          This chart shows each country's share of all funding requested and secured by participants from all countries.
        </>
      ),
    },
    readingKey: readingKey(data),
    sources: EPChartsSources,
    integrationURL: `/integration?chart_id=${chartId}&${params}`,
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
      {/* <Row>
        <Col>
          <Title as="h2" look="h4">
            {getI18nLabel("title")}
          </Title>
          <Callout className="callout-style">{getI18nLabel("callout")}</Callout>
        </Col>
      </Row> */}
      <Row>
        <Col>
          <fieldset className="fr-mb-2w">
            <legend>{getI18nLabel("sort-by")}</legend>
            <Radio
              checked={sortBy === "evaluated"}
              className="fr-mb-1w"
              defaultValue="evaluated"
              label={getI18nLabel("sort-by-evaluated-project")}
              name="FundingRankingRates-radio"
              onChange={(e) => {
                setSortBy((e.target as HTMLInputElement).value);
              }}
            />
            <Radio
              checked={sortBy === "successful"}
              className="fr-mb-1w"
              defaultValue="successful"
              label={getI18nLabel("sort-by-successful-project")}
              name="FundingRankingRates-radio"
              onChange={(e) => {
                setSortBy((e.target as HTMLInputElement).value);
              }}
            />
          </fieldset>
        </Col>
      </Row>
      <Row>
        <Col className="chart-container chart-container--default">
          <ChartWrapper
            config={configChartFundingRankingSubRates}
            options={optionsSubRates(prepareData(data, "total_successful"), currentLang)}
            renderData={() => renderDataTable(prepareData(data, "total_successful"), currentLang, searchParams.get("country_code") ?? null)}
          />
        </Col>
      </Row>
    </Container>
  );
}
