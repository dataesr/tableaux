import { useSearchParams } from "react-router-dom";

// Extra joint organisation avec valeur par défaut
// Si isEjo est coché, seules est extra_joint_organisations ressortent en base
// On veut donc ne pas mettre de filtre s'il withEjo=true
// et bien passer false pour retirer les extra_joint_organisation pour afficher les resultats sans
export function isEjoParam() {
  const [searchParams] = useSearchParams();
  const isEjo = searchParams.get("isEjo") || "true";
  if (isEjo === "false") {
    return "";
  }
  return `isEjo="false"`;
}
