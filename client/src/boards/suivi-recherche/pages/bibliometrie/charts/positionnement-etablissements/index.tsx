import { Alert, Col, Row, SegmentedControl, SegmentedElement, Select, SelectOption } from "@dataesr/dsfr-plus";
import { useMemo, useState } from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import { useBiblioPositionnementEtablissements } from "../../../../api";
import type { BiblioDiscipline, BiblioMeta, BiblioOptions, Indicateur, Selection } from "../../../../api";
import ChartBusy from "../../../../components/chart-busy/index.tsx";
import { useRenderTransition } from "../../../../hooks/use-render-transition";
import { ENTITE_NATIONALE } from "../../../../hooks/use-selection";
import { formatPart, formatPeriode, getDisciplineLabel, INDICATEUR_LABELS } from "../../../../utils";
import LegendeTailles from "../../../../components/matrice/legende-tailles.tsx";
import Quadrants from "../../../../components/matrice/quadrants.tsx";
import { getLectureMatrice } from "../../../../components/matrice/utils.tsx";
import { getChartSources } from "../../../../components/sources.tsx";
import { getBiblioMatriceTextes } from "../../matrice-textes.ts";
import getOptions from "./options.tsx";
import { cle, getEtablissementColor } from "./utils.tsx";
import type { EtablissementMatricePoint } from "./utils.tsx";

import "../../../../components/matrice/styles.scss";

const libelle = (p: EtablissementMatricePoint) => (
  <>
    <svg aria-hidden="true" className="fr-mr-1w" height="10" width="10">
      <circle cx="5" cy="5" fill={getEtablissementColor(p)} r="5" />
    </svg>
    {p.focus ? <strong>{p.nom}</strong> : p.nom}
    {p.sigle && <span className="fr-text-mention--grey">{` ${p.sigle}`}</span>}
  </>
);

type PositionnementEtablissementsProps = {
  disciplines: BiblioDiscipline[];
  entiteNom: string;
  meta: BiblioMeta;
  options: BiblioOptions;
  selection: Selection;
};

