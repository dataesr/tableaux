import { useMemo } from "react";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { createRatioProfMcfOptions } from "./options";

interface Props {
    cnuGroups: any[];
    selectedYear: string;
}

export default function RatioProfMcfChart({ cnuGroups, selectedYear }: Props) {
    const { options, readingKey } = useMemo(() => {
        if (!cnuGroups?.length) return { options: null, readingKey: null };

        const allSections = cnuGroups.flatMap((g: any) =>
            (g.cnuSections || []).map((s: any) => {
                const prof =
                    s.categories?.find((c: any) =>
                        /professeur/i.test(c.categoryName)
                    )?.count || 0;
                const mcf =
                    s.categories?.find((c: any) =>
                        /conf[eé]rences/i.test(c.categoryName)
                    )?.count || 0;
                return {
                    name: `${s.cnuSectionId} - ${s.cnuSectionLabel}`,
                    x: mcf,
                    y: prof,
                    sectionTotal: s.totalCount || 0,
                };
            })
        );

        const filtered = allSections.filter((s) => s.total > 0);
        const maxValue = Math.max(...filtered.map((d) => Math.max(d.x, d.y)), 1);
        const aboveDiagonal = filtered.filter((s) => s.y > s.x).length;

        return {
            options: createRatioProfMcfOptions(filtered, maxValue),
            readingKey: filtered.length > 0 ? {
                fr: (<>
                    Sur <strong>{filtered.length}</strong> sections CNU,{" "}
                    <strong>{aboveDiagonal}</strong> comptent plus de professeurs que de maîtres
                    de conférences (au-dessus de la diagonale).
                </>),
            } : null,
        };
    }, [cnuGroups]);

    if (!options) return null;

    return (
        <ChartWrapper
            config={{
                id: "faculty-ratio-prof-mcf-sections",
                title: {
                    fr: `Professeurs vs MCF par section CNU (${selectedYear})`,
                    look: "h5" as const,
                },
                readingKey: readingKey || undefined,
                comment: {
                    fr: (
                        <>
                            Chaque point représente une section CNU. L'axe horizontal indique
                            le nombre de maîtres de conférences, l'axe vertical le nombre de
                            professeurs. La diagonale représente l'équilibre Professeurs et assimilés/MCF.
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
