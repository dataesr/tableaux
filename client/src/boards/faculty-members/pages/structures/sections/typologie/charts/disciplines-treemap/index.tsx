import { useMemo } from "react";
import "highcharts/modules/treemap";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { createDisciplinesTreemapOptions } from "./options";
import { formatDisciplineLabel } from "../../../../utils";

interface DisciplinesTreemapChartProps {
    selectedYear: string;
    disciplineDistribution: any[];
}

export default function DisciplinesTreemapChart({
    selectedYear,
    disciplineDistribution,
}: DisciplinesTreemapChartProps) {
    const { options, largest } = useMemo(() => {
        if (!disciplineDistribution?.length) return { options: null, largest: null };

        const treemapData = disciplineDistribution
            .filter((d: any) => (d.total || 0) > 0)
            .map((d: any) => {
                const name = formatDisciplineLabel(
                    d._id?.name || d._id?.discipline_name || "Non précisé"
                );
                const maleCount =
                    d.gender_breakdown?.find((g: any) => g.gender === "Masculin")
                        ?.count || 0;
                const femaleCount =
                    d.gender_breakdown?.find((g: any) => g.gender === "Féminin")
                        ?.count || 0;
                const total = d.total || 0;
                const colorValue =
                    total > 0 ? (femaleCount / total) * 100 : 50;

                return { name, value: total, colorValue, maleCount, femaleCount };
            })
            .sort((a, b) => b.value - a.value);

        const top = treemapData[0];

        return {
            largest: top ? top : null,
            options: createDisciplinesTreemapOptions(treemapData),
        };
    }, [disciplineDistribution]);

    if (!options) return null;

    return (
        <ChartWrapper
            config={{
                id: "faculty-disciplines-treemap",
                title: {
                    fr: `Parité par grande discipline (${selectedYear})`,
                    look: "h5" as const,
                },
                comment: {
                    fr: (
                        <>
                            La taille de chaque rectangle est proportionnelle à l'effectif.
                            La couleur indique la parité : jaune = majorité masculine,
                            gris = équilibre, rose = majorité féminine.
                        </>
                    ),
                },
                readingKey: largest
                    ? {
                        fr: (
                            <>
                                La discipline la plus représentée est «{" "}
                                <strong>{largest.name}</strong> » avec{" "}
                                <strong>{largest.value.toLocaleString("fr-FR")}</strong>{" "}
                                enseignants.
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
