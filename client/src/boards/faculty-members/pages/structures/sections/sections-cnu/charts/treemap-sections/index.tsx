import { useMemo } from "react";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { getCssColor } from "../../../../../../../../utils/colors";
import { createTreemapSectionsOptions } from "./options";

const GROUP_COLORS = [
    "scale-1",
    "scale-2",
    "scale-3",
    "scale-4",
    "scale-5",
    "scale-6",
    "scale-7",
    "scale-8",
    "scale-9",
    "scale-10",
    "scale-11",
    "scale-12",
    "scale-13",
    "scale-14",
];

interface Props {
    cnuGroups: any[];
    selectedYear: string;
}

export default function TreemapSectionsChart({ cnuGroups, selectedYear }: Props) {
    const { options, readingKey } = useMemo(() => {
        if (!cnuGroups?.length) return { options: null, readingKey: null };

        const sorted = [...cnuGroups].sort((a, b) => (b.totalCount || 0) - (a.totalCount || 0));
        const totalSections = sorted.reduce((acc, g) => acc + (g.cnuSections?.length || 0), 0);
        const largestGroup = sorted[0];

        const treemapData: Array<{
            id?: string;
            name: string;
            value?: number;
            parent?: string;
            color?: string;
        }> = [];

        sorted.forEach((g, i) => {
            const groupId = `group-${g.cnuGroupId}`;
            treemapData.push({
                id: groupId,
                name: `Grp ${g.cnuGroupId} - ${g.cnuGroupLabel}`,
                color: getCssColor(GROUP_COLORS[i % GROUP_COLORS.length]),
            });

            (g.cnuSections || []).forEach((s: any) => {
                if ((s.totalCount || 0) > 0) {
                    treemapData.push({
                        name: `${s.cnuSectionId} - ${s.cnuSectionLabel}`,
                        value: s.totalCount,
                        parent: groupId,
                    });
                }
            });
        });

        return {
            options: createTreemapSectionsOptions(treemapData),
            readingKey: largestGroup ? {
                fr: (<>
                    <strong>{totalSections}</strong> sections CNU réparties en{" "}
                    <strong>{sorted.length}</strong> groupes. Le groupe le plus important est
                    le <strong>groupe {largestGroup.cnuGroupId}</strong> ({largestGroup.cnuGroupLabel})
                    avec <strong>{(largestGroup.totalCount || 0).toLocaleString("fr-FR")}</strong> enseignants-chercheurs.
                </>),
            } : null,
        };
    }, [cnuGroups]);

    if (!options) return null;

    return (
        <ChartWrapper
            config={{
                id: "faculty-treemap-sections-cnu",
                title: {
                    fr: `Sections CNU groupées par groupe (${selectedYear})`,
                    look: "h5" as const,
                },
                readingKey: readingKey || undefined,
                comment: {
                    fr: (
                        <>
                            Chaque bloc de couleur représente un groupe CNU. Les sous-blocs
                            représentent les sections CNU, dimensionnés proportionnellement
                            à leur effectif.
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
