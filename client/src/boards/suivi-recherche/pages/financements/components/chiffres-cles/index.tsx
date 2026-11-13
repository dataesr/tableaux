import type { Ratio } from "../../../../api";
import type { Comptage, ErcIndicateursPeriode, ErcVivierEntite, TauxVivier } from "../../../../api/erc.ts";
import { formatNombre, formatPart, formatPeriode } from "../../../../utils";
import { UNITES } from "../../comptage.ts";
import { formatCalculVivier, formatValeurVivier, getTexteIndisponible, getTexteVivierFixe, TITRE_TAUX_VIVIER, UNITE_TAUX_VIVIER } from "../../vivier.ts";
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
  // Taux de candidature au vivier : calculé seulement sur les appels de la période du vivier (types avec panel)
  const vivier = erc.vivier.indisponible ? null : (erc.vivier as ErcVivierEntite);
  const formatReferenceVivier = (libelle: string, taux: TauxVivier) => `${libelle} : ${formatValeurVivier(taux.valeur)} (${formatCalculVivier(taux, vivier!.vivier, unites)})`;

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
  if (vivier) {
    cartes.push({
      titre: `${TITRE_TAUX_VIVIER} (appels ${formatPeriode(vivier.appels)})`,
      valeur: formatValeurVivier(vivier.taux.valeur),
      detail: [
        `${UNITE_TAUX_VIVIER} : ${formatCalculVivier(vivier.taux, vivier.vivier, unites)}`,
        vivier.france && formatReferenceVivier("France", vivier.france),
        formatReferenceVivier(`ensemble des ${vivier.nb_pays_reference} pays comparés`, vivier.reference),
      ].filter(Boolean).join(" · "),
      fiable: vivier.taux.fiable,
      provisoire: vivier.appels_provisoires.length > 0 || vivier.vivier_provisoire,
    });
  }

  const notes = [
    cartes.some(({ fiable }) => !fiable)
      && `Peu fiable : moins de ${erc.seuil_fiabilite} ${unites.candidatures} ; la valeur varie alors fortement d'une candidature à l'autre.`,
    vivier && `${TITRE_TAUX_VIVIER} : bourses avec panel seulement (Starting, Consolidator, Advanced). ${getTexteVivierFixe(vivier)}`,
    erc.vivier.indisponible && getTexteIndisponible(erc.vivier),
  ].filter((note): note is string => Boolean(note));

  return <Cartes cartes={cartes} notes={notes} sousTitre={`Bourses ERC : ${typesLabel}`} titre={selectionLabel} titreAs="h3" />;
}
