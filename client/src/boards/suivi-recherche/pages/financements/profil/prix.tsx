import { Alert } from "@dataesr/dsfr-plus";

import DefaultSkeleton from "../../../../../components/charts-skeletons/default.tsx";
import { usePrixIndicateurs } from "../../../api/prix.ts";
import type { PrixIndicateursPeriode } from "../../../api/prix.ts";
import ChartBusy from "../../../components/chart-busy/index.tsx";
import { ENTITE_NATIONALE } from "../../../hooks/use-selection";
import { formatNombre, formatPeriode, getDisciplineLabel } from "../../../utils";
import PrixEvolutionChart from "../charts/prix-evolution/index.tsx";
import Cartes from "../components/cartes/index.tsx";
import type { Carte } from "../components/cartes/index.tsx";
import MethodePrix from "../components/methode-prix/index.tsx";
import { useFinancements } from "../context.ts";
import { formatNonClasses, formatPartTotal } from "../prix.ts";

type Periode = Extract<PrixIndicateursPeriode, { periode: [number, number] }>;

// Une carte par groupe de prix : nominations, détail par prix et, pour un établissement, part du total France
function getCartes(data: Periode): Carte[] {
  return data.groupes.map(({ libelle, nb_laureats: nb, par_prix: parPrix, part }) => {
    const detail = parPrix.map(({ libelle: prix, nb_laureats: n }) => `${prix} : ${formatNombre(n)}`).join(" · ");
    return {
      titre: libelle,
      valeur: formatNombre(nb),
      detail: part ? `${formatPartTotal(part)} · ${detail}` : detail,
      fiable: true,
      provisoire: data.annees_provisoires.length > 0,
    };
  });
}

// Bloc « Prix et distinctions » du profil (en-tête : BlocDispositif) : chiffres clés et nominations par année
export default function PrixProfil() {
  const { disciplines, entiteNom, prixMeta, prixMetaError, selection } = useFinancements();
  const indicateurs = usePrixIndicateurs(selection);
  const data = indicateurs.data?.periode ? indicateurs.data as Periode : null;
  const selectionLabel = data
    ? [entiteNom, formatPeriode(data.periode), getDisciplineLabel(selection, disciplines)].join(" · ")
    : "";
  const notes = data
    ? data.groupes.map(({ libelle, non_classes: nonClasses }) => {
      const texte = formatNonClasses(nonClasses);
      return texte && `${libelle} : ${texte}`;
    }).filter((note): note is string => Boolean(note))
    : [];

  return (
    <>
      {(prixMetaError || indicateurs.isError) && (
        <Alert description="Les prix et distinctions n'ont pas pu être chargés." title="Erreur de chargement" variant="error" />
      )}
      {!prixMetaError && (indicateurs.isLoading || !prixMeta) && <DefaultSkeleton height="160px" label="Chargement des prix" />}
      {indicateurs.data && !indicateurs.data.periode && <p className="fr-text--sm">Aucune année de prix dans la période choisie.</p>}
      {data && prixMeta && (
        <>
          <ChartBusy busy={indicateurs.isPlaceholderData}>
            <Cartes
              cartes={getCartes(data)}
              notes={[
                ...notes,
                ...(data.annees_provisoires.length > 0 ? [`${data.annees_provisoires.join(", ")} : année en cours, prix pas tous recensés.`] : []),
              ]}
              sousTitre={selection.entiteId === ENTITE_NATIONALE
                ? "Nominations par année d'attribution · prix français"
                : "Nominations par année d'attribution · part du total France · un lauréat compte pour toutes ses tutelles"}
              titre={selectionLabel}
              titreAs="h3"
            />
          </ChartBusy>
          <PrixEvolutionChart entiteNom={entiteNom} meta={prixMeta} selection={selection} selectionLabel={selectionLabel} />
          <MethodePrix meta={prixMeta} />
        </>
      )}
    </>
  );
}
