import { Col, Row } from "@dataesr/dsfr-plus";
import { useMemo } from "react";
import type { ReactNode } from "react";

import type { Matrice, MatricePoint } from "../../api";
import { formatDynamique, formatPart, formatPeriode } from "../../utils";
import { getDefinitionQuadrant, getTexteInternational, getTitreQuadrant, QUADRANTS } from "./utils.tsx";
import type { MatriceTextes } from "./utils.tsx";

type QuadrantsProps<P, I extends string> = {
  // Clé d'un point, la même que celle des listes `data.quadrants`
  cle: (point: P & MatricePoint) => string;
  // Intitulé de la première colonne (« Discipline », « Établissement »)
  colonne: string;
  data: Matrice<P, I>;
  // Libellé d'un point dans la première colonne
  libelle: (point: P & MatricePoint) => ReactNode;
  textes: MatriceTextes;
  // Message d'un quadrant vide
  vide: string;
};

// Tableaux « Qui est dans chaque quadrant ? » : membres et ordre fournis par le serveur
export default function Quadrants<P, I extends string>({ cle, colonne, data, libelle, textes, vide }: QuadrantsProps<P, I>) {
  const pointsByCle = useMemo(() => new Map(data.points.map((p) => [cle(p), p])), [cle, data]);
  // Repère international : une colonne dit, en texte, de quel côté de la ligne en pointillés est chaque point
  const { international } = data.references;

  return (
    <>
      <h3 className="fr-h6 fr-mt-4w">Qui est dans chaque quadrant ?</h3>
      <Row gutters>
        {QUADRANTS.map((quadrant) => {
          const membres = data.quadrants[quadrant.key].flatMap((key) => pointsByCle.get(key) ?? []);
          const titre = getTitreQuadrant(quadrant.key, data.references);
          return (
            <Col xs="12" md="6" key={quadrant.key}>
              <div className="sr-quadrant fr-background-alt--grey fr-p-3w">
                <h4 className="fr-text--md fr-text--bold fr-mb-0">{`${titre} (${membres.length})`}</h4>
                <p className="fr-text--sm fr-text-mention--grey fr-mb-1w">{getDefinitionQuadrant(quadrant.key, data.references)}</p>
                {membres.length === 0 ? (
                  <p className="fr-text--sm fr-mb-0">{vide}</p>
                ) : (
                  <div className="fr-table fr-table--no-caption fr-mb-0">
                    <table>
                      <caption>{titre}</caption>
                      <thead>
                        <tr>
                          <th scope="col">{colonne}</th>
                          <th scope="col">{`${textes.niveau} ${formatPeriode(data.periodes.arrivee)}`}</th>
                          <th scope="col">Évolution</th>
                          <th scope="col">{textes.taille.colonne}</th>
                          {international && <th scope="col">À l'international</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {membres.map((p) => (
                          <tr key={cle(p)} className={p.fiable ? undefined : "fr-text-mention--grey"}>
                            <th scope="row">{libelle(p)}</th>
                            <td>{formatPart(p.niveau.valeur)}</td>
                            <td>{formatDynamique(p.dynamique)}</td>
                            <td>{textes.taille.format(p.taille)}</td>
                            {international && <td>{getTexteInternational(data, p)}</td>}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </Col>
          );
        })}
      </Row>
    </>
  );
}
