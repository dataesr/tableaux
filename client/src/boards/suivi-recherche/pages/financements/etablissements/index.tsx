import { Alert, Notice, Title } from "@dataesr/dsfr-plus";
import { useState } from "react";

import DefaultSkeleton from "../../../../../components/charts-skeletons/default.tsx";
import { useErcPositionnement } from "../../../api/erc.ts";
import type { ErcPositionnementMatrice, IndicateurMatrice } from "../../../api/erc.ts";
import { usePrixPositionnement } from "../../../api/prix.ts";
import type { PrixPositionnementMatrice } from "../../../api/prix.ts";
import ChartBusy from "../../../components/chart-busy/index.tsx";
import { useRenderTransition } from "../../../hooks/use-render-transition";
import { ENTITE_NATIONALE, useErcOptions } from "../../../hooks/use-selection";
import { formatNombre, formatPart, formatPeriode, getDisciplineLabel } from "../../../utils";
import ErcEtablissements, { ChoixIndicateur } from "../charts/erc-etablissements/index.tsx";
import { ChoixGroupe } from "../charts/matrice-etablissements/index.tsx";
import PrixEtablissements from "../charts/prix-etablissements/index.tsx";
import Cartes from "../components/cartes/index.tsx";
import type { Carte } from "../components/cartes/index.tsx";
import DoubleCompte from "../components/double-compte/index.tsx";
import MethodeErc from "../components/methode-erc/index.tsx";
import MethodePrix from "../components/methode-prix/index.tsx";
import ParametresErc, { getTypesLabel } from "../components/parametres-erc/index.tsx";
import { UNITES } from "../comptage.ts";
import { useFinancements } from "../context.ts";
import { formatPartTotal } from "../prix.ts";
import { formatRang } from "../rang.ts";

// Seul groupe de prix comparé entre établissements : les médailles du CNRS sont trop peu nombreuses par établissement
const DISTINCTION = "IUF";

// Chiffres clés ERC de l'établissement choisi sur toute la période : lauréats (rang sur la part) et taux de succès
function getCartesErc(data: ErcPositionnementMatrice, groupe: string): Carte[] {
  const { classement } = data;
  if (!classement) return [];
  const unites = UNITES[data.comptage];
  const provisoire = data.annees_provisoires.length > 0;
  const { part_laureats: part, taux_succes: taux } = classement;
  return [
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
      detail: `${taux.fiable ? formatRang(taux.rang, taux.nb, `${groupe} d'au moins ${data.seuil_taux} ${unites.candidatures}`) : "non classé"} · `
        + `${formatNombre(taux.ratio?.numerateur ?? 0)} ${unites.laureats} / ${formatNombre(taux.ratio?.denominateur ?? 0)} ${unites.candidatures}`,
      fiable: taux.fiable,
      provisoire,
    },
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
  const [indicateur, setIndicateur] = useState<IndicateurMatrice>("part_laureats");
  // Groupe choisi pour l'établissement sélectionné à ce moment-là, commun aux deux matrices ;
  // sinon, le serveur prend le groupe de l'établissement
  const [choix, setChoix] = useState<{ entiteId: string; groupe: string } | null>(null);
  const groupeChoisi = choix?.entiteId === selection.entiteId ? choix.groupe : undefined;

  const erc = useErcPositionnement(selection, options, indicateur, groupeChoisi);
  const prix = usePrixPositionnement(selection, DISTINCTION, groupeChoisi);
  // Réponses affichées une fois le grisé peint : chiffres clés, matrice et tableaux décrivent la même réponse
  const { applied: ercData, busy: ercBusy } = useRenderTransition(erc.data);
  const { applied: prixData, busy: prixBusy } = useRenderTransition(prix.data);
  const ercMatrice = ercData?.periodes ? ercData : null;
  const prixMatrice = prixData?.periodes ? prixData : null;
  const disciplineLabel = getDisciplineLabel(selection, disciplines);
  const groupes = ercData?.groupes ?? prixData?.groupes ?? [];
  const groupe = groupeChoisi ?? ercData?.groupe ?? prixData?.groupe;
  const groupeLibelle = (groupes.find(({ code }) => code === groupe)?.libelle ?? "").toLowerCase();
  const etablissement = selection.entiteId !== ENTITE_NATIONALE;
  const cartesErc = ercMatrice ? getCartesErc(ercMatrice, groupeLibelle) : [];
  const cartesPrix = prixMatrice ? getCartesPrix(prixMatrice, groupeLibelle) : [];
  const libelleIuf = prixMeta?.groupes.find(({ code }) => code === DISTINCTION)?.libelle ?? "Institut universitaire de France";

  return (
    <>
      <DoubleCompte />
      {!etablissement && (
        <Notice className="fr-mb-4w" closeMode="disallow" type="info">
          Choisissez un établissement dans la sélection pour voir son rang parmi les établissements comparables et le mettre en avant.
        </Notice>
      )}
      {etablissement && ercMatrice && cartesErc.length === 0 && (
        <Notice className="fr-mb-4w" closeMode="disallow" type="info">
          {`${entiteNom} ne fait pas partie des établissements comparés : choisissez son groupe pour voir son rang.`}
        </Notice>
      )}
      <div className="fr-mb-4w">
        <ChoixGroupe groupe={groupe} groupes={groupes} onGroupe={(code) => setChoix({ entiteId: selection.entiteId, groupe: code })} />
      </div>

      <section>
        <Title as="h2" look="h4">Bourses ERC</Title>
        {cartesErc.length > 0 && ercMatrice && (
          <ChartBusy busy={erc.isPlaceholderData || ercBusy}>
            <Cartes
              cartes={cartesErc}
              sousTitre={`Bourses ERC : ${getTypesLabel(ercMeta, options.types)} · rang parmi les ${groupeLibelle}`}
              titre={`${entiteNom} · appels ${formatPeriode(ercMatrice.periode)} · ${disciplineLabel}`}
              titreAs="h3"
            />
          </ChartBusy>
        )}
        <ParametresErc avecVivier={false} meta={ercMeta} options={options} />
        <ChoixIndicateur indicateur={indicateur} onIndicateur={setIndicateur} />
        {erc.isError && <Alert description="La comparaison des établissements n'a pas pu être chargée." title="Erreur de chargement" variant="error" />}
        {!erc.isError && (erc.isLoading || !ercData) && <DefaultSkeleton height="560px" />}
        {!erc.isError && ercData && !ercMatrice && (
          <Notice closeMode="disallow" type="info">
            La matrice compare deux périodes d'appels dont les résultats sont publiés : choisissez une période contenant au moins deux de ces années d'appel.
          </Notice>
        )}
        {!erc.isError && ercMatrice && (
          // Grisé pendant l'appel API (réponse précédente affichée) et pendant le redessin
          <ChartBusy busy={erc.isPlaceholderData || ercBusy}>
            <ErcEtablissements data={ercMatrice} disciplineLabel={disciplineLabel} entiteNom={entiteNom} />
          </ChartBusy>
        )}
        <MethodeErc meta={ercMeta} />
      </section>

      <section className="fr-mt-6w">
        <Title as="h2" look="h4">Prix et distinctions</Title>
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
            <PrixEtablissements data={prixMatrice} disciplineLabel={disciplineLabel} entiteNom={entiteNom} libelle={libelleIuf} />
          </ChartBusy>
        )}
        {prixMeta && <MethodePrix meta={prixMeta} />}
      </section>
    </>
  );
}
