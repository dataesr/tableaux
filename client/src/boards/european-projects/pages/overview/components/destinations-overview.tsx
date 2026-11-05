import { useQuery } from "@tanstack/react-query";

import { Container, Row, Col } from "@dataesr/dsfr-plus";
import { formatToMillions } from "../../../../../utils/format";
import { getData } from "../charts/destination-funding/query";
import { useGetParams } from "../charts/destination-funding/utils";
import EvaluatedCard from "../../../components/cards/funds-cards/evaluated";
import SuccessfulCard from "../../../components/cards/funds-cards/succesful";
import SuccessRateCard from "../../../components/cards/funds-cards/success-rate";

export default function DestinationsOverview() {
  const params = useGetParams();
  const { data, isLoading } = useQuery({
    queryKey: ["destinationsFunding", params],
    queryFn: () => getData(params.params),
  });

  const evaluatedItem = data?.data.find((item) => item.stage === "evaluated") || {};
  const successfulItem = data?.data.find((item) => item.stage === "successful") || {};
  const fundsEvaluated = evaluatedItem.total_fund_eur || 0;
  const fundsSuccessful = successfulItem.total_fund_eur || 0;
  const successRate = fundsEvaluated > 0 ? fundsSuccessful / fundsEvaluated : 0;

  return (
    <Container fluid>
      <Row gutters>
        <Col xs={12} md={4}>
          <EvaluatedCard fund={formatToMillions(fundsEvaluated)} loading={isLoading} nb={evaluatedItem.count || 0} />
        </Col>
        <Col xs={12} md={4}>
          <SuccessfulCard fund={formatToMillions(fundsSuccessful)} loading={isLoading} nb={successfulItem.count || 0} />
        </Col>
        <Col xs={12} md={4}>
          <SuccessRateCard loading={isLoading} nb={successRate} />
        </Col>
      </Row>
    </Container>
  );
}
