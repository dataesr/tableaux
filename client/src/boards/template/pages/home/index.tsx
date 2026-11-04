import { Container, Row, Col, Title } from "@dataesr/dsfr-plus";
import navigationConfig from "../../navigation-config.json"
import Breadcrumb from "../../../../components/breadcrumb";

export default function Home() {
  return (
    <Container>
      <Breadcrumb config={navigationConfig} />
      <Row>
        <Col>
          <Title as="h1">Template Home Page</Title>
        </Col>
      </Row>
    </Container>
  );
}
