import { Col, Container, Row, Text, Title } from "@dataesr/dsfr-plus"
import { useQuery } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"

import Breadcrumb from "../../components/breadcrumb"
import CardSimple from "../../components/card-simple"
import { getEsQuery } from "../../utils.ts"
import DisplayRegion from "./displayRegion.tsx"

import "./styles.scss"

const { VITE_APP_ES_INDEX_PARTICIPATIONS, VITE_APP_SERVER_URL } = import.meta.env


export default function regions() {
  const [searchParams, setSearchParams] = useSearchParams()
  const region = searchParams.get("region")
  const [regions, setRegions] = useState([])

  useEffect(() => {
    if (searchParams.get("structureId")) {
      searchParams.delete("structureId")
    }
    if (!searchParams.get("section")) {
      searchParams.set("section", "apercu")
    }
    setSearchParams(searchParams)
  }, [searchParams, setSearchParams])

  const handleRegion = (region) => {
    searchParams.set("region", region)
    setSearchParams(searchParams)
  };

  const body: any = {
    ...getEsQuery({}),
    aggregations: {
      by_region: {
        terms: {
          field: "participant_region.keyword",
          size: 1500,
        },
      },
    },
  }
  body.query.bool.filter.push({ terms: { "participant_typologie_1.keyword": ["Ecoles, instituts et assimilés", "Organismes de recherche", "Structures de recherche", "Universités et assimilés"] } });

  const { data } = useQuery({
    queryKey: ["fundings-regions"],
    queryFn: () =>
      fetch(
        `${VITE_APP_SERVER_URL}/elasticsearch?index=${VITE_APP_ES_INDEX_PARTICIPATIONS}`,
        {
          body: JSON.stringify(body),
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Content-Type": "application/json",
          },
          method: "POST",
        }
      ).then((response) => response.json()),
  });

  useEffect(() => {
    setRegions(data?.aggregations?.by_region?.buckets ?? [])
  }, [data])

  useEffect(() => {
    if (!searchParams.get("section")) {
      searchParams.set("section", "apercu");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  return (
    region ? (
      <DisplayRegion />
    ) : (
      <main>
        <Container fluid className="funding-gradient fr-mb-3w">
          <Container as="section">
            <Row gutters>
              <Col>
                <Breadcrumb items={[
                  { href: "/financements-par-aap/accueil", label: "Financements par AAP" },
                  { label: "Vue par région" },
                ]} />
              </Col>
            </Row>
            <Row gutters>
              <Col>
                <Title as="h1" look="h4">
                  Rechercher une région
                </Title>
              </Col>
            </Row>
          </Container>
        </Container>
        <Container className="fr-mb-3w">
          <Row gutters>
            <Text className="fr-text--sm fr-mb-2w fr-pl-2w">
              {regions.length} région
              {regions.length > 1 ? "s" : ""} trouvée
              {regions.length > 1 ? "s" : ""}
            </Text>
          </Row>
          <Row gutters>
            {regions.map((region: any) => (
              <Col key={region.key} xs="12" md="6" lg="4">
                <CardSimple
                  description={`${region.doc_count} participations`}
                  onClick={() => handleRegion(region.key)}
                  title={region.key}
                />
              </Col>
            ))}
          </Row>
        </Container>
      </main>
    )
  )
};
