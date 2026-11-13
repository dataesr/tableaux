import { Alert, Notice } from "@dataesr/dsfr-plus";
import { useState } from "react";

import DefaultSkeleton from "../../../../../components/charts-skeletons/default.tsx";
import { useErcEtablissements } from "../../../api/erc.ts";
import type { ErcEtablissements, ErcVivierNuage } from "../../../api/erc.ts";
import { usePrixPositionnement } from "../../../api/prix.ts";
import type { PrixPositionnementMatrice } from "../../../api/prix.ts";
import ChartBusy from "../../../components/chart-busy/index.tsx";
import { useRenderTransition } from "../../../hooks/use-render-transition";
import { ENTITE_NATIONALE, useErcOptions } from "../../../hooks/use-selection";
import { formatNombre, formatPart, formatPeriode, getDisciplineLabel } from "../../../utils";
import ErcVivierEtablissements from "../charts/erc-vivier-etablissements/index.tsx";
import { ChoixGroupe } from "../charts/matrice-etablissements/index.tsx";
import PrixEtablissements from "../charts/prix-etablissements/index.tsx";
import Cartes from "../components/cartes/index.tsx";
import type { Carte } from "../components/cartes/index.tsx";
import Dispositifs from "../components/dispositifs/index.tsx";
import DoubleCompte from "../components/double-compte/index.tsx";
import MethodeErc from "../components/methode-erc/index.tsx";
import MethodePrix from "../components/methode-prix/index.tsx";
import ParametresErc, { getTypesLabel } from "../components/parametres-erc/index.tsx";
import { UNITES } from "../comptage.ts";
import { useFinancements } from "../context.ts";
import { useDispositifs } from "../dispositifs.ts";
import { formatPartTotal } from "../prix.ts";
import { formatRang } from "../rang.ts";
import { formatCalculVivier, formatValeurVivier, getTexteIndisponible, TITRE_TAUX_VIVIER } from "../vivier.ts";

type ErcPeriode = Extract<ErcEtablissements, { periode: [number, number] }>;

// Seul groupe de prix comparé entre établissements : les médailles du CNRS sont trop peu nombreuses par établissement
const DISTINCTION = "IUF";

// Chiffres clés ERC de l'établissement choisi sur toute la période, les mêmes que ceux du profil : candidatures et
// lauréats (rang sur leur part du total français), taux de succès et, si les viviers sont disponibles, candidatures
// pour 1 000 chercheurs (rang sur les appels de la période du vivier)
function getCartesErc(data: ErcPeriode, groupe: string, nuage: ErcVivierNuage | null): Carte[] {
  const { classement } = data;
  if (!classement) return [];
  const vivier = nuage?.classement;
  const unites = UNITES[data.comptage];
  const provisoire = data.annees_provisoires.length > 0;
  const { part_candidatures: partCandidatures, part_laureats: part, taux_succes: taux } = classement;
  return [
    {
      titre: `${unites.Candidatures} ERC`,
      valeur: formatNombre(classement.nb_candidatures),
      detail: `${formatRang(partCandidatures.rang, partCandidatures.nb, groupe)} · ${formatPart(partCandidatures.ratio?.valeur ?? null)} des ${unites.candidatures} ERC français `
        + `(${formatNombre(partCandidatures.ratio?.numerateur ?? 0)} / ${formatNombre(partCandidatures.ratio?.denominateur ?? 0)})`,
      fiable: true,
      provisoire,
    },
    {
      titre: `${unites.Laureats} ERC`,
      valeur: formatNombre(classement.nb_laureats),
      detail: `${formatRang(part.rang, part.nb, groupe)} · ${formatPart(part.ratio?.valeur ?? null)} des ${unites.laureats} ERC français `
        + `(${formatNombre(part.ratio?.numerateur ?? 0)} / ${formatNombre(part.ratio?.denominateur ?? 0)})`,
      fiable: true,
      provisoire,
    },
    {
      titre: "Taux de succès ERC",
      valeur: formatPart(taux.ratio?.valeur ?? null),
      detail: `${taux.fiable ? formatRang(taux.rang, taux.nb, `${groupe} d'au moins ${data.seuil_fiabilite} ${unites.candidatures}`) : "non classé"} · `
        + `${formatNombre(taux.ratio?.numerateur ?? 0)} ${unites.laureats} / ${formatNombre(taux.ratio?.denominateur ?? 0)} ${unites.candidatures}`,
      fiable: taux.fiable,
      provisoire,
    },
    ...(nuage && vivier ? [{
      titre: `${TITRE_TAUX_VIVIER} (appels ${formatPeriode(nuage.appels)})`,
      valeur: formatValeurVivier(vivier.point.candidature.valeur),
      detail: `${formatRang(vivier.rang, vivier.nb, groupe)} · par an : ${formatCalculVivier(vivier.point.candidature, nuage.vivier, UNITES[nuage.comptage])}`,
      fiable: vivier.point.candidature.fiable,
      provisoire: nuage.appels_provisoires.length > 0 || nuage.vivier_provisoire,
    }] : []),
  ];
}

