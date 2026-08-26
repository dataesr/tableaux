import { useMemo } from "react";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { createCnuTreemapOptions } from "./options";

interface CnuTreemapChartProps {
    selectedYear: string;
    cnuGroups: any[];
}

export default function CnuTreemapChart({
    selectedYear,
    cnuGroups,
}: CnuTreemapChartProps) {
    const { options, largest } = useMemo(() => {
        if (!cnuGroups?.length) return { options: null, largest: null };

        const treemapData = cnuGroups
            .filter((g: any) => (g.totalCount || 0) > 0)
            .map((g: any) => {
                const name = `${g.cnuGroupId} - ${g.cnuGroupLabel}`;
                const maleCount = g.maleCount || 0;
                const femaleCount = g.femaleCount || 0;
                const total = g.totalCount || 0;
                const colorValue = total > 0 ? (femaleCount / total) * 100 : 50;

                return { name, value: total, colorValue, maleCount, femaleCount };
            })
            .sort((a, b) => b.value - a.value);

        const top = treemapData[0];

        return {
            largest: top ? top : null,
            options: createCnuTreemapOptions(treemapData),
        };
    }, [cnuGroups]);

    if (!options) return null;

    return (
        <ChartWrapper
            config={{
                id: "faculty-cnu-treemap",
                title: {
                    fr: `Groupes CNU — Parité (${selectedYear})`,
                    look: "h5" as const,
                },
                comment: {
                    fr: (
                        <>
                            La taille de chaque rectangle est proportionnelle au nombre
                            d'enseignants-chercheurs dans le groupe CNU. La couleur indique
                            la parité : jaune = majorité masculine, gris = parité,
                            rose = majorité féminine.
                        </>
                    ),
                },
                readingKey: largest
                    ? {
                        fr: (
                            <>
                                Le groupe CNU le plus représenté est «{" "}
                                <strong>{largest.name}</strong> » avec{" "}
                                <strong>{largest.value.toLocaleString("fr-FR")}</strong>{" "}
                                enseignants-chercheurs.
                            </>
                        ),
                    }
                    : undefined,
                sources: [
                    {
                        label: { fr: <>MESRE-DGRH, traitement DND</> },
                        url: {
                            fr: "https://data.enseignementsup-recherche.gouv.fr",
                        },
                    },
                ],
            }}
            options={options}
        />
    );
}
