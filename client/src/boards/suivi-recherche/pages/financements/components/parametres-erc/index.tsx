import { Accordion, Checkbox, Fieldset, Radio } from "@dataesr/dsfr-plus";
import { useId } from "react";

import { COMPTAGE_DEFAUT, VIVIER_DEFAUT, VIVIERS } from "../../../../api/erc.ts";
import type { Comptage, ErcMeta, ErcOptions } from "../../../../api/erc.ts";
import { useSetParams } from "../../../../hooks/use-selection";
import { COMPTAGE_LABELS } from "../../comptage.ts";
import { VIVIER_LABELS } from "../../vivier.ts";

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
export default function ParametresErc({ meta, options: { comptage, types, vivier } }: ParametresErcProps) {
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

  // Les valeurs par défaut n'apparaissent pas dans le titre, comme elles ne sont pas écrites dans l'URL
  const titre = [
    getTypesLabel(meta, types),
    comptage !== COMPTAGE_DEFAUT && `Comptage : ${COMPTAGE_LABELS[comptage]}`,
    meta.vivier && vivier !== VIVIER_DEFAUT && `Vivier : ${VIVIER_LABELS[vivier].toLowerCase()}`,
  ]
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
      {meta.vivier && (
        <Fieldset
          hint={"Dénominateur du taux de candidature au vivier. Chercheurs top 10 % : au moins un article parmi les 10 % "
            + "les plus cités, population plus proche de celle que vise l'ERC."}
          legend="Vivier de chercheurs"
        >
          {VIVIERS.map((mode) => (
            <Radio
              checked={vivier === mode}
              id={`${idPrefix}-vivier-${mode}`}
              key={mode}
              label={VIVIER_LABELS[mode]}
              name={`${idPrefix}-vivier`}
              onChange={() => setParams({ vivier: mode === VIVIER_DEFAUT ? null : mode })}
            />
          ))}
        </Fieldset>
      )}
    </Accordion>
  );
}
