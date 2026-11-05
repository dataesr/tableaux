import { Accordion } from "@dataesr/dsfr-plus";

import type { ErcMeta } from "../../../../api/erc.ts";

// Méthode du bloc ERC : textes d'athena (erc_meta.methode), puis indice de candidature (calculé par le tableau)
export default function MethodeErc({ meta }: { meta: ErcMeta }) {
  return (
    <Accordion className="fr-mt-4w" title="Méthode · candidatures, lauréats, taux de succès, indice de candidature" titleAs="h3">
      <ul>
        {[...meta.methode, ...meta.methode_indice].map((texte) => <li key={texte}>{texte}</li>)}
      </ul>
    </Accordion>
  );
}
