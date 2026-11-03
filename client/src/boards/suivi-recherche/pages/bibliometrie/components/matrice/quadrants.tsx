import { Col, Row } from "@dataesr/dsfr-plus";
import { useMemo } from "react";
import type { ReactNode } from "react";

import type { Matrice, MatricePoint } from "../../../../api";
import { formatArticles, formatDynamique, formatPart, formatPeriode } from "../../../../utils";
import { QUADRANTS } from "./utils.tsx";

type QuadrantsProps<P> = {
  // Clé d'un point, la même que celle des listes `data.quadrants`
  cle: (point: P & MatricePoint) => string;
  // Intitulé de la première colonne (« Discipline », « Établissement »)
  colonne: string;
  data: Matrice<P>;
  // Libellé d'un point dans la première colonne
  libelle: (point: P & MatricePoint) => ReactNode;
  // Message d'un quadrant vide
  vide: string;
};

// Tableaux « Qui est dans chaque quadrant ? » : membres et ordre fournis par le serveur
export default function Quadrants<P>({ cle, colonne, data, libelle, vide }: QuadrantsProps<P>) {
  const pointsByCle = useMemo(() => new Map(data.points.map((p) => [cle(p), p])), [cle, data]);

  return (
    <>
      <h3 className="fr-h6 fr-mt-4w">Qui est dans chaque quadrant ?</h3>
      <Row gutters>
        {QUADRANTS.map((quadrant) => {
          const membres = data.quadrants[quadrant.key].flatMap((key) => pointsByCle.get(key) ?? []);
          return (
            <Col xs="12" md="6" key={quadrant.key}>
              <div className={`sr-quadrant sr-quadrant--${quadrant.key}`}>
                <h4 className="fr-text--md fr-text--bold fr-mb-0">{`${quadrant.titre} (${membres.length})`}</h4>
                <p className="fr-text--sm fr-text-mention--grey fr-mb-1w">{quadrant.definition}</p>
                {membres.length === 0 ? (
                  <p className="fr-text--sm fr-mb-0">{vide}</p>
                ) : (
                  <table className="sr-quadrant__table">
                    <caption className="fr-sr-only">{quadrant.titre}</caption>
                    <thead>
                      <tr>
                        <th scope="col">{colonne}</th>
                        <th scope="col">{`Part ${formatPeriode(data.periodes.arrivee)}`}</th>
                        <th scope="col">Évolution</th>
                        <th scope="col">Articles</th>
                      </tr>
                    </thead>
                    <tbody>
                      {membres.map((p) => (
                        <tr key={cle(p)} className={p.fiable ? undefined : "sr-quadrant__row--faible"}>
                          <th scope="row">{libelle(p)}</th>
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
  );
}
