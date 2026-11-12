export function getLevelFromGeoId({ geoId }: { geoId: string }) {
  let levelLabel = "Commune";
  if (geoId.startsWith("R")) {
    levelLabel = "Région";
  }
  if (geoId.startsWith("D")) {
    levelLabel = "Département";
  }
  if (geoId.startsWith("A")) {
    levelLabel = "Académie";
  }
  if (geoId.startsWith("U")) {
    levelLabel = "Unité urbaine";
  }
  if (geoId.startsWith("P")) {
    levelLabel = "Pays";
  }
  return (
    levelLabel
  );
}

export function getSubLevel({ geoId }: { geoId: string }) {
  if (geoId.startsWith("R")) {
    return "Liste des académies";
  }
  if (geoId.startsWith("D")) {
    return "Liste des communes";
  }
  if (geoId.startsWith("A")) {
    return "Liste des départements";
  }
  if (geoId.startsWith("U")) {
    return "Liste des communes";
  }
  if (geoId.startsWith("P")) {
    return "Liste des régions";
  }

  return "";
}