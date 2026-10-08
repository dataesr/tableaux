import { useState } from "react";
import { Col, Container, Row } from "@dataesr/dsfr-plus";

import FundingCombined from "../charts/fundings-combined";
import PillarsFundingProportion from "../charts/pillars-funding-proportion";
import { getI18nLabel } from "../../../../../utils";

import i18nGlobal from "../../../i18n-global.json";

export default function PillarsFunding() {
  const [displayType, setDisplayType] = useState("total_fund_eur");

  return (
    <Container fluid className="chart-container chart-container--default">
      <Row className="fr-my-1w">
        <Col className="fr-px-1w">
          <select className="fr-select" onChange={(e) => setDisplayType(e.target.value)}>
            <option value="total_fund_eur">{getI18nLabel(i18nGlobal, "total-fund-eur")}</option>
            <option value="total_coordination_number">{getI18nLabel(i18nGlobal, "total-coordination-number")}</option>
            <option value="total_number_involved">{getI18nLabel(i18nGlobal, "total-number-involved")}</option>
          </select>
        </Col>
      </Row>
      <Row>
        <Col xs={12} md={12}>
          <FundingCombined displayType={displayType} />
        </Col>
      </Row>

      <Row className="fr-mt-1w">
        <Col>
          <PillarsFundingProportion displayType={displayType} />
        </Col>
      </Row>
    </Container>
  );
}
