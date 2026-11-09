import { Alert, SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import { useMemo, useState } from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import ChartBusy from "../../../../components/chart-busy/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import { useBiblioPositionnement } from "../../../../api";
import type { BiblioMeta, BiblioOptions, Indicateur, Positionnement, Selection } from "../../../../api";
import { useRenderTransition } from "../../../../hooks/use-render-transition";
import { formatPart, formatPeriode, formatRatio, INDICATEUR_LABELS } from "../../../../utils";
import LegendeTailles from "../../../../components/matrice/legende-tailles.tsx";
import Quadrants from "../../../../components/matrice/quadrants.tsx";
import { getLectureMatrice, getTexteHorsCadre } from "../../../../components/matrice/utils.tsx";
import { getChartSources } from "../../../../components/sources.tsx";
import { getBiblioMatriceTextes } from "../../matrice-textes.ts";
import getOptions from "./options.tsx";
import { getDomaineColor } from "./utils.tsx";

import "../../../../components/matrice/styles.scss";

type Point = Positionnement["points"][number];
const cle = (p: Point) => p.discipline_code;
const libelle = (p: Point) => (
  <>
    <svg aria-hidden="true" className="fr-mr-1w" height="10" width="10">
      <circle cx="5" cy="5" fill={getDomaineColor(p.domaine_code)} r="5" />
    </svg>
    <abbr className="fr-text--bold fr-mr-1w" title={p.discipline_nom}>{p.discipline_code}</abbr>
    <span className="fr-text-mention--grey">{p.discipline_nom}</span>
  </>
);

type PositionnementProps = {
  entiteNom: string;
  meta: BiblioMeta;
  options: BiblioOptions;
  selection: Selection;
};

export default function PositionnementDisciplines({ entiteNom, meta, options, selection }: PositionnementProps) {
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

  const exclus = data?.exclus ?? [];
  const domaines = [...new Map((data?.points ?? []).map((p) => [p.domaine_code, p.domaine_nom])).entries()];

  const legend = (
    <div className="sr-matrice-legende">
      <ul aria-label="Couleur : domaine ERC" className="fr-text--sm fr-mb-0">
        {domaines.map(([code, nom]) => (
          <li key={code}>
            <svg aria-hidden="true" height="14" width="14">
              <circle cx="7" cy="7" fill={getDomaineColor(code)} fillOpacity="0.5" r="6" stroke={getDomaineColor(code)} strokeWidth="1.5" />
            </svg>
            {`${nom} (${code})`}
          </li>
        ))}
      </ul>
      {data && <LegendeTailles data={data} textes={getBiblioMatriceTextes(data)} />}
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
                    {`Vertical : part d'arrivée ÷ part de ${formatPeriode(data.periodes.depart)} − 1. `}
                    {getTexteHorsCadre(data, (p) => p.discipline_code)}
                    {`Ligne verticale en tirets (« ${data.references.niveau.libelle} ») : part de ${entiteNom} toutes disciplines confondues sur ${formatPeriode(data.periodes.arrivee)}, `}
                    {`${formatPart(data.references.niveau.valeur)}${data.references.niveau.ratio ? ` = ${formatRatio(data.references.niveau.ratio, data.indicateur)}` : ""} ; à droite, les disciplines où elle fait mieux que sa moyenne. `}
                    {`Ligne horizontale en trait plein (« ${data.references.dynamique.libelle} ») : 0 % ; au-dessus, la part mondiale de ${entiteNom} dans la discipline progresse, en dessous elle recule. `}
                    {"Chaque bulle est reliée à son code et à son nom abrégé ; nom complet au survol et dans le tableau ci-dessous. "}
                    {data.indicateur === "influence" && " Influence : années consolidées seulement (fenêtre de citation close)."}
                    {data.provisoire && " Attention : la période d'arrivée contient des années provisoires."}
                    {exclus.length > 0 && ` Non représentées (part nulle ou évolution non calculable) : ${exclus.join(", ")}.`}
                  </>
                ),
              },
              // Plus grosse bulle : la discipline qui compte le plus d'articles
              readingKey: { fr: <>{getLectureMatrice(data, getBiblioMatriceTextes(data), data.points[0], data.points[0].discipline_nom)}</> },
              sources: getChartSources(meta.sources),
            }}
            legend={legend}
            options={chartOptions}
          />

          <Quadrants textes={getBiblioMatriceTextes(data)} cle={cle} colonne="Discipline" data={data} libelle={libelle} vide="Aucune discipline." />
        </ChartBusy>
      )}
    </>
  );
}
