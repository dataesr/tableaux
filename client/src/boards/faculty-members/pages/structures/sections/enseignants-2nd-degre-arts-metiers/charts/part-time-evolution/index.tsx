import { useMemo } from "react";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { createPartTimeEvolutionOptions } from "./options";

interface PartTimeEvolutionChartProps {
    quotiteEvolution: any[];
}

export default function PartTimeEvolutionChart({
    quotiteEvolution,
}: PartTimeEvolutionChartProps) {
    const { options, readingKey } = useMemo(() => {
        const options = createPartTimeEvolutionOptions(quotiteEvolution || []);
        if (!options) return { options: null, readingKey: null };

        const rows = [...(quotiteEvolution || [])].sort((a, b) =>
            String(a._id).localeCompare(String(b._id))
        );
        const last = rows[rows.length - 1];
        const rate = (e: any) => {
            let p = 0;
            let t = 0;
            (e?.quotite_breakdown || []).forEach((b: any) => {
                t += b.count || 0;
                if (/partiel/i.test(b.quotite || "")) p += b.count || 0;
            });
            return t > 0 ? (p / t) * 100 : 0;
        };
        const lastRate = rate(last);

        return {
            options,
            readingKey: {
                fr: (
                    <>
                        En <strong>{last?._id}</strong>, <strong>{lastRate.toFixed(1)} %</strong>{" "}
                        des effectifs exercent à temps partiel.
                    </>
                ),
            },
        };
    }, [quotiteEvolution]);

    if (!options) return null;

    return (
        <ChartWrapper
            config={{
                id: "sd-part-time-evolution",
                title: {
                    fr: "Évolution du temps partiel selon le genre",
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
