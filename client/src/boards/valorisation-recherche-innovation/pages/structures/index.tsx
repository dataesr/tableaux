import { Col, Container, Row, Text, Title } from "@dataesr/dsfr-plus";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import CardSimple from "./components/card-simple";
import Breadcrumb from "../../components/breadcrumb";
import StructureSelector from "./components/structure-selector";
import DisplayStructure from "./displayStructure";

import "./styles.scss";


export default function Structures() {
  const [searchParams, setSearchParams] = useSearchParams();
  const structure = searchParams.get("structureId");
  const [structures, setStructures] = useState([]);

  useEffect(() => {
    if (!searchParams.get("section")) {
      searchParams.set("section", "startups");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const handleStructure = (structure) => {
    searchParams.set("structureId", structure);
    setSearchParams(searchParams);
  };

  return (
    structure ? (
          <DisplayStructure />
    ) : (
      <>
        <Container fluid className="funding-gradient fr-mb-3w">
          <Container as="section">
            <Row gutters>
              <Col>
                <Breadcrumb items={[
                  { href: "/valorisation-recherche-innovation/accueil", label: "Valorisation de la recherche - innovation" },
                  { label: "Vue par établissement" },
                ]} />
              </Col>
            </Row>
            <Row gutters>
              <Col>
                <Title as="h1" look="h4">
                  Rechercher un établissement
                </Title>
              </Col>
            </Row>
            <Row gutters>
              <Col>
                <StructureSelector setStructures={setStructures} />
              </Col>
            </Row>
          </Container>
        </Container>
        <Container className="fr-mb-3w">
          <Row gutters>
            <Text className="fr-text--sm fr-mb-2w fr-pl-2w">
              {structures.length} établissement
              {structures.length > 1 ? "s" : ""} trouvé
              {structures.length > 1 ? "s" : ""}
            </Text>
          </Row>
          <Row gutters>
            {structures.map((structure: any) => (
              <Col key={structure.value} xs="12" md="6" lg="4">
                <CardSimple
                  description={structure.region}
                  onClick={() => handleStructure(structure.id)}
                  subtitle={structure.typologie_1}
                  title={structure.label}
                />
              </Col>
            ))}
          </Row>
        </Container>
      </>
    )
  )
};
