import { Container, Row, Col, Title } from "@dataesr/dsfr-plus";
import Breadcrumb from "../../components/breadcrumb";
import { definitions } from "./definitions";



export default function DefinitionsPage() {
    return (
        <main role="main">
            <Container fluid className="fm-etablissement-selector__wrapper">
                <Container as="section">
                    <Row>
                        <Col>
                            <Breadcrumb
                                items={[
                                    { label: "Accueil", href: "/personnel-enseignant/accueil" },
                                    { label: "Définitions" },
                                ]}
                            />
                        </Col>
                    </Row>
                    <Row>
                        <Col>
                            <Title as="h1" look="h3">
                                Définitions
                            </Title>
                            <p className="fr-text--lead fr-mb-4w">
                                Retrouvez les définitions des termes clés utilisés dans le
                                tableau de bord du personnel enseignant de l'enseignement
                                supérieur.
                            </p>
                        </Col>
                    </Row>
                </Container>
            </Container>
            <Container className="fr-my-6w">
                <Row gutters>
                    {definitions.map(({ title, definition }) => (
                        <Col xs="12" md="6" key={title}>
                            <div className="fr-card fr-card--no-arrow fr-p-3w fr-mb-2w">
                                <Title as="h2" look="h5" className="fr-mb-1w">
                                    {title}
                                </Title>
                                <p className="fr-text--sm fr-mb-0">{definition}</p>
                            </div>
                        </Col>
                    ))}
                </Row>
            </Container>
        </main>
    );
}
