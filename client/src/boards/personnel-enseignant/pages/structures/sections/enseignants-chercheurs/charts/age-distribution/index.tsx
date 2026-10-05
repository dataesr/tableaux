import { useMemo } from "react";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { createAgeDistributionOptions } from "./options";

interface AgeDistributionChartProps {
    ageDistribution: any[];
    selectedYear: string;
}

export default function AgeDistributionChart({
    ageDistribution,
    selectedYear,
}: AgeDistributionChartProps) {
    const title = `Répartition par tranche d'âge et par genre (${selectedYear})`;
    const { options, readingKey } = useMemo(() => {
        if (!ageDistribution?.length) return { options: null, readingKey: null };

        const total = ageDistribution.reduce((s: number, a: any) => s + (a.total || 0), 0);
        const largest = [...ageDistribution].sort((a: any, b: any) => (b.total || 0) - (a.total || 0))[0];
        const largestPct = total > 0 ? ((largest.total / total) * 100).toFixed(1) : "0";

        return {
            options: createAgeDistributionOptions(ageDistribution, title),
            readingKey: {
                fr: (
                    <>
                        En {selectedYear}, la tranche d'âge la plus représentée
                        chez les enseignants-chercheurs est «{" "}
                        <strong>{largest._id}</strong> » avec{" "}
                        <strong>{largest.total.toLocaleString("fr-FR")}</strong>{" "}
                        personnes ({largestPct}% du total).
                    </>
                ),
            },
        };
    }, [ageDistribution, selectedYear, title]);

    if (!options) return null;

    return (
        <ChartWrapper
            config={{
                id: "ec-age-distribution",
                title: {
                    fr: title,
                    size: "h3" as const,
                    look: "h6" as const,
                },
                readingKey: readingKey || undefined,
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
