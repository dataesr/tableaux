import { useMemo } from "react";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { createEstablishmentTypeOptions } from "./options";

interface EstablishmentTypeChartProps {
    selectedYear: string;
    establishmentTypeDistribution: any[];
}

export default function EstablishmentTypeChart({
    selectedYear,
    establishmentTypeDistribution,
}: EstablishmentTypeChartProps) {
    const { options } = useMemo(() => {
        if (!establishmentTypeDistribution?.length)
            return { options: null };

        const sorted = [...establishmentTypeDistribution].sort(
            (a: any, b: any) => (b.total_count || 0) - (a.total_count || 0)
        );

        const categories = sorted.map((d: any) => d._id || "Non précisé");
        const data = sorted.map((d: any) => d.total_count || 0);

        return {
            options: createEstablishmentTypeOptions(categories, data),
        };
    }, [establishmentTypeDistribution]);

    if (!options) return null;

    return (
        <ChartWrapper
            config={{
                id: "faculty-establishment-type",
                title: {
                    fr: `Répartition par type d'établissement (${selectedYear})`,
                    look: "h5" as const,
                },
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
