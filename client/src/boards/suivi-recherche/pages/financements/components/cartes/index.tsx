import { Badge, Col, Row } from "@dataesr/dsfr-plus";
import { useId } from "react";

export type Carte = {
  // Calcul en toutes lettres : numérateur et dénominateur de chaque ratio
  detail: string;
  fiable: boolean;
  provisoire: boolean;
  titre: string;
  valeur: string;
};

type CartesProps = {
  cartes: Carte[];
  // Mentions sous les cartes (peu fiable, provisoire)
  notes?: string[];
  sousTitre: string;
  titre: string;
  // Niveau du titre du bloc : h2 en tête d'onglet, h3 dans la section d'un dispositif ; les cartes sont un niveau en dessous
  titreAs?: "h2" | "h3";
};

// Chiffres clés d'un onglet, au-dessus des blocs par dispositif
export default function Cartes({ cartes, notes = [], sousTitre, titre, titreAs: Titre = "h2" }: CartesProps) {
  const titreId = useId();
  const TitreCarte = Titre === "h2" ? "h3" : "h4";

  return (
    <section className="fr-mb-6w" aria-labelledby={titreId}>
      <div className="fr-highlight fr-mb-3w">
        <Titre className="fr-h5 fr-mb-0" id={titreId}>{titre}</Titre>
        <p className="fr-text--sm fr-text-mention--grey fr-mb-0">{sousTitre}</p>
      </div>
      <Row gutters>
        {cartes.map(({ titre: titreCarte, valeur, detail, fiable, provisoire }) => (
          <Col xs="12" md="6" lg={cartes.length > 2 ? "3" : "6"} key={titreCarte}>
            <div className="sr-indicateur fr-background-alt--grey fr-p-3w">
              <div className="sr-indicateur__header">
                <TitreCarte className="fr-h6 fr-mb-0">{titreCarte}</TitreCarte>
                {provisoire && <Badge noIcon size="sm" variant="warning">Provisoire</Badge>}
                {!fiable && <Badge noIcon size="sm" variant="info">Peu fiable</Badge>}
              </div>
              <p className="fr-h3 fr-mb-0">{valeur}</p>
              <p className="fr-text--xs fr-text-mention--grey fr-mb-0">{detail}</p>
            </div>
          </Col>
        ))}
      </Row>
      {notes.map((note) => <p className="fr-text--xs fr-text-mention--grey fr-mt-2w fr-mb-0" key={note}>{note}</p>)}
    </section>
  );
}
