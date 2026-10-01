import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import Cookies from "js-cookie";

import { GetData } from "./query";
import optionsValues from "./options-values";
import optionsRates from "./options-rates";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import { getDefaultParams } from "./utils";
import { Container, Row, Col } from "@dataesr/dsfr-plus";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";

import i18n from "../../../../i18n-global.json";

const configChart1 = {
  id: "typeOfFinancingSubsidiesRequested",
  title: "",
  subtitle: "Financements demandés et obtenus (M€)<br />&nbsp;",
  description: null,
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/projects-types-1",
};
const configChart2 = {
  id: "typeOfFinancingSubsidiesRequestedRates",
  title: "",
  subtitle: "Part des financements demandés et obtenus sur HE",
  description: null,
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/projects-types-1",
};

export default function TypeOfFinancingSubsidiesRequestedLines() {
  const [searchParams] = useSearchParams();
  const params = getDefaultParams(searchParams);
  const currentLang = searchParams.get("language") || "fr";
  const country_code = searchParams.get("country_code") || "FRA";

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

  function getI18nLabel(key) {
    return i18n[key][currentLang];
  }

  interface Action {
    id: string;
    name: string;
  }

  const actions: Action[] = Array.from(
    new Set(data.find((item) => item.country === country_code).data.map((item) => item.action_id.toLowerCase()))
  ).map((id) => ({
    id: id as string,
    name: data.find((item) => item.country === country_code).data.find((item) => item.action_id.toLowerCase() === id).action_name,
  }));

  return (
    <Container fluid>
      <Row gutters>
        <Col md={6}>
          <ChartWrapper
            config={configChart1}
            options={optionsValues(data)}
            renderData={() => null} // TODO: add data table
          />
        </Col>
        <Col>
          <ChartWrapper
            config={configChart2}
            options={optionsRates(data)}
            renderData={() => null} // TODO: add data table
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <fieldset className="legend">
            <legend>{getI18nLabel("legend")}</legend>
            <ul>
              {actions.map((action) => (
                <li key={action.id}>
                  <div style={{ background: `var(--project-type-${action.id}-color)` }} />
                  <span>{`${action.name} (${action.id.toLocaleUpperCase()})`}</span>
                </li>
              ))}
            </ul>
          </fieldset>
        </Col>
      </Row>
    </Container>
  );
}
