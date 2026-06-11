import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Badge, Container, Row, Col, Text, Title } from "@dataesr/dsfr-plus";

import ListSkeleton from "../../boards/atlas/charts/skeletons/list.tsx";
import { getNumberOfStudents } from "../../api/atlas.ts";
import { DEFAULT_CURRENT_YEAR } from "../../constants.tsx";

export default function FilieresList() {
  const [searchParams] = useSearchParams();
  const params = [...searchParams].map(([key, value]) => `${key}=${value}`).join("&");
  const currentYear = searchParams.get("annee_universitaire") || DEFAULT_CURRENT_YEAR;

  const { data, isLoading } = useQuery({
    queryKey: ["atlas/number-of-students", params],
    queryFn: () => getNumberOfStudents(params),
  });

  if (isLoading || !data || !data.filieres.length) {
    return <ListSkeleton />;
  }

  const maxValue: number = Math.max(...data.filieres.map((el) => (el.effectif_PU || 0) + (el.effectif_PR || 0)));

  return (
    <Container fluid className="fr-my-1w">
      <Title as="h2" look="h5" className="fr-mb-0 fr-mb-3w">
        <span className="fr-icon-list-unordered fr-mr-1w" aria-hidden="true" />
        Liste des filières représentées sur le territoire
        <Badge color="blue-ecume" size="sm">
          {data?.filieres.length}
        </Badge>
      </Title>

      <Row gutters>
        <Col>
          <ul>
            {data?.filieres.map((filiere) => {
              if ((filiere.effectif_PR || 0) + (filiere.effectif_PU || 0) !== 0) {
                const size = (((filiere.effectif_PR || 0) + (filiere.effectif_PU || 0)) * 100) / maxValue;

                return (
                  <li style={{ listStyle: "none" }} key={filiere.id}>
                    <Title as="h3" look="h6" className="fr-mb-0">
                      {filiere.label}
                      <Link to={`/atlas/effectifs-par-filiere/${filiere.id}?${params}`} className="fr-link fr-ml-1w">
                        Détails
                      </Link>
                    </Title>
                    <Text as="p" className="fr-mb-1w">
                      Effectifs étudiants{" "}
                      <Badge color="yellow-tournesol" size="sm">
                        {currentYear}
                      </Badge>{" "}
                      : <strong>{((filiere.effectif_PR || 0) + (filiere.effectif_PU || 0)).toLocaleString("fr-FR")}</strong>
                    </Text>
                    <div
                      className="fr-mb-1w"
                      style={{
                        width: `${size}%`,
                        height: "7px",
                        backgroundColor: "#000091",
                      }}
                    />
                  </li>
                );
              }
              return null;
            })}
          </ul>
        </Col>
      </Row>
    </Container>
  );
}
