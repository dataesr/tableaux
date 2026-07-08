import { useEffect, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Col, Row, Title } from "@dataesr/dsfr-plus";
import { ViewType, useFacultyAnalyses } from "../../api";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { buildAllFmAnalyses, buildAllFmMetricsConfig } from "../../../../config/analyses-config";
import FmAnalysisFilter from "./analysis-filter";
import FmEvolutionChart from "./charts";
import FmMetricDefinitionsTable from "../../../../components/metric-definitions";

const ANALYSIS_DEFINITION_KEYS: Record<string, string[]> = {
    "effectif-total": ["Personnel enseignant"],
    "genre-effectifs": ["Personnel enseignant", "Taux de féminisation"],
    "statut-effectifs": ["Statut : 3 catégories mutuellement exclusives", "Enseignant-chercheur (EC)", "Permanent / Non permanent"],
    "age-effectifs": ["Classe d'âge"],
    "pyramide-ages": ["Classe d'âge", "Taux de féminisation"],
    "effectifs-base100": ["Personnel enseignant", "Statut : 3 catégories mutuellement exclusives", "Enseignant-chercheur (EC)", "Permanent / Non permanent"],
    "taux-feminisation": ["Taux de féminisation"],
    "femi-ec": ["Taux de féminisation", "Enseignant-chercheur (EC)"],
    "femi-permanents": ["Taux de féminisation", "Permanent / Non permanent"],
    "femi-non-titulaires": ["Taux de féminisation"],
    "femi-par-statut-base100": ["Taux de féminisation", "Statut : 3 catégories mutuellement exclusives"],
    "genre-base100": ["Taux de féminisation"],
    "taux-permanents": ["Permanent / Non permanent"],
    "taux-ec": ["Enseignant-chercheur (EC)"],
    "taux-ec-sur-permanents": ["Enseignant-chercheur (EC)"],
    "effectif-ec-seul": ["Enseignant-chercheur (EC)"],
    "effectif-permanents-seul": ["Permanent / Non permanent"],
    "statut-base100": ["Statut : 3 catégories mutuellement exclusives", "Enseignant-chercheur (EC)"],
    "disciplines-evolution": ["Grande discipline"],
    "cnu-groups-evolution": ["Groupe CNU"],
    "ec-mcf-pr": ["Enseignant-chercheur (EC)", "MCF et assimilés", "PR et assimilés"],
    "effectif-mcf-seul": ["MCF et assimilés"],
    "effectif-pr-seul": ["PR et assimilés"],
    "taux-pr-sur-ec": ["Enseignant-chercheur (EC)", "PR et assimilés"],
    "femi-mcf": ["Taux de féminisation", "MCF et assimilés"],
    "femi-pr": ["Taux de féminisation", "PR et assimilés"],
    "femi-mcf-pr-compare": ["Taux de féminisation", "MCF et assimilés", "PR et assimilés"],
    "ec-mcf-pr-base100": ["MCF et assimilés", "PR et assimilés"],
    "categories-personnel": ["Statut : 3 catégories mutuellement exclusives", "MCF et assimilés", "PR et assimilés"],
    "categories-base100": ["Statut : 3 catégories mutuellement exclusives", "MCF et assimilés", "PR et assimilés"],
};

function getAnalysisDefinitionKeys(analysis: string | null): string[] {
    if (!analysis) return [];
    if (ANALYSIS_DEFINITION_KEYS[analysis]) return ANALYSIS_DEFINITION_KEYS[analysis];
    if (analysis.startsWith("disc-")) return ["Grande discipline"];
    if (analysis.startsWith("cnu-g-")) return ["Groupe CNU"];
    if (analysis.startsWith("cnu-s-")) return ["Section CNU"];
    if (analysis.startsWith("taux-age-")) return ["Classe d'âge"];
    return [];
}

interface EvolutionsSectionProps {
    viewType: ViewType;
    selectedId: string;
}

