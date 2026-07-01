import { Col, Container, Row, Title } from "@dataesr/dsfr-plus";

import Callout from "../../../../components/callout.tsx";
import OutcomesDefinitionsTable from "../../components/definitions-table/index.tsx";
import { OUTCOMES_DEFINITIONS } from "../../components/definitions-table/data.tsx";
import { useOutcomesPlusHautDiplome } from "../../api";

import "../croisements/styles.scss";
import ProfilesTab from "./profiles/index.tsx";

const COHORT_YEAR = "2019-2020";
const COHORT_SITUATION = "L1";

export default function ComparaisonProfilsPage() {
    const { data: baseData, isLoading: baseLoading } = useOutcomesPlusHautDiplome({
        cohorteAnnee: COHORT_YEAR,
        cohorteSituation: COHORT_SITUATION,
        filters: {},
    });

    return (
        <Container className="outcomes-section-page outcomes-croisements">
            <Row gutters>
                <Col>
                    <Title as="h1" look="h4" className="fr-mb-1w">
                        Comparer les trajectoires de plusieurs profils
                    </Title>
                </Col>
            </Row>
            <ProfilesTab
                axisOptions={baseData?.filterOptions ?? null}
                isLoadingOptions={baseLoading}
                cohortTotal={baseData?.totalStudents ?? 0}
            />
            <OutcomesDefinitionsTable definitions={OUTCOMES_DEFINITIONS} />
        </Container>
    );
}
