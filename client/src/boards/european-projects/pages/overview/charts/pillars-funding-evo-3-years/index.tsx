import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { GetData } from "./query";
import optionsValues from "./options-values";
import optionsSuccessRates from "./options-success-rates";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import { getDefaultParams, successRatesReadingKey, valuesSuccessReadingKey, renderDataTable, renderDataTableRates } from "./utils";
import { Container, Row, Col } from "@dataesr/dsfr-plus";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { useState } from "react";
import { getI18nLabel } from "../../../../../../utils";

import i18nLocal from "./i18n.json";
import i18nGlobal from "../../../../i18n-global.json";
import { EPChartsSources } from "../../../../config.js";
// TODO: adapter les commentaires en fonction du selecteur
// TODO: fix renderDataTable()

export default function PillarsFundingEvo3Years() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const params = getDefaultParams(searchParams);
  const [displayType, setDisplayType] = useState("total_fund_eur");

  const { data, isLoading } = useQuery({
    queryKey: ["PillarsFundingEvo3Years", params],
    queryFn: () => GetData(params),
  });

  if (isLoading || !data)
    return (
      <>
        <DefaultSkeleton />
        <DefaultSkeleton />
      </>
    );

  const configChart1 = {
    id: "pillarsEvolutionFundingLines",
    title: {
      fr: "Evolution des financements demandées et obtenues (M€) sur Horizon Europe - 3 dernières années",
      en: "Financing applied for and obtained (€m) evolution on Horizon Europe - last 3 years",
    },
    comment: {
      fr: (
        <>
          Ce graphique montre l'évolution des financements demandés et obtenus pour les piliers du programme Horizon Europe sur les trois dernières
          années. Les barres représentent les montants demandés et obtenus. La ligne verte indique le taux de succès correspondant.
        </>
      ),
      en: (
        <>
          This chart shows the evolution of funding applied for and obtained for the pillars of the Horizon Europe programme over the last three
          years. The bars represent the amounts applied for and obtained. The line indicates the corresponding success rate.
        </>
      ),
    },
    readingKey: valuesSuccessReadingKey(data, displayType),
    sources: EPChartsSources,
    integrationURL: "/european-projects/components/pages/analysis/overview/charts/projects-types-3",
  };

  const configChart3 = {
    id: "pillarsEvolutionFundingLinesSuccessRate",
    title: {
      fr: "Part des financements du pays demandés et obtenus par rapport au total des participants",
      en: "Percentage of country funding applied for and obtained as a proportion of total participants",
    },
    comment: {
      fr: <>Ce graphique montre le pourcentage des financements demandés et obtenus par le pays sélectionné par rapport au total des participants.</>,
      en: <>This chart shows the percentage of funding applied for and obtained by the selected country as a proportion of total participants.</>,
    },
    readingKey: successRatesReadingKey(data, displayType),
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