export default function EvolutionsSection({ viewType, selectedId }: EvolutionsSectionProps) {
    const [searchParams, setSearchParams] = useSearchParams();
    const selectedAnalysis = searchParams.get("fmAnalysis") || null;
    const ageClass = searchParams.get("fmAgeClass") || "";

    const { data, isLoading } = useFacultyAnalyses(viewType, selectedId, ageClass || undefined);

    const { analysesWithData, allAnalyses, metricsConfig, records, periodText } = useMemo(() => {
        if (!data?.records?.length) {
            return { analysesWithData: new Set<string>(), allAnalyses: {}, metricsConfig: {}, records: [], periodText: "" };
        }
        const completeRecords = data.records.filter(
            (r: any) => (r.effectif_permanents || 0) > 0 && (r.effectif_non_titulaire || 0) > 0
        );
        if (!completeRecords.length) {
            return { analysesWithData: new Set<string>(), allAnalyses: {}, metricsConfig: {}, records: [], periodText: "" };
        }
        const dataComplete = { ...data, records: completeRecords };
        const analyses = buildAllFmAnalyses(dataComplete);
        const metrics = buildAllFmMetricsConfig(dataComplete);
        const available = new Set<string>();

        Object.entries(analyses).forEach(([key, analysis]) => {
            const hasData = analysis.metrics.some((m) =>
                completeRecords.some((r: any) => r[m] != null && r[m] !== 0)
            );
            if (hasData) available.add(key);
        });

        const years = completeRecords.map((r: any) => r.annee_universitaire).filter(Boolean).sort();
        const period = years.length > 1 ? `${years[0]} — ${years[years.length - 1]}` : years[0] || "";

        return { analysesWithData: available, allAnalyses: analyses, metricsConfig: metrics, records: completeRecords, periodText: period };
    }, [data]);

    useEffect(() => {
        if (analysesWithData.size === 0) return;
        if (selectedAnalysis && analysesWithData.has(selectedAnalysis)) return;
        const first = Array.from(analysesWithData)[0];
        if (!first) return;
        const params = new URLSearchParams(searchParams);
        params.set("fmAnalysis", first);
        setSearchParams(params, { replace: true });
    }, [analysesWithData, selectedAnalysis, searchParams, setSearchParams]);

    const handleSelectAnalysis = (key: string) => {
        const params = new URLSearchParams(searchParams);
        params.set("fmAnalysis", key);
        setSearchParams(params, { replace: true });
    };

    const handleAgeClass = (val: string) => {
        const params = new URLSearchParams(searchParams);
        if (val) params.set("fmAgeClass", val);
        else params.delete("fmAgeClass");
        setSearchParams(params, { replace: true });
    };


    return (
        <>
            <div className="section-header fr-mb-5w">
                <Title as="h2" look="h5" id="section-evolutions-title" className="section-header__title">
                    Analyses et évolutions temporelles
                </Title>
            </div>

            {isLoading && (
                <Row gutters>
                    <Col xs="12" md="4"><DefaultSkeleton height="400px" /></Col>
                    <Col xs="12" md="8"><DefaultSkeleton height="400px" /></Col>
                </Row>
            )}

            {!isLoading && analysesWithData.size === 0 && (
                <div className="fr-alert fr-alert--info">
                    <p>Aucune donnée d'évolution disponible.</p>
                </div>
            )}

            {!isLoading && analysesWithData.size > 0 && (
                <Row gutters className="analyses-row">
                    <Col xs="12" md="4" className="analyses-filter-col">
                        <FmAnalysisFilter
                            allAnalyses={allAnalyses}
                            analysesWithData={analysesWithData}
                            selectedAnalysis={selectedAnalysis && analysesWithData.has(selectedAnalysis) ? selectedAnalysis : null}
                            onSelectAnalysis={handleSelectAnalysis}
                        />
                    </Col>
                    <Col xs="12" md="8">
                        {(!selectedAnalysis || !analysesWithData.has(selectedAnalysis)) ? (
                            <div className="fr-alert fr-alert--info">
                                <p>Sélectionnez une analyse pour afficher le graphique.</p>
                            </div>
                        ) : (
                            <FmEvolutionChart
                                records={records}
                                selectedAnalysis={selectedAnalysis}
                                allAnalyses={allAnalyses}
                                metricsConfig={metricsConfig}
                                periodText={periodText}
                                ageClass={ageClass}
                                onAgeClassChange={handleAgeClass}
                            />
                        )}
                    </Col>
                </Row>
            )}

            <FmMetricDefinitionsTable
                definitionKeys={getAnalysisDefinitionKeys(selectedAnalysis)}
            />
        </>
    );
}

