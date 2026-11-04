import { Col, Container, Row, Title } from "@dataesr/dsfr-plus";
import Breadcrumb from "../../../../components/breadcrumb";
import navigationConfig from "../../navigation-config.json";

export default function Overview() {
  return (
    <Container>
      <Breadcrumb config={navigationConfig} />
      <Title as="h1">Overview Page</Title>
      <Row gutters>
        <Col>
          <div id="id1">Content for Menu1 section</div>
        </Col>
      </Row>
      <Row gutters>
        <Col>
          <div id="id2">Content for Menu2 section</div>
        </Col>
      </Row>
    </Container>
  );
}
