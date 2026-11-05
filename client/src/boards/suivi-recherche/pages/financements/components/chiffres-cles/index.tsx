import type { Ratio } from "../../../../api";
import type { Comptage, ErcIndicateursPeriode } from "../../../../api/erc.ts";
import { formatIndice, formatNombre, formatPart } from "../../../../utils";
import { UNITES } from "../../comptage.ts";
import { formatIndiceCandidature, formatIndiceReussite, VIVIER_LABELS } from "../../indice.ts";
import Cartes from "../cartes/index.tsx";
import type { Carte } from "../cartes/index.tsx";

function formatReference({ valeur, numerateur, denominateur }: Ratio) {
  return `${formatPart(valeur)} (${formatNombre(numerateur)} / ${formatNombre(denominateur)})`;
}

type ChiffresClesProps = {
  // Mode de comptage des effectifs affichés (réponse du serveur)
  comptage: Comptage;
  erc: Extract<ErcIndicateursPeriode, { periode: [number, number] }>;
  selectionLabel: string;
  typesLabel: string;
};

// Chiffres clés ERC de la sélection, en tête de la section « Bourses ERC » (titre h3, cartes h4).
// Chaque ratio est accompagné de son numérateur et de son dénominateur.
export default function ChiffresCles({ comptage, erc, selectionLabel, typesLabel }: ChiffresClesProps) {
  const unites = UNITES[comptage];
  const provisoire = erc.annees_provisoires.length > 0;
  const { indices } = erc;

  const cartes: Carte[] = [
    {
      titre: `${unites.Candidatures} ERC`,
      valeur: formatNombre(erc.nb_candidatures),
      detail: `${formatPart(erc.part_candidatures.valeur)} des ${unites.candidatures} ERC (${formatNombre(erc.part_candidatures.numerateur)} / ${formatNombre(erc.part_candidatures.denominateur)})`,
      fiable: true,
      provisoire,
    },
    {
      titre: `${unites.Laureats} ERC`,
      valeur: formatNombre(erc.nb_laureats),
      detail: `${formatPart(erc.part_laureats.valeur)} des ${unites.laureats} ERC (${formatNombre(erc.part_laureats.numerateur)} / ${formatNombre(erc.part_laureats.denominateur)})`,
      fiable: true,
      provisoire,
    },
    {
      titre: "Taux de succès ERC",
      valeur: formatPart(erc.taux_succes.valeur),
      detail: [
        `${formatNombre(erc.taux_succes.numerateur)} ${unites.laureats} / ${formatNombre(erc.taux_succes.denominateur)} ${unites.candidatures}`,
        erc.taux_succes_france && `France : ${formatReference(erc.taux_succes_france)}`,
        `ensemble de l'ERC : ${formatReference(erc.taux_succes_reference)}`,
      ].filter(Boolean).join(" · "),
      fiable: erc.fiable,
      provisoire,
    },
  ];
  // Indice de candidature : absent si seuls des types sans panel (Synergy, Proof of Concept) sont retenus
  if (indices) {
    cartes.push({
      titre: "Indice de candidature ERC",
      valeur: formatIndice(indices.candidature.valeur),
      detail: `${formatIndiceCandidature(indices.candidature, unites)} d'après le vivier (${VIVIER_LABELS[indices.vivier].toLowerCase()}) ; `
        + `pays de l'UE = 1 · indice de réussite : ${formatIndiceReussite(indices.reussite)}`,
      fiable: indices.fiable,
      provisoire: provisoire || indices.vivier_provisoire,
    });
  }

  const notes = [
    cartes.some(({ fiable }) => !fiable)
      && `Peu fiable : moins de ${erc.seuil_fiabilite} ${unites.candidatures} (taux de succès) ou moins de ${erc.seuil_fiabilite} ${unites.candidatures} ${unites.attendues} (indice de candidature) ; la valeur varie alors fortement d'une candidature à l'autre.`,
    indices?.vivier_provisoire
      && "Indice provisoire : pour les articles récents, le top 10 % des plus cités n'est pas définitif (fenêtre de citation pas close).",
  ].filter((note): note is string => Boolean(note));

  return <Cartes cartes={cartes} notes={notes} sousTitre={`Bourses ERC : ${typesLabel}`} titre={selectionLabel} titreAs="h3" />;
}
