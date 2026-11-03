import { getCssColor } from "../../../../../../utils/colors";

export function getDomaineColor(domaineCode: string): string {
  return getCssColor(`sr-domaine-${domaineCode.toLowerCase()}`);
}
