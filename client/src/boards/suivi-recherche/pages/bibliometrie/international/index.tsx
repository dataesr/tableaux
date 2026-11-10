import { Title } from "@dataesr/dsfr-plus";

import ComparaisonInternationale from "../charts/comparaison-internationale/index.tsx";
import SpecialisationPays from "../charts/specialisation/index.tsx";
import { useBibliometrie } from "../context.ts";

// « Comment se situe la France parmi les pays ? » : la sélection d'établissement ne s'applique pas
export default function InternationalPage() {
  const { disciplines, meta, options, selection } = useBibliometrie();

  return (
    <section>
      <Title as="h2" look="h4">Comparaison internationale</Title>
      <ComparaisonInternationale disciplines={disciplines} meta={meta} options={options} selection={selection} />

      <Title as="h2" className="fr-mt-6w" look="h4">Spécialisation disciplinaire</Title>
      <p className="fr-mb-3w">
        Dans quelles disciplines chaque pays publie-t-il relativement plus, ou moins, que le monde ?
      </p>
      <SpecialisationPays meta={meta} options={options} selection={selection} />
    </section>
  );
}
