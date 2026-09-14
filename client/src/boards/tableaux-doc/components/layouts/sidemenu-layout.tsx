import { Col, Container, Row } from "@dataesr/dsfr-plus";
import { Outlet } from "react-router-dom";
import CustomSideMenu from "../sidemenu";

export default function SidemenuLayout() {
  return (
    <Container>
      <Row>
        <Col xs={12} md={3}>
          <CustomSideMenu />
        </Col>
        <Col xs={12} md={9} style={{ paddingLeft: "2rem" }}>
          <Outlet />
        </Col>
      </Row>
    </Container>
  );
}
