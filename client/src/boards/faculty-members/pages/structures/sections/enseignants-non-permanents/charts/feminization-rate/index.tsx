import { useMemo } from "react";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { createFeminizationRateOptions } from "./options";

interface FeminizationRateChartProps {
    genderEvolution: any[];
}

export default function FeminizationRateChart({
    genderEvolution,
}: FeminizationRateChartProps) {
    const { options, readingKey } = useMemo(() => {
        if (!genderEvolution?.length) return { options: null, readingKey: null };

        const rate = (e: any) => {
            const f = e?.gender_breakdown?.find((g: any) => g.gender === "Féminin")?.count || 0;
            const m = e?.gender_breakdown?.find((g: any) => g.gender === "Masculin")?.count || 0;
            const t = f + m;
            return t > 0 ? (f / t) * 100 : 0;
        };
        const first = genderEvolution[0];
        const last = genderEvolution[genderEvolution.length - 1];
        const firstRate = rate(first);
        const lastRate = rate(last);
        const diff = lastRate - firstRate;

        return {
            options: createFeminizationRateOptions(genderEvolution),
            readingKey: {
                fr: (
                    <>
                        En <strong>{last?._id}</strong>, les femmes représentent{" "}
                        <strong>{lastRate.toFixed(1)} %</strong> des effectifs, contre{" "}
                        <strong>{firstRate.toFixed(1)} %</strong> en {first?._id} (
                        {diff >= 0 ? "+" : ""}
                        {diff.toFixed(1)} point{Math.abs(diff) >= 2 ? "s" : ""}).
                    </>
                ),
            },
        };
    }, [genderEvolution]);

    if (!options) return null;

    return (
        <ChartWrapper
            config={{
                id: "np-feminization-rate",
                title: {
                    fr: "Taux de féminisation dans le temps",
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
