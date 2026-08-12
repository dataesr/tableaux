import { useMemo } from "react";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { createQuotiteByCategoryOptions } from "./options";

interface QuotiteByCategoryChartProps {
    quotiteByCategory: any[];
    selectedYear: string;
}

export default function QuotiteByCategoryChart({
    quotiteByCategory,
    selectedYear,
}: QuotiteByCategoryChartProps) {
    const { options, readingKey } = useMemo(() => {
        const options = createQuotiteByCategoryOptions(quotiteByCategory || []);
        if (!options) return { options: null, readingKey: null };

        let partiel = 0;
        let total = 0;
        (quotiteByCategory || []).forEach((c: any) =>
            (c.quotite_breakdown || []).forEach((b: any) => {
                total += b.count || 0;
                if (/partiel/i.test(b.quotite || "")) partiel += b.count || 0;
            })
        );
        const pct = total > 0 ? (partiel / total) * 100 : 0;

        return {
            options,
            readingKey: {
                fr: (
                    <>
                        En {selectedYear}, <strong>{pct.toFixed(1)} %</strong> des
                        effectifs exercent à temps partiel.
                    </>
                ),
            },
        };
    }, [quotiteByCategory, selectedYear]);

    if (!options) return null;

    return (
        <ChartWrapper
            config={{
                id: "sd-quotite-by-category",
                title: {
                    fr: `Quotité de travail — temps plein / temps partiel (${selectedYear})`,
                    size: "h2" as const,
                    look: "h6" as const,
                },
                readingKey: readingKey || undefined,
                sources: [
                    {
                        label: { fr: <>MESR-SIES, SISE</> },
                        url: { fr: "https://data.enseignementsup-recherche.gouv.fr" },
                    },
                ],
            }}
            options={options}
        />
    );
}