export default function PositionnementEtablissements({ disciplines, entiteNom, meta, options, selection }: PositionnementEtablissementsProps) {
  const [indicateur, setIndicateur] = useState<Indicateur>("influence");
  // Groupe choisi par l'utilisateur, pour l'établissement sélectionné à ce moment-là ;
  // sans choix (ou après un changement d'établissement), le serveur prend le groupe de l'établissement
  const [choix, setChoix] = useState<{ entiteId: string; groupe: string } | null>(null);
  const groupe = choix?.entiteId === selection.entiteId ? choix.groupe : undefined;

  const { data: fetched, isLoading, isError, error, isPlaceholderData } = useBiblioPositionnementEtablissements(selection, options, indicateur, groupe);
  // Réponse affichée : appliquée une fois le grisé peint ; graphique, légende et tableaux décrivent la même réponse
  const { applied: data, busy } = useRenderTransition(fetched);
  const chartOptions = useMemo(() => (data && data.points.length > 0 ? getOptions(data) : null), [data]);

  if (selection.anneeDebut === selection.anneeFin) {
    return (
      <Alert
        description="La matrice compare une période de départ et une période d'arrivée : choisissez une période d'au moins deux ans."
        title="Période trop courte"
        variant="info"
      />
    );
  }

  const groupeLibelle = data?.groupes.find((g) => g.code === data.groupe)?.libelle ?? "";
  const selectionAilleurs = data && selection.entiteId !== ENTITE_NATIONALE && data.groupe_selection !== data.groupe;
  const disciplineLabel = getDisciplineLabel(selection, disciplines);
  // Exemple de lecture : l'établissement sélectionné, sinon la plus grosse bulle
  const pointLu = data?.points.find((p) => p.focus) ?? data?.points[0];

  const legend = data && (
    <div className="sr-matrice-legende">
      <ul aria-label="Couleur" className="fr-text--sm fr-mb-0">
        {selection.entiteId !== ENTITE_NATIONALE && data.points.some((p) => p.focus) && (
          <li>
            <svg aria-hidden="true" height="14" width="14">
              <circle cx="7" cy="7" fill="var(--sr-focus)" fillOpacity="0.5" r="5.5" stroke="var(--sr-focus)" strokeWidth="3" />
            </svg>
            {entiteNom}
          </li>
        )}
        <li>
          <svg aria-hidden="true" height="14" width="14">
            <circle cx="7" cy="7" fill="var(--sr-etablissement)" fillOpacity="0.5" r="6" stroke="var(--sr-etablissement)" strokeWidth="1.5" />
          </svg>
          {groupeLibelle}
        </li>
      </ul>
      <LegendeTailles data={data} textes={getBiblioMatriceTextes(data)} />
    </div>
  );

  return (
    <>
      <Row gutters className="fr-mb-1w">
        <Col xs="12" md="6">
          <SegmentedControl className="fr-segmented--sm" label="Indicateur" name="sr-positionnement-etablissements-indicateur">
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
        </Col>
        <Col xs="12" md="6">
          {data && (
            <Select
              label="Établissements comparés"
              onChange={(key) => setChoix({ entiteId: selection.entiteId, groupe: String(key) })}
              value={groupe ?? data.groupe}
            >
              {data.groupes.map((g) => <SelectOption key={g.code}>{`${g.libelle} (${g.nb})`}</SelectOption>)}
            </Select>
          )}
        </Col>
      </Row>
      {selectionAilleurs && (
        <p className="fr-text--sm fr-text-mention--grey">
          {data.groupe_selection
            ? `${entiteNom} n'appartient pas à ce groupe : choisissez son groupe pour le voir parmi les établissements comparables.`
            : "La France n'est pas un établissement : choisissez un établissement dans la sélection pour le mettre en avant."}
        </p>
      )}
      {!isError && (isLoading || !data) && <DefaultSkeleton height="560px" />}
      {isError && (
        <Alert description={`La matrice n'a pas pu être calculée (${error?.message}).`} title="Erreur de chargement" variant="error" />
      )}
      {!isError && data && (
        // Grisé pendant l'appel API (réponse précédente affichée) et pendant le redessin
        <ChartBusy busy={isPlaceholderData || busy}>
          {chartOptions ? (
            <>
              <ChartWrapper
                config={{
                  id: "suivi-recherche-bibliometrie-positionnement-etablissements",
                  title: {
                    fr: `${INDICATEUR_LABELS[data.indicateur]} des établissements · ${groupeLibelle} · ${disciplineLabel} · ${formatPeriode(data.periodes.depart)} → ${formatPeriode(data.periodes.arrivee)}`,
                    look: "h5" as const,
                  },
                  comment: {
                    fr: (
                      <>
                        {`Horizontal : part mondiale de chaque établissement (${disciplineLabel}) sur ${formatPeriode(data.periodes.arrivee)}, en échelle logarithmique. `}
                        {`Ligne pointillée : médiane des établissements représentés (${formatPart(data.reference.valeur)}) ; à droite, ceux qui font mieux que la médiane du groupe. `}
                        {"Vertical : part d'arrivée ÷ part de départ − 1 ; au-dessus de 0, la part progresse. "}
                        {"Étiquette : sigle de l'établissement ; nom complet au survol et dans le tableau ci-dessous. "}
                        {data.indicateur === "influence" && " Influence : années consolidées seulement (fenêtre de citation close)."}
                        {data.provisoire && " Attention : la période d'arrivée contient des années provisoires."}
                        {data.exclus.length > 0 && ` ${data.exclus.length} établissement(s) non représenté(s) : part nulle sur une période ou évolution non calculable.`}
                      </>
                    ),
                  },
                  ...(pointLu && { readingKey: { fr: <>{getLectureMatrice(data, getBiblioMatriceTextes(data), pointLu, pointLu.nom)}</> } }),
                  sources: getChartSources(meta.sources),
                }}
                legend={legend}
                options={chartOptions}
              />
              <Quadrants textes={getBiblioMatriceTextes(data)} cle={cle} colonne="Établissement" data={data} libelle={libelle} vide="Aucun établissement." />
            </>
          ) : (
            <Alert
              description="Aucun établissement de ce groupe n'est représentable pour cette sélection : élargissez la période, la discipline ou changez de groupe."
              title="Aucune donnée"
              variant="info"
            />
          )}
        </ChartBusy>
      )}
    </>
  );
}
