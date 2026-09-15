import { useMemo } from "react";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { createAgeCategoryHeatmapOptions } from "./options";

interface AgeCategoryHeatmapChartProps {
    categoryDistribution: any[];
    selectedYear: string;
}

export default function AgeCategoryHeatmapChart({
    categoryDistribution,
    selectedYear,
}: AgeCategoryHeatmapChartProps) {
    const options = useMemo(
        () => createAgeCategoryHeatmapOptions(categoryDistribution || []),
        [categoryDistribution]
    );

    if (!options) return null;

    return (
        <ChartWrapper
            config={{
                id: "sd-age-category-heatmap",
                title: {
                    fr: `Tranche d'âge (${selectedYear})`,
                    size: "h2" as const,
                    look: "h6" as const,
                },
                comment: {
                    fr: (
                        <>
                            Répartition des tranches d'âge au sein de chaque catégorie
                            (barres à 100 %).
                        </>
                    ),
                },
                sources: [
                    {
                        label: { fr: <>MESRE-DGRH, traitement DND</> },
                        url: { fr: "https://data.enseignementsup-recherche.gouv.fr" },
                    },
                ],
            }}
            options={options}
        />
    );
}
