import { useMemo, useCallback } from "react";
import { Row, Col } from "@dataesr/dsfr-plus";
import mapDataIE from "../../../../../../assets/regions.json";
import ChartWrapper from "../../../../../../components/chart-wrapper";
import { useFacultyMapData, MapLevel } from "../../api";
import { createFranceMapOptions } from "./options";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import "./styles.scss";

interface FranceMapProps {
    year: string;
    level?: MapLevel;
    onRegionClick?: (geoId: string, geoName: string) => void;
    title?: string;
    asideList?: boolean;
}

export default function FranceMap({
    year,
    level = "region",
    onRegionClick,
    title,
    asideList = false,
}: FranceMapProps) {
    const { data: mapData, isLoading } = useFacultyMapData(year, level);

    const regionMapping = useMemo(() => {
        const mapping: Record<string, string> = {};
        const reverseMapping: Record<string, string> = {};
        (mapDataIE as any).objects?.default?.geometries?.forEach((g: any) => {
            const regId = g.properties?.reg_id;
            if (regId) {
                mapping[regId] = g.properties["hc-key"];
                reverseMapping[g.properties["hc-key"]] = regId;
            }
        });
        return { mapping, reverseMapping };
    }, []);

    const { options, readingKey } = useMemo(() => {
        if (!mapData?.regions?.length) return { options: null, readingKey: undefined };

        const chartData = mapData.regions
            .filter((r: any) => regionMapping.mapping[r.geo_id])
            .map((r: any) => ({
                "hc-key": regionMapping.mapping[r.geo_id],
                name: r.geo_nom,
                value: r.total_count,
                geo_id: r.geo_id,
                male_count: r.male_count,
                female_count: r.female_count,
                male_percent: r.male_percent,
                female_percent: r.female_percent,
            }));

        const maxValue = Math.max(...chartData.map((d: any) => d.value));
        const total = mapData.statistics?.total_count || 0;

        return {
            options: createFranceMapOptions({
                chartData,
                maxValue,
                clickable: !!onRegionClick,
            }),
            readingKey: {
                fr: (
                    <>
                        Les données couvrent{" "}
                        <strong>{mapData.regions.length}</strong> régions pour un
                        total de{" "}
                        <strong>{total.toLocaleString("fr-FR")}</strong>{" "}
                        enseignants. La région correspond au siège de l'établissement.
                        Les territoires non représentés sur la carte (Polynésie française,
                        Nouvelle-Calédonie, autres collectivités d'outre-mer et étranger)
                        peuvent être comptés dans le total sans figurer sur le fond cartographique.
                    </>
                ),
            },
        };
    }, [mapData, regionMapping, onRegionClick]);

    const regionList = useMemo(() => {
        if (!mapData?.regions?.length) return [];
        return [...mapData.regions].sort((a: any, b: any) =>
            (a.geo_nom || "").localeCompare(b.geo_nom || "", "fr", { sensitivity: "base" })
        );
    }, [mapData]);

    const handlePointClick = useCallback(
        (e: any) => {
            if (!onRegionClick) return;
            const point = e?.point;
            const geoId = point?.options?.geo_id || point?.geo_id;
            const geoName = point?.name;
            if (geoId && geoName) {
                onRegionClick(geoId, geoName);
            }
        },
        [onRegionClick]
    );

    const finalOptions = useMemo(() => {
        if (!options) return null;
        if (!onRegionClick) return options;
        return {
            ...options,
            plotOptions: {
                ...options.plotOptions,
                series: {
                    ...options.plotOptions?.series,
                    point: {
                        events: {
                            click: handlePointClick,
                        },
                    },
                },
            },
        };
    }, [options, handlePointClick]);

    if (isLoading) return <DefaultSkeleton height="500px" />;
    if (!finalOptions) return null;

    const chart = (
        <ChartWrapper
            config={{
                id: `faculty-map-france-${level}`,
                title: {
                    fr: title || `Répartition par région du siège de l'établissement (${year})`,
                    look: "h5" as const,
                },
                readingKey,
                sources: [
                    {
                        label: { fr: <>MESRE-DGRH, traitement DND</> },
                        url: {
                            fr: "https://data.enseignementsup-recherche.gouv.fr",
                        },
                    },
                ],
            }}
            options={finalOptions}
            constructorType="mapChart"
        />
    );

    if (!asideList) return chart;

    const total = mapData?.statistics?.total_count || 0;

    return (
        <Row gutters className="fm-map-split">
            <Col xs="12" md="7">
                {chart}
            </Col>
            <Col xs="12" md="5">
                <nav className="fm-map-aside" aria-label="Accès aux régions">
                    <p className="fm-map-aside__total">
                        <strong>{total.toLocaleString("fr-FR")}</strong> enseignants,{" "}
                        {regionList.length} régions
                    </p>
                    <ul className="fm-map-aside__list">
                        {regionList.map((r: any) => {
                            const count = (r.total_count || 0).toLocaleString("fr-FR");
                            const content = (
                                <>
                                    <span className="fm-map-aside__name">{r.geo_nom}</span>
                                    <span className="fm-map-aside__count">{count}</span>
                                </>
                            );
                            return (
                                <li key={r.geo_id}>
                                    {onRegionClick ? (
                                        <button
                                            type="button"
                                            className="fm-map-aside__item fm-map-aside__item--link"
                                            onClick={() => onRegionClick(r.geo_id, r.geo_nom)}
                                        >
                                            {content}
                                        </button>
                                    ) : (
                                        <span className="fm-map-aside__item">{content}</span>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </nav>
            </Col>
        </Row>
    );
}
