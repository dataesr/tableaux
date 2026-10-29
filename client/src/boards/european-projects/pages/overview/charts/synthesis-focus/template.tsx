import { Col, Container, Row } from "@dataesr/dsfr-plus";

import './styles.scss';

export default function Template() {
  return (
    <Container as="section" fluid className="synthesis-focus-template">
      <div className="fake-title" />
      <Row gutters>
        <Col md={4}>
          <div className="fake-tile" />
        </Col>
        <Col md={4}>
          <div className="fake-tile" />
        </Col>
        <Col md={4}>
          <div className="fake-tile" />
        </Col>
        <Col md={4}>
          <div className="fake-tile" />
        </Col>
        <Col md={4}>
          <div className="fake-tile" />
        </Col>
        <Col md={4}>
          <div className="fake-tile" />
        </Col>
      </Row>
    </Container>
  );
}