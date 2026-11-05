import { Title } from "@dataesr/dsfr-plus";

import ComparaisonInternationale from "../charts/comparaison-internationale/index.tsx";
import { useBibliometrie } from "../context.ts";

// « Comment se situe la France parmi les pays ? » : la sélection d'établissement ne s'applique pas
export default function InternationalPage() {
  const { disciplines, meta, options, selection } = useBibliometrie();

  return (
    <section>
      <Title as="h2" look="h4">Comparaison internationale</Title>
      <ComparaisonInternationale disciplines={disciplines} meta={meta} options={options} selection={selection} />
    </section>
  );
}
