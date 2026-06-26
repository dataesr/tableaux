import { Container, Row, Col, Title, Text } from "@dataesr/dsfr-plus";

import Callout from "../../../../components/callout";
import SearchEntities from "./components/search";
import { getI18nLabel } from "../../../../utils";

import i18n from "./i18n";

export default function Entities() {
  return (
    <Container as="section" className="fr-my-2w">
      <Row>
        <Col>
          <Title as="h2">{getI18nLabel(i18n, "title")}</Title>
          <Text>
            <i>{getI18nLabel(i18n, "hint")}</i>
          </Text>
        </Col>
      </Row>
      <Row>
        <Col>
          <Callout className="callout-style">{getI18nLabel(i18n, "description")}</Callout>
        </Col>
      </Row>
      <Row>
        <Col>
          <SearchEntities />
        </Col>
      </Row>
    </Container>
  );
}
