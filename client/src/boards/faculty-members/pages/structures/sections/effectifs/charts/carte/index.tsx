import { useMemo } from "react";
import mapDataIE from "../../../../../../../../assets/regions.json";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";
import { useFacultyMapData } from "../../../../api";
import { createMapOptions } from "./options";

interface MapChartProps {
    selectedYear: string;
}

export default function MapChart({ selectedYear }: MapChartProps) {
    const { data: mapData, isLoading } = useFacultyMapData(selectedYear);

    const options = useMemo(() => {
        if (!mapData?.regions?.length) return null;

        const regionMapping: Record<string, string> = {};
        (mapDataIE as any).objects?.default?.geometries?.forEach((g: any) => {
            const regId = g.properties?.reg_id;
            if (regId) regionMapping[regId] = g.properties["hc-key"];
        });

        const chartData = mapData.regions
            .filter((r: any) => regionMapping[r.geo_id])
            .map((r: any) => ({
                "hc-key": regionMapping[r.geo_id],
                name: r.geo_nom,
                value: r.total_count,
                male_count: r.male_count,
                female_count: r.female_count,
                male_percent: r.male_percent,
                female_percent: r.female_percent,
            }));

        const maxValue = Math.max(...chartData.map((d: any) => d.value));

        return createMapOptions({ chartData, maxValue });
    }, [mapData]);

    if (isLoading || !options) return null;

    return (
        <ChartWrapper
            config={{
                id: "faculty-map-france",
                title: {
                    fr: `Répartition géographique des enseignants (${selectedYear})`,
                    look: "h5" as const,
                },
                readingKey: mapData?.regions?.length
                    ? {
                        fr: (
                            <>
                                Les données couvrent{" "}
                                <strong>{mapData.regions.length}</strong> régions pour un total
                                de{" "}
                                <strong>
                                    {mapData.statistics?.total_count?.toLocaleString("fr-FR")}
                                </strong>{" "}
                                enseignants.
                            </>
                        ),
                    }
                    : undefined,
                sources: [
                    {
                        label: { fr: <>MESRE-DGRH, traitement DND</> },
                        url: {
                            fr: "https://www.enseignementsup-recherche.gouv.fr/fr/le-systeme-d-information-sur-le-suivi-de-l-etudiant-sise-46229",
                        },
                    },
                ],
            }}
            options={options}
            constructorType="mapChart"
        />
    );
}
