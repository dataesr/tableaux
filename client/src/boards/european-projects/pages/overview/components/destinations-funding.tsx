import { Col, Row } from "@dataesr/dsfr-plus";
import DestinationFundingValues from "../charts/destination-funding";
import DestinationFundingSuccessRates from "../charts/destination-funding-success-rates";
import DestinationFundingProportion from "../charts/destination-funding-proportion";
import ChartFooter from "../../../../../components/chart-footer";
import { EPChartsSources } from "../../../config";

export default function DestinationsFunding() {
  return (
    <>
      <Row className="chart-container chart-container--default">
        <Col md={6}>
          <DestinationFundingValues />
        </Col>
        <Col md={6}>
          <DestinationFundingSuccessRates />
        </Col>
        <Col md={12} className="chart-footer">
          <ChartFooter
            comment={{
              fr: <>Ce graphique affiche la répartition des subventions demandées et obtenues (en M€) par destination, ainsi que le taux de succès associé (montants obtenus / montants demandés).</>,
              en: <>This chart displays the distribution of requested and obtained funding (in M€) by destination, as well as the associated success rate (amounts obtained / amounts requested).</>,
            }}
            readingKey={{
              fr: <>Pour la thématique "Excellence Scientifique", les projets ont demandé X M€ de subventions, et en ont obtenu Y M€, soit un taux de succès de Z %.</>,
              en: <>For the "Scientific Excellence" topic, projects requested X M€ in funding and obtained Y M€, representing a success rate of Z%.</>,
            }}
            sources={EPChartsSources}
          />
        </Col>
      </Row>
      <Row className="fr-mt-1w chart-container chart-container--default">
        <Col>
          <DestinationFundingProportion />
        </Col>
      </Row>
    </>
  );
}
