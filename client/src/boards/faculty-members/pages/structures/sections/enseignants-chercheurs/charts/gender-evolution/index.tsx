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

        const first = genderEvolution[0];
        const last = genderEvolution[genderEvolution.length - 1];
        const firstFemale = first?.gender_breakdown?.find((g: any) => g.gender === "Féminin")?.count || 0;
        const lastFemale = last?.gender_breakdown?.find((g: any) => g.gender === "Féminin")?.count || 0;
        const firstMale = first?.gender_breakdown?.find((g: any) => g.gender === "Masculin")?.count || 0;
        const lastMale = last?.gender_breakdown?.find((g: any) => g.gender === "Masculin")?.count || 0;
        const diffFemale = lastFemale - firstFemale;
        const diffMale = lastMale - firstMale;
        const pctFemale = firstFemale > 0 ? ((diffFemale / firstFemale) * 100).toFixed(1) : "0";
        const pctMale = firstMale > 0 ? ((diffMale / firstMale) * 100).toFixed(1) : "0";


        return {
            options: createGenderEvolutionOptions(genderEvolution),
            readingKey: {
                fr: (
                    <>
                        Entre <strong>{first._id}</strong> et <strong>{last._id}</strong>,
                        l'effectif enseignants-chercheurs des femmes est passé de{" "}
                        <strong>{firstFemale.toLocaleString("fr-FR")}</strong> à{" "}
                        <strong>{lastFemale.toLocaleString("fr-FR")}</strong> ({diffFemale >= 0 ? "+" : ""}{pctFemale}%).
                        En parallèle, l'effectif enseignants-chercheurs des hommes est passé de{" "}
                        <strong>{firstMale.toLocaleString("fr-FR")}</strong> à{" "}
                        <strong>{lastMale.toLocaleString("fr-FR")}</strong> ({diffMale >= 0 ? "+" : ""}{pctMale}%).
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
