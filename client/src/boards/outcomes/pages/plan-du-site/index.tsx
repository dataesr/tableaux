import { Col, Container, Row, Title } from "@dataesr/dsfr-plus";

const BASE = "/devenir-etudiants/entrants-en-L1-2019";

const PAGES = [
    { label: "Flux", href: `${BASE}/flux` },
    { label: "Répartition", href: `${BASE}/repartition` },
    { label: "Plus haut diplôme", href: `${BASE}/plus-haut-diplome` },
    { label: "Croisements", href: `${BASE}/croisements` },
    { label: "Comparaison de profils", href: `${BASE}/comparaison-profils` },
    { label: "Méthodologie", href: `${BASE}/methodologie` },
    { label: "Plan du site", href: `${BASE}/plan-du-site` },
];

export default function PlanDuSitePage() {
    return (
        <Container className="fr-py-4w">
            <Row>
                <Col>
                    <Title as="h1" look="h3">Plan du site</Title>
                    <p className="fr-text--lead">
                        Cette page présente l'architecture du tableau de bord « Parcours des
                        néo-bacheliers inscrits en L1 en 2019 ».
                    </p>
                    <nav aria-label="Plan du site">
                        <ul className="fr-raw-list">
                            <li>
                                <a title="Accueil" className="fr-link" href="/">Accueil dataSupR</a>
                            </li>
                            <li className="fr-mt-2w">
                                <strong>Parcours des néo-bacheliers inscrits en L1 en 2019</strong>
                                <ul className="fr-raw-list fr-mt-1w fr-pl-3w">
                                    {PAGES.map(({ label, href }) => (
                                        <li key={href} className="fr-mb-1w">
                                            <a title={label} className="fr-link" href={href}>{label}</a>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        </ul>
                    </nav>
                </Col>
            </Row>
        </Container>
    );
}
