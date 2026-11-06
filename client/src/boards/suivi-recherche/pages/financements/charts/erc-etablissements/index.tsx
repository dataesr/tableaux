import { SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import { useMemo } from "react";

import type { SourceDonnees } from "../../../../api";
import type { ErcPositionnementMatrice, IndicateurMatrice } from "../../../../api/erc.ts";
import type { MatriceTextes } from "../../../../components/matrice/utils.tsx";
import { formatNombre, formatPart, formatPeriode } from "../../../../utils";
import { UNITES } from "../../comptage.ts";
import MatriceEtablissements from "../matrice-etablissements/index.tsx";

export const INDICATEURS_MATRICE: { key: IndicateurMatrice; label: string }[] = [
  { key: "part_laureats", label: "Part des lauréats" },
  { key: "taux_succes", label: "Taux de succès" },
];

// Libellés de la matrice ERC : niveau = part des lauréats français ou taux de succès, taille = lauréats
function getTextes(data: ErcPositionnementMatrice): MatriceTextes {
  const unites = UNITES[data.comptage];
  const taux = data.indicateur === "taux_succes";
  const arrivee = formatPeriode(data.periodes.arrivee);
  return {
    axeX: taux
      ? `Niveau : taux de succès ${arrivee} (échelle logarithmique)`
      : `Niveau : part des ${unites.laureats} ERC français ${arrivee} (échelle logarithmique)`,
    axeY: `Dynamique : évolution relative ${taux ? "du taux de succès" : "de la part"} depuis ${formatPeriode(data.periodes.depart)}`,
    calcul: ({ numerateur, denominateur }) => (taux
      ? `${formatNombre(numerateur)} ${unites.laureats} / ${formatNombre(denominateur)} ${unites.candidatures}`
      : `${formatNombre(numerateur)} / ${formatNombre(denominateur)} ${unites.laureats} français`),
    niveau: taux ? "Taux de succès" : "Part",
    peuFiable: `moins de ${data.seuil_fiabilite} ${taux ? unites.candidatures : unites.laureats} sur l'une des deux périodes`,
    taille: { colonne: unites.Laureats, format: formatNombre, unite: unites.laureats },
  };
}

type ChoixIndicateurProps = {
  indicateur: IndicateurMatrice;
  onIndicateur: (indicateur: IndicateurMatrice) => void;
};

// Niveau de la matrice ERC : hors du grisé, utilisable pendant le recalcul
export function ChoixIndicateur({ indicateur, onIndicateur }: ChoixIndicateurProps) {
  return (
    <SegmentedControl className="fr-segmented--sm fr-mb-2w" label="Niveau" name="sr-erc-etablissements-indicateur">
      {INDICATEURS_MATRICE.map(({ key, label }) => (
        <SegmentedElement checked={indicateur === key} key={key} label={label} onClick={() => onIndicateur(key)} value={key} />
      ))}
    </SegmentedControl>
  );
}

type ErcEtablissementsProps = {
  data: ErcPositionnementMatrice;
  disciplineLabel: string;
  entiteNom: string;
  sources: SourceDonnees[];
};

// Matrice ERC des établissements d'un groupe : part des lauréats français ou taux de succès
export default function ErcEtablissements({ data, disciplineLabel, entiteNom, sources }: ErcEtablissementsProps) {
  const textes = useMemo(() => getTextes(data), [data]);
  const label = INDICATEURS_MATRICE.find(({ key }) => key === data.indicateur)?.label ?? "";
  const groupeLibelle = data.groupes.find(({ code }) => code === data.groupe)?.libelle ?? "";
  const { reference } = data;
  const referenceTexte = data.indicateur === "taux_succes"
    ? `taux de succès de la France (${formatPart(reference.valeur)} = ${textes.calcul({ valeur: reference.valeur, numerateur: reference.numerateur ?? 0, denominateur: reference.denominateur ?? 0 })})`
    : `médiane des établissements représentés (${formatPart(reference.valeur)})`;

  return (
    <MatriceEtablissements
      commentaire={(
        <>
          {`Horizontal : ${label.toLowerCase()} de chaque établissement sur les appels ${formatPeriode(data.periodes.arrivee)}, en échelle logarithmique. `}
          {`Ligne pointillée : ${referenceTexte} ; à droite, ceux qui font mieux. `}
          {`Vertical : valeur d'arrivée ÷ valeur des appels ${formatPeriode(data.periodes.depart)} − 1 ; au-dessus de 0, l'établissement progresse. `}
          {`Taille : ${textes.taille.unite} des appels ${formatPeriode(data.periodes.arrivee)}. Appels consolidés seulement (résultats tous publiés). `}
          {"Un même ERC compte pour plusieurs établissements (tutelles) : les parts ne s'additionnent pas. "}
          {data.provisoire && " Attention : la période d'arrivée contient des appels provisoires."}
          {data.exclus.length > 0 && ` ${data.exclus.length} établissement(s) non représenté(s) : aucun lauréat sur une période ou évolution non calculable.`}
        </>
      )}
      data={data}
      entiteNom={entiteNom}
      id="suivi-recherche-financements-erc-etablissements"
      sources={sources}
      textes={textes}
      titre={`${label} ERC des établissements · ${groupeLibelle} · ${disciplineLabel} · appels ${formatPeriode(data.periodes.depart)} → ${formatPeriode(data.periodes.arrivee)}`}
    />
  );
}
