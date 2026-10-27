import { Col, Container, Row, Title } from "@dataesr/dsfr-plus";

import { Layout } from "../../layout/layout";

export default function NotFoundPage() {
  return (
    <Layout exploreLink>
      <Container style={{ minHeight: "calc(60vh - 200px)" }}>
        <Row>
          <Col className="fr-my-12w text-center">
            <Title as="h1">404 - Page Not Found</Title>
          </Col>
        </Row>
      </Container>
    </Layout>
  );
}
