import { useSearchParams } from "react-router-dom";

// Extra joint organisation avec valeur par défaut
export function isEjoParam() {
  const [searchParams] = useSearchParams();
  const isEjo = searchParams.get("isEjo") || "true";
  if (isEjo) {
    return `isEjo=${isEjo}`;
  }
  return "";
}
