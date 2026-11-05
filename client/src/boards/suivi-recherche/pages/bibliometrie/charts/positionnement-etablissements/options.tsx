import type { PositionnementEtablissements } from "../../../../api";
import getMatriceOptions from "../../../../components/matrice/options.tsx";
import { getNomCourt } from "../../../../components/matrice/utils.tsx";
import { getBiblioMatriceTextes } from "../../matrice-textes.ts";
import { getEtablissementColor, nomCourt } from "./utils.tsx";

// Matrice des établissements : établissement sélectionné mis en avant, étiquette au sigle
export default function getOptions(data: PositionnementEtablissements) {
  return getMatriceOptions(data, {
    textes: getBiblioMatriceTextes(data),
    serie: "Établissements",
    couleur: getEtablissementColor,
    etiquette: (p) => (p.focus ? `<b>${getNomCourt(nomCourt(p), 22)}</b>` : getNomCourt(nomCourt(p), 22)),
    entete: (p) => [`<b>${p.nom}</b>${p.sigle ? ` (${p.sigle})` : ""}`, p.categorie],
    focus: (p) => p.focus,
  });
}
