// Niveau sélectionné (pilier, programme, thématique, destination) et ses libellés
// Partagé par les routes european-projects qui renvoient un champ "level"
// Niveaux, du plus fin au plus large
// destination_name_fr n'existe pas en base -> destination_name_en pour les deux langues
export const LEVEL_FIELDS = {
  destination: { param: "destinations", sep: ",", code: "destination_code", name_fr: "destination_name_en", name_en: "destination_name_en" },
  topic: { param: "thematics", sep: ",", code: "thema_code", name_fr: "thema_name_fr", name_en: "thema_name_en" },
  program: { param: "programs", sep: "|", code: "programme_code", name_fr: "programme_name_fr", name_en: "programme_name_en" },
  pillar: { param: "pillars", sep: "|", code: "pilier_code", name_fr: "pilier_name_fr", name_en: "pilier_name_en" },
};

// Niveau sélectionné (le plus fin renseigné) + libellés des éléments
// { type: "pillar" | "program" | "topic" | "destination", items: [{ code, name_fr, name_en }] }
// Renvoie null si aucun filtre de niveau ("tous les piliers")
export async function getSelectedLevel(query, collection) {
  const type = Object.keys(LEVEL_FIELDS).find((t) => query[LEVEL_FIELDS[t].param]);
  if (!type) return null;

  const f = LEVEL_FIELDS[type];
  const codes = query[f.param].split(f.sep).filter(Boolean);

  const items = await Promise.all(
    codes.map(async (code) => {
      const doc = await collection.findOne(
        { framework: "Horizon Europe", [f.code]: code },
        { projection: { _id: 0, [f.name_fr]: 1, [f.name_en]: 1 } },
      );
      return {
        code,
        name_fr: doc?.[f.name_fr] ?? null,
        name_en: doc?.[f.name_en] ?? null,
      };
    }),
  );

  return { type, items };
}