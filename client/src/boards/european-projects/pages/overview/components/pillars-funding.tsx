import { Col, Container, Row } from "@dataesr/dsfr-plus";
import FundingValues from "../charts/funding";
import FundingSuccessRates from "../charts/funding-success-rates";
import PillarsFundingProportion from "../charts/pillars-funding-proportion";
import ChartFooter from "../../../../../components/chart-footer";
import { EPChartsSources } from "../../../config";

export default function PillarsFunding() {
  return (
    <Container fluid>
      <Row className="chart-container chart-container--default">
        <Col md={8}>
          <FundingValues />
        </Col>
        <Col md={4}>
          <FundingSuccessRates />
        </Col>
        <Col md={12} className="chart-footer">
          <ChartFooter
            comment={{
              fr: <>Ce graphique affiche la répartition des subventions demandées et obtenues (en M€) par pilier, ainsi que le taux de succès associé (montants obtenus / montants demandés).</>,
              en: <>This chart displays the distribution of requested and obtained funding (in M€) by pillar, as well as the associated success rate (amounts obtained / amounts requested).</>,
            }}
            readingKey={{
              fr: <>Pour le pilier "Excellence Scientifique", les projets ont demandé 5 835 M€ de subventions, et en ont obtenu 1 154.3 M€, soit un taux de succès de 19.8 %.</>,
              en: <>For the "Scientific Excellence" pillar, projects requested 5,835 M€ in funding and obtained 1,154.3 M€, representing a success rate of 19.8%.</>,
            }}
            sources={EPChartsSources}
          />
        </Col>
      </Row>

      <Row className="fr-mt-1w chart-container chart-container--default">
        <Col>
          <PillarsFundingProportion />
        </Col>
      </Row>
    </Container>
  );
}
