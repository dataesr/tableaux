import type { PositionnementEtablissements } from "../../../../api";
import { getCssColor } from "../../../../../../utils/colors";

export type EtablissementMatricePoint = PositionnementEtablissements["points"][number];

export const cle = (p: EtablissementMatricePoint) => p.entite_id;

// Nom court d'un établissement : son sigle, sinon son nom
export const nomCourt = (p: EtablissementMatricePoint) => p.sigle ?? p.nom;

export function getEtablissementColor(p: EtablissementMatricePoint): string {
  return getCssColor(p.focus ? "sr-focus" : "sr-etablissement");
}
