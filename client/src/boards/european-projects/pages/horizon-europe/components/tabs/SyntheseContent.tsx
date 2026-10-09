import { useSearchParams } from "react-router-dom";
import { Container, Row, Col } from "@dataesr/dsfr-plus";

import BoardsSuggestComponent from "../../../../../../components/boards-suggest-component";
import DestinationsOverview from "../../../overview/components/destinations-overview";
import PillarsOverview from "../../../overview/components/pillars-overview";
import ProgramsOverview from "../../../overview/components/programs-overview";
import SynthesisFocus from "../../../overview/charts/synthesis-focus";
import ThematicsOverview from "../../../overview/components/destinations-overview";


import { getI18nLabel } from "../../../../../../utils";

const i18n = {
  "no-content": { fr: "Aucun contenu disponible", en: "No content available" },
};

export default function SyntheseContent() {
  const [searchParams] = useSearchParams();

  const pillarId = searchParams.get("pillarId");
  const programId = searchParams.get("programId");
  const thematicIds = searchParams.get("thematicIds");
  const destinationIds = searchParams.get("destinationIds");
  const currentLang = searchParams.get("language") || "fr";

  let contentType = "pillar-comparison";
  if (pillarId && programId && thematicIds && destinationIds) {
    contentType = "destination-detail";
  } else if (pillarId && programId && thematicIds) {
    contentType = "thematic-detail";
  } else if (pillarId && programId) {
    contentType = "program-detail";
  } else if (pillarId) {
    contentType = "pillar-detail";
  }

  switch (contentType) {
    case "pillar-comparison":

    case "pillar-detail":
      return (
        <Container fluid className="fr-pb-3w" as="section">
          <Row>
            <Col>
              <SynthesisFocus />
            </Col>
          </Row>
          <Row className="fr-mb-3w">
            <Col>
              <PillarsOverview />
            </Col>
          </Row>
          <BoardsSuggestComponent />
        </Container>
      );

    case "program-detail":
      return (
        <Container fluid className="fr-pb-3w" as="section">
          <Row>
            <Col>
              <SynthesisFocus />
            </Col>
          </Row>
          <Row className="fr-mb-3w">
            <Col>
              <ProgramsOverview />
            </Col>
          </Row>
          <BoardsSuggestComponent />
        </Container>
      );

    case "thematic-detail":
      return (
        <Container fluid className="fr-pb-3w" as="section">
          <Row>
            <Col>
              <SynthesisFocus />
            </Col>
          </Row>
          <Row className="fr-mb-3w">
            <Col>
              <ThematicsOverview />
            </Col>
          </Row>
          <BoardsSuggestComponent />
        </Container>
      );

    case "destination-detail":
      return (
        <Container fluid className="fr-pb-3w" as="section">
          <Row>
            <Col>
              <SynthesisFocus />
            </Col>
          </Row>
          <DestinationsOverview />
          <BoardsSuggestComponent />
        </Container>
      );

    default:
      return <div>{getI18nLabel(i18n, "no-content", currentLang)}</div>;
  }
}
