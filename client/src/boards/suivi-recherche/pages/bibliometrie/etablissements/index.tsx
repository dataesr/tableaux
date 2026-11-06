import { Title } from "@dataesr/dsfr-plus";

import PositionnementEtablissements from "../charts/positionnement-etablissements/index.tsx";
import { useBibliometrie } from "../context.ts";

// « Comment se situe-t-il parmi des établissements comparables ? »
export default function EtablissementsPage() {
  const { disciplines, entiteNom, meta, options, selection } = useBibliometrie();

  return (
    <section>
      <Title as="h2" look="h4">Positionnement des établissements : niveau × dynamique</Title>
      <PositionnementEtablissements disciplines={disciplines} entiteNom={entiteNom} meta={meta} options={options} selection={selection} />
    </section>
  );
}
