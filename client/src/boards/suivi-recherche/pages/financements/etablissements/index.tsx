import { Alert, Notice, Title } from "@dataesr/dsfr-plus";
import { useState } from "react";

import DefaultSkeleton from "../../../../../components/charts-skeletons/default.tsx";
import { useErcPositionnement } from "../../../api/erc.ts";
import type { ErcPositionnementMatrice, IndicateurMatrice } from "../../../api/erc.ts";
import ChartBusy from "../../../components/chart-busy/index.tsx";
import { useRenderTransition } from "../../../hooks/use-render-transition";
import { ENTITE_NATIONALE, useErcOptions } from "../../../hooks/use-selection";
import { formatNombre, formatPart, formatPeriode, getDisciplineLabel } from "../../../utils";
import ErcEtablissements, { ControlesMatrice } from "../charts/erc-etablissements/index.tsx";
import Cartes from "../components/cartes/index.tsx";
import type { Carte } from "../components/cartes/index.tsx";
import DoubleCompte from "../components/double-compte/index.tsx";
import MethodeErc from "../components/methode-erc/index.tsx";
import ParametresErc, { getTypesLabel } from "../components/parametres-erc/index.tsx";
import { UNITES } from "../comptage.ts";
import { useFinancements } from "../context.ts";
import { formatRang } from "../rang.ts";

// Chiffres clés de l'établissement choisi sur toute la période : lauréats (rang sur la part) et taux de succès
function getCartes(data: ErcPositionnementMatrice, groupe: string): Carte[] {
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

// « Comment se positionnent les établissements les uns par rapport aux autres ? »
export default function EtablissementsSection() {
  const { disciplines, entiteNom, ercMeta, selection } = useFinancements();
  const options = useErcOptions(ercMeta);
  const [indicateur, setIndicateur] = useState<IndicateurMatrice>("part_laureats");
  // Groupe choisi pour l'établissement sélectionné à ce moment-là ; sinon, le serveur prend le groupe de l'établissement
  const [choix, setChoix] = useState<{ entiteId: string; groupe: string } | null>(null);
  const groupeChoisi = choix?.entiteId === selection.entiteId ? choix.groupe : undefined;

  const { data: fetched, isError, isLoading, isPlaceholderData } = useErcPositionnement(selection, options, indicateur, groupeChoisi);
  // Réponse affichée une fois le grisé peint : chiffres clés, matrice et tableaux décrivent la même réponse
  const { applied: data, busy } = useRenderTransition(fetched);
  const matrice = data?.periodes ? data : null;
  const disciplineLabel = getDisciplineLabel(selection, disciplines);
  const groupeLibelle = data?.groupes.find(({ code }) => code === data.groupe)?.libelle ?? "";
  const etablissement = selection.entiteId !== ENTITE_NATIONALE;
  const cartes = matrice ? getCartes(matrice, groupeLibelle.toLowerCase()) : [];

  return (
    <>
      <DoubleCompte />
      {!etablissement && (
        <Notice className="fr-mb-4w" closeMode="disallow" type="info">
          Choisissez un établissement dans la sélection pour voir son rang parmi les établissements comparables et le mettre en avant.
        </Notice>
      )}
      {etablissement && matrice && cartes.length === 0 && (
        <Notice className="fr-mb-4w" closeMode="disallow" type="info">
          {`${entiteNom} ne fait pas partie des établissements comparés : choisissez son groupe pour voir son rang.`}
        </Notice>
      )}
      {cartes.length > 0 && matrice && (
        <ChartBusy busy={isPlaceholderData || busy}>
          <Cartes
            cartes={cartes}
            sousTitre={`Bourses ERC : ${getTypesLabel(ercMeta, options.types)} · rang parmi les ${groupeLibelle.toLowerCase()}`}
            titre={`${entiteNom} · appels ${formatPeriode(matrice.periode)} · ${disciplineLabel}`}
          />
        </ChartBusy>
      )}

      <section>
        <Title as="h2" look="h4">Bourses ERC</Title>
        <ParametresErc avecVivier={false} meta={ercMeta} options={options} />
        <ControlesMatrice
          groupe={groupeChoisi ?? data?.groupe}
          groupes={data?.groupes ?? []}
          indicateur={indicateur}
          onGroupe={(groupe) => setChoix({ entiteId: selection.entiteId, groupe })}
          onIndicateur={setIndicateur}
        />
        {isError && <Alert description="La comparaison des établissements n'a pas pu être chargée." title="Erreur de chargement" variant="error" />}
        {!isError && (isLoading || !data) && <DefaultSkeleton height="560px" />}
        {!isError && data && !matrice && (
          <Notice closeMode="disallow" type="info">
            La matrice compare deux périodes d'appels dont les résultats sont publiés : choisissez une période contenant au moins deux de ces années d'appel.
          </Notice>
        )}
        {!isError && matrice && (
          // Grisé pendant l'appel API (réponse précédente affichée) et pendant le redessin
          <ChartBusy busy={isPlaceholderData || busy}>
            <ErcEtablissements data={matrice} disciplineLabel={disciplineLabel} entiteNom={entiteNom} />
          </ChartBusy>
        )}
        <MethodeErc meta={ercMeta} />
      </section>
    </>
  );
}
