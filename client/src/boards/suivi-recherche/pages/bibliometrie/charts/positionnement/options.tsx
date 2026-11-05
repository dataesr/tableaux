import type { Positionnement } from "../../../../api";
import getMatriceOptions from "../../../../components/matrice/options.tsx";
import { getNomCourt } from "../../../../components/matrice/utils.tsx";
import { getBiblioMatriceTextes } from "../../matrice-textes.ts";
import { getDomaineColor } from "./utils.tsx";

// Matrice des disciplines : couleur par domaine ERC, étiquette « CODE Nom court »
export default function getOptions(data: Positionnement) {
  return getMatriceOptions(data, {
    textes: getBiblioMatriceTextes(data),
    serie: "Disciplines",
    couleur: (p) => getDomaineColor(p.domaine_code),
    etiquette: (p) => `<b>${p.discipline_code}</b> ${getNomCourt(p.discipline_nom)}`,
    entete: (p) => [`<b>${p.discipline_code} · ${p.discipline_nom}</b>`, p.domaine_nom],
  });
}
