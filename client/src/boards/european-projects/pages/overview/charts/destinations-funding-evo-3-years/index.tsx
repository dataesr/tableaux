import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import Cookies from "js-cookie";

import { GetData } from "./query";
import optionsSubsidiesValues from "./options-values";
import optionsSubsidiesRates from "./options-rates";
import optionsSubsidiesCountryRates from "./options-success-rates";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import { getDefaultParams } from "./utils";
import { Container, Row, Col, Button } from "@dataesr/dsfr-plus";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { RenderDataSubsidiesValuesAndRates } from "./render-data";
import { useState } from "react";

import i18nGlobal from "../../../../i18n-global.json";
import i18nLocal from "./i18n.json";

import { normalizeIdForCssColorNames } from "../../../../utils";

const configChart1 = {
  id: "destinationsEvolutionFundingLines",
  title: {
    fr: "Destinations - Evolution des financements demandés et obtenus (M€)",
    en: "Destinations - Financing applied for and obtained (€m)",
  },
  description: {
    fr: "",
    en: "",
  },
  subtitle: "",
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/projects-types-3",
};
const configChart2 = {
  id: "destinationsEvolutionFundingLinesRates",
  title: {
    fr: "Destinations - Evolution du taux de succès des financements demandés et obtenus",
    en: "Destinations - Trend in the success rate of financing applications and grants",
  },
  description: {
    fr: "",
    en: "",
  },
  subtitle: "",
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/projects-types-3",
};
const configChart3 = {
  id: "destinationsEvolutionFundingLinesSuccessRate",
  title: {
    fr: "Destinations - Part des subventions du pays demandées et obtenus par rapport au total des participants",
    en: "Destinations - Percentage of country funding applied for and obtained as a proportion of total participants",
  },
  description: {
    fr: "",
    en: "",
  },
  subtitle: "",
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/projects-types-3",
};

export default function DestinationsFundingEvo3Years() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const params = getDefaultParams(searchParams);
  const [displayType, setDisplayType] = useState("total_fund_eur");

  const { data, isLoading } = useQuery({
    queryKey: [
      "DestinationsFundingEvo3Years",
      params,
      Cookies.get("selectedDestinations"),
    ],
    queryFn: () => GetData(params),
  });

  if (isLoading || !data)
    return (
      <>
        <DefaultSkeleton col={2} />
        <DefaultSkeleton />
      </>
    );

  const i18n = { ...i18nGlobal, ...i18nLocal };
  function getI18nLabel(key) {
    return i18n[key][currentLang];
  }

  function Legend() {
    const rootStyles = getComputedStyle(document.documentElement);
    const [showAll, setShowAll] = useState(false);

    const destinations = data.find((item) => item.country !== "all").data[0]
      .destinations;

    const displayedItems = showAll ? destinations : destinations.slice(0, 5);

    return (
      <fieldset className="legend">
        <legend>{getI18nLabel("legend")}</legend>
        <ul>
          {displayedItems.map((item) => (
            <li key={item.destination_code}>
              <div
                style={{
                  background: rootStyles.getPropertyValue(`--destination-${normalizeIdForCssColorNames(item.destination_code)}-color`),
                }}
              />
              <span>
                {item[`destination_name_${currentLang}`]}
                {" - "}
                <b>{item[`destination_code`]}</b>
              </span>
            </li>
          ))}
        </ul>
        {destinations.length > 5 && (
          <Button onClick={() => setShowAll(!showAll)} size="sm" variant="tertiary">
            {showAll ? getI18nLabel("show-less") : getI18nLabel("show-more")}
          </Button>
        )}
      </fieldset>
    );
  }

  return (
    <Container fluid>
      <Row className="fr-my-1w">
        <Col>
          <select className="fr-select" onChange={(e) => setDisplayType(e.target.value)}>
            <option value="total_fund_eur">{getI18nLabel("total-fund-eur")}</option>
            <option value="total_coordination_number">{getI18nLabel("total-coordination-number")}</option>
            <option value="total_number_involved">{getI18nLabel("total-number-involved")}</option>
          </select>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <ChartWrapper config={configChart1} options={optionsSubsidiesValues(data, displayType)} renderData={RenderDataSubsidiesValuesAndRates} />
        </Col>
        <Col>
          <ChartWrapper config={configChart2} options={optionsSubsidiesRates(data, displayType)} renderData={RenderDataSubsidiesValuesAndRates} />
        </Col>
      </Row>
      <Row>
        <Col>
          <Legend />
        </Col>
      </Row>
      <Row>
        <Col>
          <ChartWrapper
            config={configChart3}
            options={optionsSubsidiesCountryRates(data, displayType)}
            renderData={RenderDataSubsidiesValuesAndRates}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <Legend />
        </Col>
      </Row>
    </Container>
  );
}
