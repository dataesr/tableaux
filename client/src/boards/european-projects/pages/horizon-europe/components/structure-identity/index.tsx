import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Container, Row, Col, Title, Badge, Text, Link } from "@dataesr/dsfr-plus";

const { VITE_APP_SERVER_URL } = import.meta.env;

async function GetData(structureId: string) {
  const baseUrl = `${VITE_APP_SERVER_URL}/european-projects/get-structure-from-paysage`;
  return fetch(`${baseUrl}?structureId=${structureId}`).then((response) => response.json());
}

export default function StructureIdentity() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "en";
  const structureId = searchParams.get("structureid");

  const { data, isLoading } = useQuery({
    queryKey: ["getStructureFromPaysage", structureId],
    queryFn: () => GetData(structureId as string),
  });
  
  if (!structureId) {
    return null;
  }

  if (isLoading || !data) {
    return (
      <Container fluid>
        <Row>
          <Col>{currentLang === "fr" ? "Chargement des informations de la structure..." : "Loading structure information..."}</Col>
        </Row>
      </Container>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <Container fluid>
      <Row>
        <Col md={8} xs={12}>
          <Title className="fr-mb-0">{data.names[0].usualName}</Title>
          <Text size="sm" className="fr-hint-text">
            {data.names[0].nameEn}
          </Text>
          <Badge className="fr-mr-2w">{structureId}</Badge>
        </Col>
        <Col md={4} xs={12}>
          <div>
            {data.localisations[0].address}
            <br />
            {data.localisations[0].locality}, {data.localisations[0].postalCode}
            <br />
            {data.localisations[0].country}
            <br />
            <Link href={data.websites[0].url} target="_blank" rel="noopener noreferrer">
              site web
            </Link>
          </div>
        </Col>
      </Row>
      <hr className="fr-mt-1w" />
    </Container>
  );
}
