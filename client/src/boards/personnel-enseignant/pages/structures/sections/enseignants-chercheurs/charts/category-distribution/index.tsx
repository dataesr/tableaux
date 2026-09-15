import { useMemo } from "react";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { CategoryData, createCategoryDistributionOptions } from "./options";

interface CategoryDistributionChartProps {
    categoryDistribution: CategoryData[];
    selectedYear: string;
}

export default function CategoryDistributionChart({
    categoryDistribution,
    selectedYear,
}: CategoryDistributionChartProps) {
    const categoryData = useMemo(() => {
        if (!categoryDistribution?.length) return null;
        return [...categoryDistribution].sort((a, b) => b.totalCount - a.totalCount);
    }, [categoryDistribution]);

    const options = useMemo(() => {
        if (!categoryData) return null;
        return createCategoryDistributionOptions(categoryData);
    }, [categoryData]);

    const readingKey = useMemo(() => {
        if (!categoryData?.length) return null;
        const largest = categoryData[0];
        return (
            <>
                Pour l'année universitaire {selectedYear}, la catégorie la plus
                représentée est "<strong>{largest.categoryName}</strong>" avec{" "}
                <strong>{largest.totalCount.toLocaleString("fr-FR")}</strong> personnes,
                dont <strong>{largest.femaleCount.toLocaleString("fr-FR")}</strong>{" "}
                femmes et{" "}
                <strong>{largest.maleCount.toLocaleString("fr-FR")}</strong> hommes.
            </>
        );
    }, [categoryData, selectedYear]);

    if (!options) return null;

    return (
        <ChartWrapper
            config={{
                id: "category-distribution",
                title: {
                    fr: `Répartition par catégorie et par genre (${selectedYear})`,
                    size: "h2" as const,
                    look: "h6" as const,
                },
                readingKey: readingKey ? { fr: readingKey } : undefined,
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
