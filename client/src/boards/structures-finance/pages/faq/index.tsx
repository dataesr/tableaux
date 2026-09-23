import { Container, Row, Col } from "@dataesr/dsfr-plus";
import { useSearchParams } from "react-router-dom";
import FAQ from "./component/faq-display";
import { useFinanceFAQ } from "./api";
import navigationConfig from "../../components/layouts/navigation-config.json";
import Breadcrumb from "../../../../components/breadcrumb";

export default function FAQView() {
  const [searchParams] = useSearchParams();
  const language = searchParams.get("language") || "fr";
  const { data, isLoading, error } = useFinanceFAQ(language);

  if (isLoading) {
    return (
      <Container className="fr-my-6w">
        <Row>
          <Col>
            <p className="fr-text--center">Chargement...</p>
          </Col>
        </Row>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="fr-my-6w">
        <Row>
          <Col>
            <div className="fr-alert fr-alert--error">
              <p className="fr-alert__title">Erreur</p>
              <p>
                {error instanceof Error
                  ? error.message
                  : "Une erreur est survenue"}
              </p>
            </div>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <main role="main">
      <Container fluid className="etablissement-selector__wrapper">
        <Container as="section">
          <Row>
            <Col>
              <Breadcrumb config={navigationConfig} />
            </Col>
          </Row>
          <Row>
            <Col>
              <h1 className="fr-h3">Foire aux questions</h1>
              <p className="fr-text--lead fr-mb-4w">
                Retrouvez les réponses aux questions les plus fréquentes sur les
                données financières des établissements d'enseignement supérieur.
              </p>
            </Col>
          </Row>
        </Container>
      </Container>
      <Container>
        <Row className="fr-my-6w">
          <Col>
            <FAQ data={data || []} />
          </Col>
        </Row>
      </Container>
    </main>
  );
}
