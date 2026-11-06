import { useMemo } from "react";

import type { SourceDonnees } from "../../../../api";
import type { PrixPositionnementMatrice } from "../../../../api/prix.ts";
import type { MatriceTextes } from "../../../../components/matrice/utils.tsx";
import { formatNombre, formatPart, formatPeriode } from "../../../../utils";
import { formatNonClasses } from "../../prix.ts";
import MatriceEtablissements from "../matrice-etablissements/index.tsx";

function getTextes(data: PrixPositionnementMatrice): MatriceTextes {
  return {
    axeX: `Niveau : part des nominations françaises ${formatPeriode(data.periodes.arrivee)} (échelle logarithmique)`,
    axeY: `Dynamique : évolution relative de la part depuis ${formatPeriode(data.periodes.depart)}`,
    calcul: ({ numerateur, denominateur }) => `${formatNombre(numerateur)} / ${formatNombre(denominateur)} nominations`,
    niveau: "Part du total",
    peuFiable: `moins de ${data.seuil_fiabilite} nominations sur l'une des deux périodes`,
    taille: { colonne: "Nominations", format: formatNombre, unite: "nominations" },
  };
}

type PrixEtablissementsProps = {
  data: PrixPositionnementMatrice;
  disciplineLabel: string;
  entiteNom: string;
  libelle: string;
  sources: SourceDonnees[];
};

// Matrice des établissements d'un groupe pour un groupe de prix : part des nominations françaises et son évolution
export default function PrixEtablissements({ data, disciplineLabel, entiteNom, libelle, sources }: PrixEtablissementsProps) {
  const textes = useMemo(() => getTextes(data), [data]);
  const groupeLibelle = data.groupes.find(({ code }) => code === data.groupe)?.libelle ?? "";
  const { arrivee, depart } = data.periodes;
  const nonClasses = formatNonClasses(data.non_classes);

  return (
    <MatriceEtablissements
      commentaire={(
        <>
          {`Horizontal : part de chaque établissement dans les nominations françaises ${formatPeriode(arrivee)}, en échelle logarithmique. `}
          {`Ligne pointillée : médiane des établissements représentés (${formatPart(data.reference.valeur)}) ; à droite, ceux qui font mieux. `}
          {`Vertical : part d'arrivée ÷ part ${formatPeriode(depart)} − 1 ; au-dessus de 0, l'établissement progresse. `}
          {`Taille : nominations ${formatPeriode(arrivee)}. `}
          {"Un lauréat compte pour toutes les tutelles de son laboratoire : les parts ne s'additionnent pas. "}
          {nonClasses && `${nonClasses} `}
          {data.provisoire && "Attention : la période d'arrivée contient l'année en cours, dont les prix ne sont pas tous recensés. "}
          {data.exclus.length > 0 && `${data.exclus.length} établissement(s) non représenté(s) : aucune nomination sur une période.`}
        </>
      )}
      data={data}
      entiteNom={entiteNom}
      id="suivi-recherche-financements-prix-etablissements"
      sources={sources}
      textes={textes}
      titre={`Part des nominations · ${libelle} · ${groupeLibelle} · ${disciplineLabel} · ${formatPeriode(depart)} → ${formatPeriode(arrivee)}`}
    />
  );
}
