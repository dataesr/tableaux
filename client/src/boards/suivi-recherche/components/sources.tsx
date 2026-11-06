import type { ChartConfig } from "../../../components/chart-wrapper/index.tsx";
import type { SourceDonnees } from "../api";

// Sources du serveur → clé `sources` de ChartWrapper, affichée par son pied de graphique (lien, date de mise à jour).
// Une source ne s'écrit jamais en texte libre dans le commentaire.
export function getChartSources(sources: SourceDonnees[]): ChartConfig["sources"] {
  return sources.map(({ date, libelle, url }) => ({
    label: { fr: <>{libelle}</> },
    // Date locale (et non UTC) : le jour affiché est celui de l'extraction
    update: date ? new Date(`${date}T00:00:00`) : undefined,
    url: url ? { fr: url } : undefined,
  }));
}
