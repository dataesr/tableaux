import { Container, Col, Row } from "@dataesr/dsfr-plus";
import "./styles.scss";

export default function DefaultSkeleton({
  col = 1,
  height = "400px",
  label = "Chargement en cours",
}: {
  col?: number;
  height?: string;
  label?: string;
}) {
  return (
    <Container fluid>
      <span className="fr-sr-only">{label}</span>
      <Row gutters>
        {[...Array(col)].map((_, i) => (
          <Col key={i}>
            <div style={{ height }} className="default-skeleton" />
          </Col>
        ))}
      </Row>
    </Container>
  );
}
