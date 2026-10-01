import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { GetData } from "./query";
import optionsSubsidiesValues from "./options-subsidies_values";
import optionsSubsidiesRates from "./options-subsidies_rates";
import optionsCoordinationNumber from "./options-coordination_number_values";
import OptionsCoordinationNumberRates from "./options-coordination_number_rates";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import { getDefaultParams } from "./utils";
import { Container, Row, Col } from "@dataesr/dsfr-plus";
import { GetLegend } from "../../../../components/legend";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import {
  RenderDataSubsidiesValues,
  RenderDataSubsidiesRates,
  RenderDataCoordinationNumberValues,
  RenderDataCoordinationNumberRates,
} from "./render-data";

  const configChart1a = {
    id: "pillarsSubsidiesRequestedByProjects",
    title: "",
    subtitle: "Financements demandés et obtenus (M€)<br />&nbsp;",
    description: null,
    integrationURL: "/european-projects/components/pages/analysis/overview/charts/projects-types-1",
  };
  const configChart1b = {
    id: "pillarsSubsidiesRequestedByProjectsRates",
    title: "",
    subtitle: "Part des financements demandés et obtenus sur HE",
    description: null,
    integrationURL: "/european-projects/components/pages/analysis/overview/charts/projects-types-1",
  };
  const configChart2a = {
    id: "pillarsProjectCoordinationRequestedByProjects",
    title: "",
    subtitle: "Nombre de candidats et de participants",
    description: null,
    integrationURL:
      "/european-projects/components/pages/analysis/overview/charts/projects-types-1",
  };
  const configChart2b = {
    id: "pillarsProjectCoordinationRequestedByProjectsRates",
    title: "",
    subtitle: "Poids des candidats et participants sur HE",
    description: null,
    integrationURL:
      "/european-projects/components/pages/analysis/overview/charts/projects-types-1",
  };

  export default function PillarsSubsidiesRequestedByProjects({
    indicateurId,
  }) {
    const [searchParams] = useSearchParams();
    const params = getDefaultParams(searchParams);

    const { data, isLoading } = useQuery({
      queryKey: [indicateurId, params],
      queryFn: () => GetData(params),
    });

    if (isLoading || !data) return <DefaultSkeleton col={2} />;

    let options, optionsRates;
    let renderDataValues, renderDataRates;
    switch (indicateurId) {
      case "pillarsSubsidiesRequestedByProjects":
        options = optionsSubsidiesValues(data);
        optionsRates = optionsSubsidiesRates(data);
        renderDataValues = RenderDataSubsidiesValues;
        renderDataRates = RenderDataSubsidiesRates;
        break;

      case "pillarsProjectCoordinationRequestedByProjects":
        options = optionsCoordinationNumber(data);
        optionsRates = OptionsCoordinationNumberRates(data);
        renderDataValues = RenderDataCoordinationNumberValues;
        renderDataRates = RenderDataCoordinationNumberRates;
        break;

      // case "pillarsApplicantsAndParticipantsRequestedByProjects":
      //   options = optionsSubsidiesValues(data);
      //   optionsRates = optionsSubsidiesRates(data);
      //   break;

      default:
        break;
    }

    const legend = GetLegend(
      [
        ["Projets lauréats", "#233E41"],
        ["Projets évalués", "#009099"],
      ],
      "PillarsSubsidiesRequestedByProjects",
    );

    return (
      <Container fluid>
        {indicateurId === "pillarsSubsidiesRequestedByProjects" && (
          <Row>
            <Col md={6}>
              <ChartWrapper config={configChart1a} legend={legend} options={options} renderData={renderDataValues} />
            </Col>
            <Col>
              <ChartWrapper config={configChart1b} options={optionsRates} renderData={renderDataRates} />
            </Col>
          </Row>
        )}
        {indicateurId === "pillarsProjectCoordinationRequestedByProjects" && (
          <Row>
            <Col md={6}>
              <ChartWrapper config={configChart2a} legend={legend} options={options} renderData={renderDataValues} />
            </Col>
            <Col>
              <ChartWrapper config={configChart2b} options={optionsRates} renderData={renderDataRates} />
            </Col>
          </Row>
        )}
      </Container>
    );
  }
