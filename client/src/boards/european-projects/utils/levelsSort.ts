export type Level = "pillar" | "program" | "topic" | "destination";

// Champs de tri renvoyés par l'API pour chaque niveau (plusieurs = tri successif)
// La route /overview/funding renvoie "sort" à tous les niveaux
export const LEVEL_SORT_FIELDS: Record<Level, string[]> = {
  pillar: ["sort"],
  program: ["sort"],
  topic: ["sort"],
  destination: ["sort"],
};

// Valeurs de tri d'une ligne : champs du niveau, sinon le code
export const getLevelSortValues = (
  item: Record<string, any>,
  groupBy: Level,
  sortFields?: string[],
) => {
  const fields = sortFields ?? LEVEL_SORT_FIELDS[groupBy];
  const values = fields.map((field) => item[field] ?? null);
  return values.every((value) => value === null) ? [item.code ?? null] : values;
};

// Renvoie une copie des lignes triées selon le niveau (les valeurs manquantes vont à la fin)
// numeric: true => "2" < "10" et "1.2" < "1.10"
export function sortByLevel<T extends Record<string, any>>(
  items: T[],
  groupBy: Level,
  sortFields?: string[],
): T[] {
  return [...items].sort((a, b) => {
    const valuesA = getLevelSortValues(a, groupBy, sortFields);
    const valuesB = getLevelSortValues(b, groupBy, sortFields);
    for (let i = 0; i < Math.max(valuesA.length, valuesB.length); i++) {
      const sortA = valuesA[i] ?? null;
      const sortB = valuesB[i] ?? null;
      if (sortA === sortB) continue;
      if (sortA === null) return 1;
      if (sortB === null) return -1;
      const result = String(sortA).localeCompare(String(sortB), undefined, {
        numeric: true,
      });
      if (result !== 0) return result;
    }
    return 0;
  });
}
