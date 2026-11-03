import { Alert, SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import { useMemo, useState } from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import ChartBusy from "../../../../components/chart-busy/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import { useBiblioPositionnement } from "../../../../api";
import type { BiblioOptions, Indicateur, Positionnement, Selection } from "../../../../api";
import { useRenderTransition } from "../../../../hooks/use-render-transition";
import { formatPart, formatPeriode, INDICATEUR_LABELS } from "../../../../utils";
import LegendeTailles from "../../components/matrice/legende-tailles.tsx";
import Quadrants from "../../components/matrice/quadrants.tsx";
import getOptions from "./options.tsx";
import { getDomaineColor } from "./utils.tsx";

import "../../components/matrice/styles.scss";

type Point = Positionnement["points"][number];
const cle = (p: Point) => p.discipline_code;
const libelle = (p: Point) => (
  <>
    <span aria-hidden="true" className="sr-quadrant__pastille" style={{ backgroundColor: getDomaineColor(p.domaine_code) }} />
    <abbr title={p.discipline_nom}>{p.discipline_code}</abbr>
    <span className="sr-quadrant__nom">{p.discipline_nom}</span>
  </>
);

type PositionnementProps = {
  entiteNom: string;
  options: BiblioOptions;
  selection: Selection;
};

export default function PositionnementDisciplines({ entiteNom, options, selection }: PositionnementProps) {
  const [indicateur, setIndicateur] = useState<Indicateur>("influence");
  const { data: fetched, isLoading, isError, error, isPlaceholderData } = useBiblioPositionnement(selection, options, indicateur);
  // `data` est la réponse affichée : une nouvelle réponse n'est appliquée qu'une fois le grisé peint,
  // et graphique, légende et tableaux des quadrants décrivent toujours la même réponse
  const { applied: data, busy } = useRenderTransition(fetched);
  const chartOptions = useMemo(() => (data ? getOptions(data) : null), [data]);

  if (selection.anneeDebut === selection.anneeFin) {
    return (
      <Alert
        description="La matrice compare une période de départ et une période d'arrivée : choisissez une période d'au moins deux ans."
        title="Période trop courte"
        variant="info"
      />
    );
  }

  const reference = data?.reference.valeur ?? 0;
  const exclus = data?.exclus ?? [];
  const domaines = [...new Map((data?.points ?? []).map((p) => [p.domaine_code, p.domaine_nom])).entries()];

  const legend = (
    <div className="sr-matrice-legende">
      <ul aria-label="Couleur : domaine ERC">
        {domaines.map(([code, nom]) => (
          <li key={code}>
            <svg aria-hidden="true" height="14" width="14">
              <circle cx="7" cy="7" fill={getDomaineColor(code)} fillOpacity="0.5" r="6" stroke={getDomaineColor(code)} strokeWidth="1.5" />
            </svg>
            {`${nom} (${code})`}
          </li>
        ))}
      </ul>
      {data && <LegendeTailles data={data} />}
    </div>
  );

  return (
    <>
      <SegmentedControl className="fr-segmented--sm fr-mb-2w" label="Indicateur" name="sr-positionnement-indicateur">
        {(Object.keys(INDICATEUR_LABELS) as Indicateur[]).map((key) => (
          <SegmentedElement
            checked={indicateur === key}
            key={key}
            label={INDICATEUR_LABELS[key]}
            onClick={() => setIndicateur(key)}
            value={key}
          />
        ))}
      </SegmentedControl>
      {selection.disciplineCode || selection.domaineCode ? (
        <p className="fr-text--sm fr-text-mention--grey">Chaque point est une discipline : le filtre de discipline ne s'applique pas à cette matrice.</p>
      ) : null}
      {!isError && (isLoading || !data) && <DefaultSkeleton height="560px" />}
      {isError && (
        <Alert description={`La matrice n'a pas pu être calculée (${error?.message}).`} title="Erreur de chargement" variant="error" />
      )}
      {!isError && data && data.points.length === 0 && (
        <Alert description="Aucune discipline représentable pour cette sélection : élargissez la période." title="Aucune donnée" variant="info" />
      )}
      {!isError && data && data.points.length > 0 && (
        // Grisé pendant l'appel API (réponse précédente affichée) et pendant le redessin
        <ChartBusy busy={isPlaceholderData || busy}>
          <ChartWrapper
            config={{
              id: "suivi-recherche-bibliometrie-positionnement",
              title: {
                fr: `${INDICATEUR_LABELS[data.indicateur]} des disciplines · ${entiteNom} · ${formatPeriode(data.periodes.depart)} → ${formatPeriode(data.periodes.arrivee)}`,
                look: "h5" as const,
              },
              comment: {
                fr: (
                  <>
                    {`Horizontal : part mondiale de ${entiteNom} dans la discipline sur ${formatPeriode(data.periodes.arrivee)}. `}
                    {`Ligne pointillée : part de ${entiteNom} toutes disciplines confondues (${formatPart(reference)}) ; à droite, les disciplines où elle fait mieux que sa moyenne. `}
                    {`Vertical : part d'arrivée ÷ part de départ − 1 ; au-dessus de 0, la part progresse. `}
                    {"Chaque bulle est reliée à son code et à son nom abrégé ; nom complet au survol et dans le tableau ci-dessous. "}
                    {data.indicateur === "influence" && " Influence : années consolidées seulement (fenêtre de citation close)."}
                    {data.provisoire && " Attention : la période d'arrivée contient des années provisoires."}
                    {exclus.length > 0 && ` Non représentées (part nulle ou évolution non calculable) : ${exclus.join(", ")}.`}
                  </>
                ),
              },
            }}
            legend={legend}
            options={chartOptions}
          />

          <Quadrants cle={cle} colonne="Discipline" data={data} libelle={libelle} vide="Aucune discipline." />
        </ChartBusy>
      )}
    </>
  );
}
