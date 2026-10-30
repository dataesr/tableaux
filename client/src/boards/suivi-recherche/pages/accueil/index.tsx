import { Button, Col, Container, Row, Title } from "@dataesr/dsfr-plus";
import { Link } from "react-router-dom";

import "./styles.scss";

export default function AccueilPage() {
  return (
    <div className="sr-accueil">
      <section className="sr-accueil__hero">
        <Container>
          <Row gutters>
            <Col xs="12" lg="8">
              <p className="sr-accueil__eyebrow fr-mb-1w">Données et indicateurs scientifiques</p>
              <Title as="h1" look="h1" className="fr-mb-2w">
                Suivi de la recherche française
              </Title>
              <p className="fr-text--lead fr-mb-2w">
                Explorez la production scientifique française et son positionnement dans le monde,
                selon les disciplines et les périodes.
              </p>
              <Button as="a" href="/suivi-recherche/bibliometrie" icon="arrow-right-line">
                Explorer la bibliométrie
              </Button>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="sr-accueil__section" aria-labelledby="sr-accueil-explorer">
        <Container>
          <Title as="h2" look="h4" id="sr-accueil-explorer">
            Explorer les indicateurs
          </Title>
          <p className="fr-mb-3w">
            Consultez les résultats nationaux ou choisissez un établissement pour affiner l'analyse.
          </p>
          <Row gutters>
            <Col xs="12" md="6" lg="4">
              <div className="fr-card fr-enlarge-link">
                <div className="fr-card__body">
                  <div className="fr-card__content">
                    <h3 className="fr-card__title">
                      <Link to="/suivi-recherche/bibliometrie">Bibliométrie</Link>
                    </h3>
                    <p className="fr-card__desc">
                      Poids, influence et prestige des publications d'un pays ou d'un établissement,
                      par discipline et par période.
                    </p>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}
