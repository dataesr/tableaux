// utils/years.ts
// Renvoie le texte de période à insérer dans un readingKey (chaîne vide si aucun filtre)
export const getYearsLabel = (
  rangeOfYears: string | null,
  lang: "fr" | "en" = "fr",
): string => {
  const years = rangeOfYears
    ? rangeOfYears
        .split("|")
        .map((y) => y.trim())
        .filter(Boolean)
        .sort()
    : [];
  if (years.length === 0) return "";

  const first = years[0];
  const last = years[years.length - 1];
  const isContiguous =
    years.length > 1 && Number(last) - Number(first) === years.length - 1;
  const isFr = lang === "fr";

  if (years.length === 1) return isFr ? ` en ${first}` : ` in ${first}`;
  if (isContiguous)
    return isFr ? ` de ${first} à ${last}` : ` over ${first}-${last}`;
  return isFr
    ? ` pour ${years.join(", ")}`
    : ` over the years ${years.join(", ")}`;
};
