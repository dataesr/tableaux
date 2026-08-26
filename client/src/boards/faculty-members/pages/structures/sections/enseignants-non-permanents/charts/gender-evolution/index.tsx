import { useMemo } from "react";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { createGenderEvolutionOptions } from "./options";

interface GenderEvolutionChartProps {
    genderEvolution: any[];
}

export default function GenderEvolutionChart({
    genderEvolution,
}: GenderEvolutionChartProps) {
    const { options, readingKey } = useMemo(() => {
        if (!genderEvolution?.length) return { options: null, readingKey: null };

        const share = (e: any) => {
            const f = e?.gender_breakdown?.find((g: any) => g.gender === "Féminin")?.count || 0;
            const m = e?.gender_breakdown?.find((g: any) => g.gender === "Masculin")?.count || 0;
            const t = f + m;
            return t > 0 ? (f / t) * 100 : 0;
        };
        const first = genderEvolution[0];
        const last = genderEvolution[genderEvolution.length - 1];
        const firstShare = share(first);
        const lastShare = share(last);
        const diff = lastShare - firstShare;

        return {
            options: createGenderEvolutionOptions(genderEvolution),
            readingKey: {
                fr: (
                    <>
                        En <strong>{last?._id}</strong>, les femmes représentent{" "}
                        <strong>{lastShare.toFixed(1)} %</strong> des effectifs,
                        contre <strong>{firstShare.toFixed(1)} %</strong> en {first?._id} (
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
                id: "ec-gender-evolution",
                title: {
                    fr: "Évolution de la parité femmes-hommes",
                    size: "h2" as const,
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
