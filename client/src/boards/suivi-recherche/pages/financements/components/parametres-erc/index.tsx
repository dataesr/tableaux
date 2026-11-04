import { Accordion, Checkbox, Fieldset } from "@dataesr/dsfr-plus";
import { useId } from "react";

import type { ErcMeta } from "../../../../api/erc.ts";
import { useSetParams } from "../../../../hooks/use-selection";

// Types proposés : les trois bourses individuelles (par défaut), Synergy et Proof of Concept.
// PERA, SJI et ERC-OTHER (quelques dizaines de candidatures, presque aucun lauréat) ne sont pas proposés.
const TYPES_PROPOSES = ["STG", "COG", "ADG", "SYG", "POC"];

export function getTypesLabel(meta: ErcMeta, types: string[]): string {
  return meta.types_bourse.filter(({ code }) => types.includes(code)).map(({ libelle }) => libelle).join(", ");
}

type ParametresErcProps = {
  meta: ErcMeta;
  types: string[];
};

// Paramètres de calcul du bloc ERC, repliés : leur valeur courante reste lisible dans le titre
export default function ParametresErc({ meta, types }: ParametresErcProps) {
  const setParams = useSetParams();
  const idPrefix = useId();
  const proposes = meta.types_bourse.filter(({ code }) => TYPES_PROPOSES.includes(code));

  const toggle = (code: string, checked: boolean) => {
    const next = meta.types_bourse
      .map((type) => type.code)
      .filter((c) => (c === code ? checked : types.includes(c)));
    const parDefaut = next.length === meta.types_bourse_defaut.length && next.every((c) => meta.types_bourse_defaut.includes(c));
    setParams({ type_bourse: parDefaut ? null : next.join(",") });
  };

  return (
    <Accordion className="fr-mb-3w" title={`Paramètres de calcul · ${getTypesLabel(meta, types)}`} titleAs="h3">
      <Fieldset legend="Types de bourse" hint="Au moins un type doit rester coché.">
        {proposes.map(({ avec_panel, code, libelle }) => {
          const checked = types.includes(code);
          return (
            <Checkbox
              checked={checked}
              // Le dernier type coché ne peut pas être retiré : une sélection vide n'a pas de sens
              disabled={checked && types.length === 1}
              hint={avec_panel ? undefined : "Sans discipline : compté seulement pour « Toutes disciplines »"}
              id={`${idPrefix}-${code}`}
              key={code}
              label={libelle}
              onChange={(event) => toggle(code, event.target.checked)}
            />
          );
        })}
      </Fieldset>
    </Accordion>
  );
}
