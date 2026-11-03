import { Col, Container, Row } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.js";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.js";
import { getI18nLabel } from "../../../../../../utils.js";
import { EPChartsSources } from "../../../../config.js";
import i18nGlobal from "../../../../i18n-global.json";
import i18nLocal from "./i18n.json";
import optionsSuccessRates from "./options-success-rates.js";
import optionsValues from "./options-values.js";
import { getData } from "./query.js";
import { renderDataTable, renderDataTableRates, successRatesReadingKey, useGetParams, valuesSuccessReadingKey } from "./utils.js";

export default function FundingEvo() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const [displayType, setDisplayType] = useState("total_fund_eur");

  const { params } = useGetParams();
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

  let titleChart1, commentChart1, titleChart2, commentChart2;
  switch (displayType) {
    case "total_coordination_number":
      titleChart1 = { fr: "Evolution du nombre de projets coordonnés par le pays sélectionné sur Horizon Europe", en: "Trends in the number of projects coordinated by the selected country under Horizon Europe" };
      commentChart1 = {
        fr: (
          <>
            Ce graphique montre l'évolution du nombre de coordinations de projets demandées et obtenues sur le programme Horizon Europe. Les barres représentent les coordinations demandées et obtenues. La ligne indique le taux de succès
            correspondant.
          </>
        ),
        en: (
          <>
            This chart shows the evolution of the number of project coordinations applied for and obtained in the Horizon Europe programme. The bars represent the coordinations applied for and obtained. The line indicates the corresponding success
            rate.
          </>
        ),
      };
      titleChart2 = { fr: "Part des projets coordonnés par le pays sélectionné sur l'ensemble des coordinations", en: "Proportion of projects coordinated by the selected country out of the total number of coordination roles" };
      commentChart2 = {
        fr: <>Ce graphique montre le pourcentage de coordinations demandées et obtenues par le pays sélectionné par rapport au total des coordinations.</>,
        en: <>This chart shows the percentage of coordinations applied for and obtained by the selected country as a proportion of total coordinations.</>,
      };
      break;
    case "total_number_involved":
      titleChart1 = { fr: "Evolution du nombre de candidats et de participants du pays sélectionné sur Horizon Europe", en: "Trends in the number of applicants and participants from the selected country under Horizon Europe" };
      commentChart1 = {
        fr: <>Ce graphique montre l'évolution du nombre de participations demandées et obtenues sur le programme Horizon Europe. Les barres représentent les participations demandées et obtenues. La ligne indique le taux de succès correspondant.</>,
        en: (
          <>This chart shows the evolution of the number of participations applied for and obtained in the Horizon Europe programme. The bars represent the participations applied for and obtained. The line indicates the corresponding success rate.</>
        ),
      };
      titleChart2 = { fr: "Part du nombre de candidats et de participants du pays sélectionné", en: "Proportion of the total number of candidates and participants from the selected country" };
      commentChart2 = {
        fr: <>Ce graphique montre le pourcentage de participations demandées et obtenues par le pays sélectionné par rapport au total des participants.</>,
        en: <>This chart shows the percentage of participations applied for and obtained by the selected country as a proportion of total participants.</>,
      };
      break;
    case "total_projects":
      titleChart1 = { fr: "Evolution du nombre de projets impliquant au moins un participant du pays sélectionné sur Horizon Europe", en: "Trends in the number of projects involving at least one participant from the selected country under Horizon Europe" };
      commentChart1 = {
        fr: <>Ce graphique montre l'évolution du nombre de projets demandés et obtenus sur le programme Horizon Europe. Les barres représentent les projets demandés et obtenus. La ligne indique le taux de succès correspondant.</>,
        en: <>This chart shows the evolution of the number of projects applied for and obtained in the Horizon Europe programme. The bars represent the projects applied for and obtained. The line indicates the corresponding success rate.</>,
      };
      titleChart2 = { fr: "Part du nombre de projets impliquant au moins un participant du pays sélectionné", en: "Proportion of projects involving at least one participant from the selected country" };
      commentChart2 = {
        fr: <>Ce graphique montre le pourcentage de projets demandés et obtenus par le pays sélectionné par rapport au total des projets.</>,
        en: <>This chart shows the percentage of projects applied for and obtained by the selected country as a proportion of total projects.</>,
      };
      break;
    default:
      titleChart1 = { fr: "Evolution des financements demandés et obtenus (M€) sur Horizon Europe", en: "Trends in funding requested and awarded (M€) under Horizon Europe" };
      commentChart1 = {
        fr: (
          <>
            Ce graphique montre l'évolution des financements demandés et obtenus pour les thématiques du programme Horizon Europe sur les trois dernières années. Les barres représentent les montants demandés et obtenus. La ligne verte indique le taux
            de succès correspondant.
          </>
        ),
        en: (
          <>
            This chart shows the evolution of funding applied for and obtained for the topics of the Horizon Europe programme over the last three years. The bars represent the amounts applied for and obtained. The line indicates the corresponding
            success rate.
          </>
        ),
      };
      titleChart2 = { fr: "Part des financements demandés et obtenus par le pays sélectionné", en: "Proportion of funding requested and secured by the selected country" };
      commentChart2 = {
        fr: <>Ce graphique montre le pourcentage des financements demandés et obtenus par le pays sélectionné par rapport au total des participants.</>,
        en: <>This chart shows the percentage of funding applied for and obtained by the selected country as a proportion of total participants.</>,
      };
  }

  const configChart1 = {
    id: "EvolutionFundingLines",
    title: titleChart1,
    comment: commentChart1,
    readingKey: valuesSuccessReadingKey(data, displayType),
    sources: EPChartsSources,
    integrationURL: "/european-projects/components/pages/analysis/overview/charts/topics-types-3",
  };

  const configChart2 = {
    id: "EvolutionFundingLinesSuccessRate",
    title: titleChart2,
    comment: commentChart2,
    readingKey: successRatesReadingKey(data, displayType, currentLang),
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
          <ChartWrapper config={configChart1} options={optionsValues(data, displayType, currentLang)} renderData={() => renderDataTable(data, currentLang, displayType)} />
        </Col>
      </Row>
      <Row className="fr-my-1w">
        <Col>
          <ChartWrapper config={configChart2} options={optionsSuccessRates(data, displayType, currentLang)} renderData={() => renderDataTableRates(data, currentLang, displayType)} />
        </Col>
      </Row>
    </Container>
  );
}
