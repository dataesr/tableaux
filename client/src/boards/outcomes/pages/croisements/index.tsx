import { Col, Container, Row, Title } from "@dataesr/dsfr-plus";

import OutcomesDefinitionsTable from "../../components/definitions-table/index.tsx";
import { OUTCOMES_DEFINITIONS } from "../../components/definitions-table/data.tsx";

import "./styles.scss";
import HeatmapTab from "./heatmap";

export default function CroisementsPage() {
    return (
        <Container className="outcomes-section-page outcomes-flux-page outcomes-croisements">
            <Row gutters>
                <Col>
                    <Title as="h1" look="h4" className="fr-mb-1w">
                        Taux de diplômés selon deux critères croisés
                    </Title>
                </Col>
            </Row>

            <HeatmapTab />

            <OutcomesDefinitionsTable definitions={OUTCOMES_DEFINITIONS} />
        </Container>
    );
}
