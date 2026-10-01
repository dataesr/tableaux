import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import Cookies from "js-cookie";

import { GetData } from "./query";
import optionsSubventionsValues from "./options-subventions_values";
import optionsSubventionsRates from "./options-subventions_rates";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import { getDefaultParams } from "./utils";
import { Container, Row, Col } from "@dataesr/dsfr-plus";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";

const configChart1 = {
  id: "typeOfFinancingSubsidiesRequestedByProjects",
  title: "",
  subtitle: "Financements demandés et obtenus (M€)",
  description: null,
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/projects-types-1",
};

const configChart2 = {
  id: "typeOfFinancingSubsidiesRequestedByProjectsRates",
  title: "",
  subtitle: "Part des financements demandés et obtenus sur HE",
  description: null,
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/projects-types-1",
};

export default function TypeOfFinancingSubsidiesRequestedByProjects() {
  const [searchParams] = useSearchParams();
  const params = getDefaultParams(searchParams);

  const { data, isLoading } = useQuery({
    queryKey: [
      configChart1.id,
      params,
      Cookies.get("selectedPillars"),
      Cookies.get("selectedPrograms"),
      Cookies.get("selectedTopics"),
      Cookies.get("selectedDestinations"),
    ],
    queryFn: () => GetData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton col={2} />;

  return (
    <Container fluid>
      <Row gutters>
        <Col>
          <ChartWrapper
            config={configChart1}
            options={optionsSubventionsValues(data)}
            renderData={() => null} // TODO: add data table
          />
        </Col>
        <Col>
          <ChartWrapper
            config={configChart2}
            options={optionsSubventionsRates(data)}
            renderData={() => null} // TODO: add data table
          />
        </Col>
      </Row>
    </Container>
  );
}
