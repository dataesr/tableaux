import { useQuery } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";
import { Badge, Container, Text, Title } from "@dataesr/dsfr-plus";

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

  const sortedFilieres = [...data.filieres].sort((a, b) => (b.effectif_PR || 0) + (b.effectif_PU || 0) - ((a.effectif_PR || 0) + (a.effectif_PU || 0)));

  return (
    <Container fluid className="fr-my-1w">
      <Title as="h2" look="h5" className="fr-mb-0 fr-mb-3w">
        <span className="fr-icon-list-unordered fr-mr-1w" aria-hidden="true" />
        Liste des filières représentées sur le territoire
        <Badge color="blue-ecume" size="sm">
          {data?.filieres.length}
        </Badge>
      </Title>

      <ul className="fr-grid-row fr-grid-row--gutters" style={{ listStyle: "none" }}>
        {sortedFilieres
          .filter((filiere) => (filiere.effectif_PR || 0) + (filiere.effectif_PU || 0) !== 0)
          .map((filiere) => {
            const effectifPublic = filiere.effectif_PU || 0;
            const effectifPrive = filiere.effectif_PR || 0;
            const effectifTotal = effectifPublic + effectifPrive;

            return (
              <li key={filiere.id} className="fr-col-12 fr-col-md-6 fr-col-lg-4">
                <div className="fr-card fr-card--grey fr-enlarge-link">
                  <div className="fr-card__body">
                    <div className="fr-card__content">
                      <div className="fr-card__start">
                        <Badge color="yellow-tournesol" size="sm">
                          {currentYear}
                        </Badge>
                      </div>
                      <Title as="h3" look="h6" className="fr-card__title">
                        <Link to={`/atlas/effectifs-par-filiere/${filiere.id}?${params}`} className="fr-card__link">
                          {filiere.label}
                        </Link>
                      </Title>
                      <Text as="p" className="fr-card__desc">
                        Effectif total : <strong>{effectifTotal.toLocaleString("fr-FR")}</strong>
                      </Text>
                      <Text as="p" className="fr-card__desc">
                        Secteur public : <strong>{effectifPublic.toLocaleString("fr-FR")}</strong>
                      </Text>
                      <Text as="p" className="fr-card__desc">
                        Secteur privé : <strong>{effectifPrive.toLocaleString("fr-FR")}</strong>
                      </Text>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
      </ul>
    </Container>
  );
}
