import { Alert, Col, Row, SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import { useState } from "react";

import ChartWrapper from "../../../../../../components/chart-wrapper/index.tsx";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default.tsx";
import { useBiblioPositionnement } from "../../../../api";
import type { BiblioOptions, Indicateur, Selection } from "../../../../api";
import { formatArticles, formatDynamique, formatPart, formatPeriode, INDICATEUR_LABELS } from "../../../../utils";
import { getDiametre, getDomaineColor, getOptions, getQuadrant, isPlottable, QUADRANTS, SEUIL_FIABILITE, TAILLE_MAX } from "./utils.tsx";

import "./styles.scss";

type PositionnementProps = {
  entiteNom: string;
  options: BiblioOptions;
  selection: Selection;
};

export default function PositionnementDisciplines({ entiteNom, options, selection }: PositionnementProps) {
  const [indicateur, setIndicateur] = useState<Indicateur>("influence");
  const { data, isLoading, isError, error } = useBiblioPositionnement(selection, options, indicateur);

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
  const plottable = data?.points.filter(isPlottable) ?? [];
  const exclus = data?.points.filter((p) => !isPlottable(p) && p.nb_articles > 0) ?? [];
  const domaines = [...new Map(plottable.map((p) => [p.domaine_code, p.domaine_nom])).entries()];
  const zs = plottable.map((p) => p.nb_articles);
  const zMin = Math.min(...zs);
  const zMax = Math.max(...zs);
  // Trois tailles de référence : la plus petite, une intermédiaire, la plus grande
  const tailles = zs.length ? [zMin, Math.round(zMin + (zMax - zMin) / 4), zMax] : [];

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
      {data && tailles.length > 0 && (
        <ul aria-label={`Taille : nombre d'articles sur ${formatPeriode(data.periodes.arrivee)}`}>
          <li className="sr-matrice-legende__titre">{`Taille : articles sur ${formatPeriode(data.periodes.arrivee)}`}</li>
          {tailles.map((z) => {
            const d = getDiametre(z, zMin, zMax);
            return (
              <li key={z}>
                <svg aria-hidden="true" height={TAILLE_MAX + 2} width={d + 2}>
                  <circle cx={d / 2 + 1} cy={TAILLE_MAX / 2 + 1} fill="none" r={d / 2} stroke="currentColor" strokeWidth="1" />
                </svg>
                {formatArticles(z)}
              </li>
            );
          })}
          <li>{`Bulle vide : moins de ${SEUIL_FIABILITE} articles`}</li>
        </ul>
      )}
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
      {isLoading && <DefaultSkeleton height="560px" />}
      {isError && (
        <Alert description={`La matrice n'a pas pu être calculée (${error?.message}).`} title="Erreur de chargement" variant="error" />
      )}
      {data && (
        <>
          <ChartWrapper
            config={{
              id: "suivi-recherche-bibliometrie-positionnement",
              title: {
                fr: `${INDICATEUR_LABELS[indicateur]} des disciplines · ${entiteNom} · ${formatPeriode(data.periodes.depart)} → ${formatPeriode(data.periodes.arrivee)}`,
                look: "h5" as const,
              },
              comment: {
                fr: (
                  <>
                    {`Horizontal : part mondiale de ${entiteNom} dans la discipline sur ${formatPeriode(data.periodes.arrivee)}. `}
                    {`Ligne pointillée : part de ${entiteNom} toutes disciplines confondues (${formatPart(reference)}) ; à droite, les disciplines où elle fait mieux que sa moyenne. `}
                    {`Vertical : part d'arrivée ÷ part de départ − 1 ; au-dessus de 0, la part progresse. `}
                    {"Chaque bulle est reliée à son code et à son nom abrégé ; nom complet au survol et dans le tableau ci-dessous. "}
                    {indicateur === "influence" && " Influence : années consolidées seulement (fenêtre de citation close)."}
                    {data.provisoire && " Attention : la période d'arrivée contient des années provisoires."}
                    {exclus.length > 0 && ` Non représentées (part nulle ou évolution non calculable) : ${exclus.map((p) => p.discipline_code).join(", ")}.`}
                  </>
                ),
              },
            }}
            legend={legend}
            options={getOptions(data)}
          />

          <h3 className="fr-h6 fr-mt-4w">Qui est dans chaque quadrant ?</h3>
          <Row gutters>
            {QUADRANTS.map((quadrant) => {
              const membres = plottable
                .filter((p) => getQuadrant(p, reference) === quadrant.key)
                .sort((a, b) => (b.niveau.valeur ?? 0) - (a.niveau.valeur ?? 0));
              return (
                <Col xs="12" md="6" key={quadrant.key}>
                  <div className={`sr-quadrant sr-quadrant--${quadrant.key}`}>
                    <h4 className="fr-text--md fr-text--bold fr-mb-0">{`${quadrant.titre} (${membres.length})`}</h4>
                    <p className="fr-text--sm fr-text-mention--grey fr-mb-1w">{quadrant.definition}</p>
                    {membres.length === 0 ? (
                      <p className="fr-text--sm fr-mb-0">Aucune discipline.</p>
                    ) : (
                      <table className="sr-quadrant__table">
                        <caption className="fr-sr-only">{quadrant.titre}</caption>
                        <thead>
                          <tr>
                            <th scope="col">Discipline</th>
                            <th scope="col">{`Part ${formatPeriode(data.periodes.arrivee)}`}</th>
                            <th scope="col">Évolution</th>
                            <th scope="col">Articles</th>
                          </tr>
                        </thead>
                        <tbody>
                          {membres.map((p) => (
                            <tr key={p.discipline_code} className={p.nb_articles < SEUIL_FIABILITE ? "sr-quadrant__row--faible" : undefined}>
                              <th scope="row">
                                <span aria-hidden="true" className="sr-quadrant__pastille" style={{ backgroundColor: getDomaineColor(p.domaine_code) }} />
                                <abbr title={p.discipline_nom}>{p.discipline_code}</abbr>
                                <span className="sr-quadrant__nom">{p.discipline_nom}</span>
                              </th>
                              <td>{formatPart(p.niveau.valeur)}</td>
                              <td>{formatDynamique(p.dynamique)}</td>
                              <td>{formatArticles(p.nb_articles)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                </Col>
              );
            })}
          </Row>
        </>
      )}
    </>
  );
}
