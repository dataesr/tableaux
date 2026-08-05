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
      fr: "Classement des pays selon la part des montants demandés et obtenus (M€)",
      en: "Ranking of countries by share of amounts requested and obtained (M€)",
    },
    comment: {
      fr: (
        <>
          Ce graphique présente deux colonnes par pays : la colonne <strong style={{ color: "var(--evaluated-project-color)" }}>bleue</strong>{" "}
          représente la part des montants demandés (projets évalués) et la colonne{" "}
          <strong style={{ color: "var(--successful-project-color)" }}>verte</strong> la part des montants obtenus (projets lauréats). Le chiffre
          affiché sur chaque colonne indique le <strong>rang du pays</strong> dans le classement européen pour cette catégorie. Un écart important
          entre les deux colonnes d'un même pays signale une différence de performance entre sa capacité à déposer des demandes et à obtenir des
          subventions. Vous avez la possibilité de trier le classement soit par montant total évalué, soit par montant total obtenu.
        </>
      ),
      en: (
        <>
          This chart shows two columns per country: the <strong style={{ color: "var(--evaluated-project-color)" }}>blue</strong> column represents
          the share of requested amounts (evaluated projects) and the <strong style={{ color: "var(--successful-project-color)" }}>green</strong>{" "}
          column shows the share of obtained amounts (successful projects). The number displayed on each column indicates the country's{" "}
          <strong>rank</strong> in the European ranking for that category. A significant gap between the two columns of the same country indicates a
          difference in performance between its ability to submit applications and to obtain funding. You can sort the ranking either by total
          evaluated amount or by total obtained amount.
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
      <Row>
        <Col>
          <Title as="h2" look="h4">
            {getI18nLabel("title")}
          </Title>
          <Callout className="callout-style">
            La part des montants demandés et obtenus est calculée en divisant le montant total obtenu par le montant total demandé pour chaque pays. Cet indicateur permet de mesurer l'efficacité des pays dans l'obtention de subventions par rapport à
            leurs demandes. Plus la part est élevée, meilleure est la performance du pays en matière de financement.
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
