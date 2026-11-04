import { Badge, Col, Row } from "@dataesr/dsfr-plus";
import { useId } from "react";

import type { Comptage, ErcIndicateurs } from "../../../../api/erc.ts";
import { formatNombre, formatPart } from "../../../../utils";
import { UNITES } from "../../comptage.ts";

type ChiffresClesProps = {
  // Mode de comptage des effectifs affichés (réponse du serveur)
  comptage: Comptage;
  erc: ErcIndicateurs;
  provisoire: boolean;
  selectionLabel: string;
  seuil: number;
  typesLabel: string;
};

// Chiffres clés de la sélection, au-dessus des blocs par dispositif (ERC pour l'instant ; ANR, IUF, médailles ensuite).
// Chaque ratio est accompagné de son numérateur et de son dénominateur.
export default function ChiffresCles({ comptage, erc, provisoire, selectionLabel, seuil, typesLabel }: ChiffresClesProps) {
  const titreId = useId();
  const unites = UNITES[comptage];
  const cartes = [
    {
      titre: `${unites.Candidatures} ERC`,
      valeur: formatNombre(erc.nb_candidatures),
      detail: `${formatPart(erc.part_candidatures.valeur)} des ${unites.candidatures} ERC (${formatNombre(erc.part_candidatures.numerateur)} / ${formatNombre(erc.part_candidatures.denominateur)})`,
      ratio: false,
    },
    {
      titre: `${unites.Laureats} ERC`,
      valeur: formatNombre(erc.nb_laureats),
      detail: `${formatPart(erc.part_laureats.valeur)} des ${unites.laureats} ERC (${formatNombre(erc.part_laureats.numerateur)} / ${formatNombre(erc.part_laureats.denominateur)})`,
      ratio: false,
    },
    {
      titre: "Taux de succès ERC",
      valeur: formatPart(erc.taux_succes.valeur),
      detail: `${formatNombre(erc.taux_succes.numerateur)} ${unites.laureats} / ${formatNombre(erc.taux_succes.denominateur)} ${unites.candidatures} · ensemble de l'ERC : ${formatPart(erc.taux_succes_reference.valeur)} (${formatNombre(erc.taux_succes_reference.numerateur)} / ${formatNombre(erc.taux_succes_reference.denominateur)})`,
      ratio: true,
    },
  ];

  return (
    <section className="fr-mb-6w" aria-labelledby={titreId}>
      <div className="fr-highlight fr-mb-3w">
        <h2 className="fr-h5 fr-mb-0" id={titreId}>{selectionLabel}</h2>
        <p className="fr-text--sm fr-text-mention--grey fr-mb-0">{`Bourses ERC : ${typesLabel}`}</p>
      </div>
      <Row gutters>
        {cartes.map(({ titre, valeur, detail, ratio }) => (
          <Col xs="12" md="4" key={titre}>
            <div className="sr-indicateur fr-background-alt--grey fr-p-3w">
              <div className="sr-indicateur__header">
                <h3 className="fr-h6 fr-mb-0">{titre}</h3>
                {provisoire && <Badge noIcon size="sm" variant="warning">Provisoire</Badge>}
                {ratio && !erc.fiable && <Badge noIcon size="sm" variant="info">Peu fiable</Badge>}
              </div>
              <p className="fr-h3 fr-mb-0">{valeur}</p>
              <p className="fr-text--xs fr-text-mention--grey fr-mb-0">{detail}</p>
            </div>
          </Col>
        ))}
      </Row>
      {!erc.fiable && (
        <p className="fr-text--xs fr-text-mention--grey fr-mt-2w fr-mb-0">
          {`Moins de ${seuil} ${unites.candidatures} : le taux de succès et les parts varient fortement d'une candidature à l'autre et sont peu fiables.`}
        </p>
      )}
    </section>
  );
}
