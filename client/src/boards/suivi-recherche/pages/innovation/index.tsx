import { Alert, Container, Title } from "@dataesr/dsfr-plus";

import DefaultSkeleton from "../../../../components/charts-skeletons/default.tsx";
import { useInnovationEntites, useInnovationMeta } from "../../api/innovation.ts";
import { useSelection } from "../../hooks/use-selection";
import StartupsEvolutionChart from "./charts/startups-evolution/index.tsx";

export default function InnovationPage() {
  const meta = useInnovationMeta();
  const entites = useInnovationEntites();
  const { selection } = useSelection(meta.data, entites.data);

  const isLoading = meta.isLoading || entites.isLoading;
  const isError = meta.isError || entites.isError;

  return (
    <Container className="fr-my-4w">
      <Title as="h1" look="h3">Innovation</Title>
      <p className="fr-text--lead fr-mb-2w">
        Créations annuelles de start-ups liées à l’enseignement supérieur et à la recherche.
      </p>

      {isLoading && <DefaultSkeleton height="200px" label="Chargement des données" />}
      {isError && (
        <Alert
          description="Les données du pilote startups ne sont pas disponibles. Vérifiez que les collections Innovation sont publiées et activées pour ce tableau."
          title="Erreur de chargement"
          variant="error"
        />
      )}
      {!isLoading && !isError && meta.data && entites.data && selection && (
        <StartupsEvolutionChart entites={entites.data} meta={meta.data} selection={selection} />
      )}
    </Container>
  );
}
