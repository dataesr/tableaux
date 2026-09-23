import { Container, Row, Col, Title } from "@dataesr/dsfr-plus";
import Definitions from "./component/definitions-display";
import { useFinanceDefinitions } from "../../api";
import Breadcrumb from "../../../../components/breadcrumb";
import navigationConfig from "../../components/layouts/navigation-config.json";


export default function DefinitionsView() {
  const { data, isLoading, error } = useFinanceDefinitions();

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
              <Title as="h1" look="h3">Définitions des indicateurs</Title>
              <p className="fr-text--lead fr-mb-4w">
                Retrouvez les définitions détaillées de tous les indicateurs
                financiers utilisés dans les tableaux de bord.
              </p>
            </Col>
          </Row>
        </Container>
      </Container>
      <Container>
        <Row className="fr-my-6w">
          <Col>
            <Definitions data={data || []} />
          </Col>
        </Row>
      </Container>
    </main>
  );
}
