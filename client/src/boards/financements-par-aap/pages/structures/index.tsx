import { Col, Container, Row, Text, Title } from "@dataesr/dsfr-plus"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

import Breadcrumb from "../../components/breadcrumb"
import CardSimple from "../../components/card-simple"
import StructureSelector from "./components/structure-selector"
import DisplayStructure from "./displayStructure"

import "./styles.scss"


export default function Structures() {
  const [searchParams, setSearchParams] = useSearchParams()
  const structure = searchParams.get("structureId")
  const [structures, setStructures] = useState([])

  useEffect(() => {
    if (searchParams.get("region")) {
      searchParams.delete("region")
    }
    if (!searchParams.get("section")) {
      searchParams.set("section", "apercu")
    }
    setSearchParams(searchParams)
  }, [searchParams, setSearchParams])

  return (
    structure ? (
      <DisplayStructure />
    ) : (
      <main>
        <Container fluid className="funding-gradient fr-mb-3w">
          <Container as="section">
            <Row gutters>
              <Col xs="12">
                <Breadcrumb items={[
                  { href: "/financements-par-aap/accueil", label: "Financements par AAP" },
                  { label: "Vue par établissement" },
                ]} />
              </Col>
            </Row>
            <Row gutters>
              <Col xs="12">
                <Title as="h1" look="h4">
                  Rechercher un établissement
                </Title>
              </Col>
            </Row>
            <Row gutters>
              <Col xs="12">
                <StructureSelector setStructures={setStructures} />
              </Col>
            </Row>
          </Container>
        </Container>
        <Container className="fr-mb-3w">
          <Row gutters>
            <Text className="fr-text--sm fr-mb-2w fr-pl-2w" role="status">
              {structures.length} établissement
              {structures.length > 1 ? "s" : ""} trouvé
              {structures.length > 1 ? "s" : ""}
            </Text>
          </Row>
          <Row gutters>
            {structures.map((structure: any) => (
              <Col key={structure.id} xs="12" md="6" lg="4">
                <CardSimple
                  description={structure.region}
                  subtitle={structure.typologie_1}
                  title={structure.label}
                  type="structureId"
                  value={structure.id}
                />
              </Col>
            ))}
          </Row>
        </Container>
      </main>
    )
  )
};
