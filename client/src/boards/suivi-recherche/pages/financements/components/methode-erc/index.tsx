import { Accordion } from "@dataesr/dsfr-plus";

import type { ErcMeta } from "../../../../api/erc.ts";

// Méthode du bloc ERC : textes d'athena (erc_meta.methode), puis taux de candidature au vivier (calculé par le tableau,
// suivi de la méthode des viviers d'athena)
export default function MethodeErc({ meta }: { meta: ErcMeta }) {
  const titre = `Méthode · candidatures, lauréats, taux de succès${meta.vivier ? ", taux de candidature au vivier" : ""}`;
  return (
    <Accordion className="fr-mt-4w" title={titre} titleAs="h3">
      <ul>
        {[...meta.methode, ...(meta.vivier?.methode ?? [])].map((texte) => <li key={texte}>{texte}</li>)}
      </ul>
    </Accordion>
  );
}
