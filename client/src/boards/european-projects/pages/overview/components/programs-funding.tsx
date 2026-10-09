import { useState } from "react";
import { Container, Col, Row } from "@dataesr/dsfr-plus";

import FundingCombined from "../charts/fundings-combined";
import ProgramsFundingProportion from "../charts/programs-funding-proportion";
import { getI18nLabel } from "../../../../../utils";

import i18nGlobal from "../../../i18n-global.json";

export default function ProgramsFunding() {
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
          <FundingCombined displayType={displayType} groupBy="program" />
        </Col>
      </Row>

      <Row className="fr-mt-1w">
        <Col>
          <ProgramsFundingProportion displayType={displayType} />
        </Col>
      </Row>
    </Container>
  );
}
