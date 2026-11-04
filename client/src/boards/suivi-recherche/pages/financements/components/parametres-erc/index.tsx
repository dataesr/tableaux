import { Accordion, Checkbox, Fieldset, Radio } from "@dataesr/dsfr-plus";
import { useId } from "react";

import { COMPTAGE_DEFAUT } from "../../../../api/erc.ts";
import type { Comptage, ErcMeta, ErcOptions } from "../../../../api/erc.ts";
import { useSetParams } from "../../../../hooks/use-selection";
import { COMPTAGE_LABELS } from "../../comptage.ts";

// Types proposés : les trois bourses individuelles (par défaut), Synergy et Proof of Concept.
// PERA, SJI et ERC-OTHER (quelques dizaines de candidatures, presque aucun lauréat) ne sont pas proposés.
const TYPES_PROPOSES = ["STG", "COG", "ADG", "SYG", "POC"];

export function getTypesLabel(meta: ErcMeta, types: string[]): string {
  return meta.types_bourse.filter(({ code }) => types.includes(code)).map(({ libelle }) => libelle).join(", ");
}

type ParametresErcProps = {
  meta: ErcMeta;
  options: ErcOptions;
};

// Paramètres de calcul du bloc ERC, repliés : leur valeur courante reste lisible dans le titre
export default function ParametresErc({ meta, options: { comptage, types } }: ParametresErcProps) {
  const setParams = useSetParams();
  const idPrefix = useId();
  const proposes = meta.types_bourse.filter(({ code }) => TYPES_PROPOSES.includes(code));
  const comptages = Object.keys(meta.modes_comptage) as Comptage[];

  const toggle = (code: string, checked: boolean) => {
    const next = meta.types_bourse
      .map((type) => type.code)
      .filter((c) => (c === code ? checked : types.includes(c)));
    const parDefaut = next.length === meta.types_bourse_defaut.length && next.every((c) => meta.types_bourse_defaut.includes(c));
    setParams({ type_bourse: parDefaut ? null : next.join(",") });
  };

  // Le mode par défaut n'apparaît pas dans le titre, comme il n'est pas écrit dans l'URL
  const titre = [getTypesLabel(meta, types), comptage !== COMPTAGE_DEFAUT && `Comptage : ${COMPTAGE_LABELS[comptage]}`]
    .filter(Boolean)
    .join(" · ");

  return (
    <Accordion className="fr-mb-3w" title={`Paramètres de calcul · ${titre}`} titleAs="h3">
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
      <Fieldset
        hint="Ne change les chiffres que pour les Synergy Grants, qui ont 2 à 4 porteurs par projet."
        isInline
        legend="Compter en"
      >
        {comptages.map((mode) => (
          <Radio
            checked={comptage === mode}
            id={`${idPrefix}-comptage-${mode}`}
            key={mode}
            label={COMPTAGE_LABELS[mode]}
            name={`${idPrefix}-comptage`}
            onChange={() => setParams({ comptage: mode === COMPTAGE_DEFAUT ? null : mode })}
          />
        ))}
      </Fieldset>
    </Accordion>
  );
}
