import { useMemo } from "react";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { createRatioProfMcfOptions } from "./options";

interface Props {
    cnuGroups: any[];
    selectedYear: string;
}

export default function RatioProfMcfChart({ cnuGroups, selectedYear }: Props) {
    const { options, readingKey } = useMemo(() => {
        const points = (cnuGroups || [])
            .flatMap((g: any) => g.cnuSections || [])
            .map((s: any) => ({
                name: `${s.cnuSectionId} - ${s.cnuSectionLabel}`,
                x: s.categories?.find((c: any) => /conf[eé]rences/i.test(c.categoryName))?.count || 0,
                y: s.categories?.find((c: any) => /professeur/i.test(c.categoryName))?.count || 0,
                sectionTotal: s.totalCount || 0,
            }))
            .filter((p) => p.sectionTotal > 0);

        if (!points.length) return { options: null, readingKey: null };

        const maxValue = Math.max(...points.map((p) => Math.max(p.x, p.y)), 1);
        const aboveDiagonal = points.filter((p) => p.y > p.x).length;

        return {
            options: createRatioProfMcfOptions(points, maxValue),
            readingKey: {
                fr: (
                    <>
                        Sur <strong>{points.length}</strong> sections CNU,{" "}
                        <strong>{aboveDiagonal}</strong> comptent plus de professeurs que de maîtres
                        de conférences (points au-dessus de la diagonale).
                    </>
                ),
            },
        };
    }, [cnuGroups]);

    if (!options) return null;

    return (
        <ChartWrapper
            config={{
                id: "faculty-ratio-prof-mcf-sections",
                title: {
                    fr: `Professeurs et maîtres de conférences par section CNU (${selectedYear})`,
                    size: "h3" as const,
                    look: "h6" as const,
                },
                readingKey,
                comment: {
                    fr: (
                        <>
                            Chaque point représente une section CNU. L'axe horizontal indique le
                            nombre de maîtres de conférences, l'axe vertical le nombre de professeurs.
                            La diagonale en pointillés correspond à autant de professeurs que de
                            maîtres de conférences.
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
