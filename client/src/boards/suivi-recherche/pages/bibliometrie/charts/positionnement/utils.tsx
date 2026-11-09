import { getCssColor } from "../../../../../../utils/colors";

export function getDomaineColor(domaineCode: string): string {
  // Couleurs globales des domaines ERC (client/src/boards/colors.scss), communes avec european-projects
  return getCssColor(`erc-domain-${domaineCode.toLowerCase()}-color`);
}
