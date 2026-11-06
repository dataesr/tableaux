import { Notice } from "@dataesr/dsfr-plus";

// Règle de rattachement d'athena (CONTRAT_DONNEES §2 erc_effectifs) : sans elle, on lirait les chiffres
// d'un établissement comme une part exclusive du total France
export default function DoubleCompte() {
  return (
    <Notice className="fr-mb-4w" closeMode="disallow" type="info">
      <strong>Un même ERC ou un même prix compte pour plusieurs établissements.</strong>
      {" Un projet ou un lauréat est compté pour sa structure et pour toutes les tutelles du laboratoire (RNSR) où il travaille : "
        + "un ERC hébergé par le CNRS dans une unité mixte compte aussi pour chaque université ou école tutelle de l'unité. "
        + "Les chiffres des établissements ne s'additionnent donc pas : leur somme dépasse le total de la France, "
        + "où chacun ne compte qu'une fois."}
    </Notice>
  );
}