// Chiffres clés IUF : nominations, part du total France et rang dans le groupe
function getCartesPrix(data: PrixPositionnementMatrice, groupe: string): Carte[] {
  const { classement } = data;
  if (!classement) return [];
  const provisoire = data.annees_provisoires.length > 0;
  return [
    {
      titre: "Nominations IUF",
      valeur: formatNombre(classement.nb_laureats),
      detail: `${formatRang(classement.part.rang, classement.part.nb, groupe)} · ${formatPartTotal(classement.part.ratio)}`,
      fiable: true,
      provisoire,
    },
  ];
}

// « Comment se positionnent les établissements les uns par rapport aux autres ? »
export default function EtablissementsSection() {
  const { disciplines, entiteNom, ercMeta, prixMeta, prixMetaError, selection } = useFinancements();
  const options = useErcOptions(ercMeta);
  // Groupe choisi pour l'établissement sélectionné à ce moment-là, commun aux deux matrices ;
  // sinon, le serveur prend le groupe de l'établissement
  const [choix, setChoix] = useState<{ entiteId: string; groupe: string } | null>(null);
  const groupeChoisi = choix?.entiteId === selection.entiteId ? choix.groupe : undefined;

  // Blocs masqués : pas de requête ; la liste des groupes vient alors du bloc affiché
  const { estAffiche } = useDispositifs();
  const erc = useErcEtablissements(selection, options, groupeChoisi, estAffiche("erc"));
  const prix = usePrixPositionnement(selection, DISTINCTION, groupeChoisi, estAffiche("prix"));
  // Réponses affichées une fois le grisé peint : chiffres clés, graphiques et tableaux décrivent la même réponse
  const { applied: ercData, busy: ercBusy } = useRenderTransition(erc.data);
  const { applied: prixData, busy: prixBusy } = useRenderTransition(prix.data);
  const ercPeriode = ercData?.periode ? ercData : null;
  const nuage = ercPeriode && !ercPeriode.vivier.indisponible ? (ercPeriode.vivier as ErcVivierNuage) : null;
  const vivierIndisponible = ercPeriode?.vivier.indisponible ? ercPeriode.vivier : null;
  const prixMatrice = prixData?.periodes ? prixData : null;
  const disciplineLabel = getDisciplineLabel(selection, disciplines);
  const groupes = ercData?.groupes ?? prixData?.groupes ?? [];
  const groupe = groupeChoisi ?? ercData?.groupe ?? prixData?.groupe;
  const groupeLibelle = (groupes.find(({ code }) => code === groupe)?.libelle ?? "").toLowerCase();
  const etablissement = selection.entiteId !== ENTITE_NATIONALE;
  const cartesErc = ercPeriode ? getCartesErc(ercPeriode, groupeLibelle, nuage) : [];
  const cartesPrix = prixMatrice ? getCartesPrix(prixMatrice, groupeLibelle) : [];
  const libelleIuf = prixMeta?.groupes.find(({ code }) => code === DISTINCTION)?.libelle ?? "Institut universitaire de France";

  const blocErc = (
    <>
      {cartesErc.length > 0 && ercPeriode && (
        <ChartBusy busy={erc.isPlaceholderData || ercBusy}>
          <Cartes
            cartes={cartesErc}
            sousTitre={`Bourses ERC : ${getTypesLabel(ercMeta, options.types)} · rang parmi les ${groupeLibelle}`}
            titre={`${entiteNom} · appels ${formatPeriode(ercPeriode.periode)} · ${disciplineLabel}`}
            titreAs="h3"
          />
        </ChartBusy>
      )}
      <ParametresErc meta={ercMeta} options={options} />
      {erc.isError && <Alert description="La comparaison des établissements n'a pas pu être chargée." title="Erreur de chargement" variant="error" />}
      {!erc.isError && (erc.isLoading || !ercData) && <DefaultSkeleton height="560px" />}
      {!erc.isError && ercData && !ercPeriode && (
        <Notice closeMode="disallow" type="info">
          {`Aucun appel ERC dans la période choisie : les appels disponibles vont de ${formatPeriode([Math.min(...ercMeta.annees), Math.max(...ercMeta.annees)])}.`}
        </Notice>
      )}
      {!erc.isError && vivierIndisponible && <Notice closeMode="disallow" type="info">{getTexteIndisponible(vivierIndisponible)}</Notice>}
      {!erc.isError && nuage && (
        // Grisé pendant l'appel API (réponse précédente affichée) et pendant le redessin
        <ChartBusy busy={erc.isPlaceholderData || ercBusy}>
          <ErcVivierEtablissements data={nuage} disciplineLabel={disciplineLabel} entiteNom={entiteNom} groupeLibelle={groupes.find(({ code }) => code === groupe)?.libelle ?? ""} meta={ercMeta} />
        </ChartBusy>
      )}
      <MethodeErc meta={ercMeta} />
    </>
  );

  const blocPrix = (
    <>
      {cartesPrix.length > 0 && prixMatrice && (
        <ChartBusy busy={prix.isPlaceholderData || prixBusy}>
          <Cartes
            cartes={cartesPrix}
            sousTitre={`Nominations par année d'attribution · rang parmi les ${groupeLibelle}`}
            titre={`${entiteNom} · ${libelleIuf} · ${formatPeriode(prixMatrice.periode)} · ${disciplineLabel}`}
            titreAs="h3"
          />
        </ChartBusy>
      )}
      {(prix.isError || prixMetaError) && (
        <Alert description="La comparaison des établissements pour l'IUF n'a pas pu être chargée." title="Erreur de chargement" variant="error" />
      )}
      {!prix.isError && (prix.isLoading || !prixData) && <DefaultSkeleton height="560px" />}
      {!prix.isError && prixData && !prixMatrice && (
        <Notice closeMode="disallow" type="info">
          La matrice compare deux périodes : choisissez une période d'au moins deux ans.
        </Notice>
      )}
      {!prix.isError && prixMatrice && (
        <ChartBusy busy={prix.isPlaceholderData || prixBusy}>
          <PrixEtablissements data={prixMatrice} disciplineLabel={disciplineLabel} entiteNom={entiteNom} libelle={libelleIuf} sources={prixMeta?.sources ?? []} />
        </ChartBusy>
      )}
      {prixMeta && <MethodePrix meta={prixMeta} />}
    </>
  );

  return (
    <>
      <DoubleCompte />
      {!etablissement && (
        <Notice className="fr-mb-4w" closeMode="disallow" type="info">
          Choisissez un établissement dans la sélection pour voir son rang parmi les établissements comparables et le mettre en avant.
        </Notice>
      )}
      {etablissement && ercPeriode && cartesErc.length === 0 && (
        <Notice className="fr-mb-4w" closeMode="disallow" type="info">
          {`${entiteNom} ne fait pas partie des établissements comparés : choisissez son groupe pour voir son rang.`}
        </Notice>
      )}
      <div className="fr-mb-4w">
        <ChoixGroupe groupe={groupe} groupes={groupes} onGroupe={(code) => setChoix({ entiteId: selection.entiteId, groupe: code })} />
      </div>

      <Dispositifs
        contenus={{
          erc: { bloc: blocErc },
          anr: { enPreparation: true },
          prix: {
            bloc: blocPrix,
            description: `${libelleIuf} seul : les médailles du CNRS sont trop peu nombreuses par établissement pour un classement.`,
          },
        }}
      />
    </>
  );
}
