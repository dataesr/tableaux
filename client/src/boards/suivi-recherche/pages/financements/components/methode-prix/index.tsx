import { Accordion } from "@dataesr/dsfr-plus";

import type { PrixMeta } from "../../../../api/prix.ts";

// Méthode des prix : textes d'athena (prix_meta.methode), dont la discipline des lauréats
export default function MethodePrix({ meta }: { meta: PrixMeta }) {
  return (
    <Accordion className="fr-mt-4w" title="Méthode · nominations, rattachement aux établissements, discipline des lauréats" titleAs="h3">
      <ul>
        {meta.methode.map((texte) => <li key={texte}>{texte}</li>)}
        <li>Part du total : nominations de l'entité / nominations françaises, mêmes prix, mêmes années et même discipline.</li>
      </ul>
    </Accordion>
  );
}
