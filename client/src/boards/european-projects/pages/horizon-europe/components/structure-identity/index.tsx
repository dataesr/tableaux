import { useSearchParams } from "react-router-dom";
import { Container, Row, Col } from "@dataesr/dsfr-plus";

export default function StructureIdentity() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "en";
  const structureId = searchParams.get("structureid");

  if (!structureId) {
    return null;
  }

  return (
    <Container fluid>
      <Row>
        <Col>
          {currentLang === "fr" ? "id de la structure : " : "structure id: "}
          {structureId}
        </Col>
      </Row>
    </Container>
  );
}
