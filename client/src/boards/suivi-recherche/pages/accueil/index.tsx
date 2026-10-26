import { Col, Container, Row, Title } from "@dataesr/dsfr-plus";
import { Link } from "react-router-dom";

export default function AccueilPage() {
  return (
    <Container className="fr-my-4w">
      <Title as="h1" look="h3">Suivi de la recherche française</Title>
      <p className="fr-text--lead">
        Indicateurs de suivi de la production scientifique française, comparée à la production mondiale.
      </p>
      <Row gutters>
        <Col xs="12" md="6" lg="4">
          <div className="fr-card fr-enlarge-link">
            <div className="fr-card__body">
              <div className="fr-card__content">
                <h2 className="fr-card__title">
                  <Link to="/suivi-recherche/bibliometrie">Bibliométrie</Link>
                </h2>
                <p className="fr-card__desc">
                  Poids, influence et prestige des publications d'un pays ou d'un établissement, par discipline et par période.
                </p>
              </div>
            </div>
          </div>
        </Col>
      </Row>
    </Container>
  );
}
