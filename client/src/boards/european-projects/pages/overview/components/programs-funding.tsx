import { useQuery } from "@tanstack/react-query";
import { Col, Row } from "@dataesr/dsfr-plus";

import FundingValues from "../charts/funding";
import FundingSuccessRates from "../charts/funding-success-rates";
import ProgramsFundingProportion from "../charts/programs-funding-proportion";
import ChartFooter from "../../../../../components/chart-footer";
import { EPChartsSources } from "../../../config";
import { readingKey, useGetParams } from "../charts/programs-funding/utils";
import { getData } from "../charts/programs-funding/query";

export default function ProgramsFunding() {
  const { params } = useGetParams();
  const { data, isLoading } = useQuery({
    queryKey: ["programsFunding", params],
    queryFn: () => getData(params),
  });

  return (
    <>
      <Row className="chart-container chart-container--default">
        <Col md={6}>
          <FundingValues />
        </Col>
        <Col md={6}>
          <FundingSuccessRates />
        </Col>
        <Col md={12} className="chart-footer">
          <ChartFooter
            comment={{
              fr: <>Ce graphique affiche la répartition des subventions demandées et obtenues (en M€) par pilier, ainsi que le taux de succès associé (montants obtenus / montants demandés).</>,
              en: <>This chart displays the distribution of requested and obtained funding (in M€) by pillar, as well as the associated success rate (amounts obtained / amounts requested).</>,
            }}
            readingKey={readingKey(data, isLoading)}
            sources={EPChartsSources}
          />
        </Col>
      </Row>
      <Row className="fr-mt-1w chart-container chart-container--default">
        <Col>
          <ProgramsFundingProportion />
        </Col>
      </Row>
    </>
  );
}
