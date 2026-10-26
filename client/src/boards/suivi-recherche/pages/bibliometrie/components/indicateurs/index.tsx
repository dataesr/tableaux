import { Badge, Col, Row } from "@dataesr/dsfr-plus";

import type { Indicateurs as IndicateursType, Ratio } from "../../../../api";
import { formatArticles, formatPart } from "../../../../utils";

import "./styles.scss";

const DEFINITIONS = [
  { key: "poids", titre: "Poids", definition: "Part des articles mondiaux" },
  { key: "influence", titre: "Influence", definition: "Part des articles du top 10 % des plus cités" },
  { key: "prestige", titre: "Prestige", definition: "Part des articles parus dans les revues de tête" },
] as const;

type IndicateursProps = {
  data: IndicateursType;
  optionsLabel: string;
  selectionLabel: string;
};

export default function Indicateurs({ data, optionsLabel, selectionLabel }: IndicateursProps) {
  return (
    <section className="sr-indicateurs fr-mb-4w" aria-labelledby="sr-indicateurs-titre">
      <div className="sr-indicateurs__selection">
        <h2 className="fr-h5 fr-mb-0" id="sr-indicateurs-titre">{selectionLabel}</h2>
        <p className="fr-text--sm fr-text-mention--grey fr-mb-0">{optionsLabel}</p>
      </div>
      <Row gutters>
        {DEFINITIONS.map(({ key, titre, definition }) => {
          const ratio: Ratio = data[key];
          return (
            <Col xs="12" md="4" key={key}>
              <div className={`sr-indicateur sr-indicateur--${key}`}>
                <div className="sr-indicateur__header">
                  <h3 className="fr-h6 fr-mb-0">{titre}</h3>
                  {key === "influence" && data.influence_provisoire && (
                    <Badge noIcon size="sm" variant="warning">Provisoire</Badge>
                  )}
                </div>
                <p className="fr-text--sm fr-text-mention--grey fr-mb-0">{definition}</p>
                <p className="fr-h3 fr-mb-0">{formatPart(ratio.valeur)}</p>
                <p className="fr-text--xs fr-text-mention--grey fr-mb-0">
                  {`${formatArticles(ratio.numerateur)} sur ${formatArticles(ratio.denominateur)} articles`}
                </p>
              </div>
            </Col>
          );
        })}
      </Row>
    </section>
  );
}
