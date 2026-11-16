import { Col, Row } from "@dataesr/dsfr-plus";
import { useMemo } from "react";
import type { ReactNode } from "react";

import type { NuageVivier, NuageVivierPoint } from "../../../../api/erc.ts";
import { getTextesNuage } from "./utils.ts";
import type { AxesNuage } from "./utils.ts";

type QuadrantsVivierProps<P extends NuageVivierPoint> = {
  axes: AxesNuage<P>;
  // Clé d'un point, celle des listes `quadrants` du serveur
  cle: (point: P) => string;
  // En-tête de la première colonne : « Établissement », « Discipline »
  colonne: string;
  data: NuageVivier<P>;
  // Nom du point dans sa ligne (pastille de couleur comprise)
  libelle: (point: P) => ReactNode;
  // Quadrant vide : « Aucun établissement. »
  vide: string;
};

// Tableaux « Qui est dans chaque quadrant ? » : membres et ordre fournis par le serveur, colonnes données par les axes
export default function QuadrantsVivier<P extends NuageVivierPoint>({ axes, cle, colonne, data, libelle, vide }: QuadrantsVivierProps<P>) {
  const pointsByCle = useMemo(() => new Map(data.points.map((p) => [cle(p), p])), [data, cle]);
  const textes = getTextesNuage(data);
  return (
    <>
      <h3 className="fr-h6 fr-mt-4w">Qui est dans chaque quadrant ?</h3>
      <Row gutters>
        {axes.quadrants.map(({ key, titre }) => {
          const membres = data.quadrants[key].flatMap((id) => pointsByCle.get(id) ?? []);
          return (
            <Col xs="12" md="6" key={key}>
              <div className="sr-quadrant fr-background-alt--grey fr-p-3w">
                <h4 className="fr-text--md fr-text--bold fr-mb-0">{`${titre} (${membres.length})`}</h4>
                <p className="fr-text--sm fr-text-mention--grey fr-mb-1w">{axes.definitionQuadrant(key)}</p>
                {membres.length === 0 ? (
                  <p className="fr-text--sm fr-mb-0">{vide}</p>
                ) : (
                  <div className="fr-table fr-table--no-caption fr-mb-0">
                    <table>
                      <caption>{titre}</caption>
                      <thead>
                        <tr>
                          <th scope="col">{colonne}</th>
                          {axes.colonnes.map(({ titre: entete }) => <th key={entete} scope="col">{entete}</th>)}
                          <th scope="col">{textes.taille.colonne}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {membres.map((p) => (
                          <tr key={cle(p)} className={p.fiable ? undefined : "fr-text-mention--grey"}>
                            <th scope="row">
                              {libelle(p)}
                              {!p.fiable && " (peu fiable)"}
                            </th>
                            {axes.colonnes.map(({ titre: entete, valeur }) => <td key={entete}>{valeur(p)}</td>)}
                            <td>{textes.taille.format(p.taille)}</td>
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
