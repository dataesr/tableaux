import { useMemo, useState } from "react";
import { SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import ChartWrapper from "../../../../../../../components/chart-wrapper";
import DefaultSkeleton from "../../../../../../../components/charts-skeletons/default";
import type { FmAnalysisConfig, FmMetricConfig } from "../../../../../config/analyses-config";
import {
    createFmSingleOptions,
    createFmVariationOptions,
    createFmStackedOptions,
    createFmStackedAreaOptions,
    createFmBase100Options,
    createFmPyramidOptions,
} from "./options";

interface FmEvolutionChartProps {
    records: Record<string, any>[];
    selectedAnalysis: string;
    allAnalyses: Record<string, FmAnalysisConfig>;
    metricsConfig: Record<string, FmMetricConfig>;
    periodText: string;
    ageClass: string;
    onAgeClassChange: (val: string) => void;
}

const ANALYSIS_COMMENTS: Record<string, string> = {
    "effectif-total": "Nombre total de personnels enseignants, tous statuts confondus.",
    "genre-effectifs": "Effectifs ventilés par genre (femmes et hommes).",
    "statut-effectifs": "Répartition selon trois statuts exclusifs : enseignants-chercheurs (PR + MCF), titulaires non-EC (2nd degré, etc.) et non-permanents (contractuels, ATER, etc.).",
    "age-effectifs": "Répartition par tranche d'âge (≤ 35 ans, 36–55 ans, ≥ 56 ans).",
    "pyramide-ages": "Structure démographique croisant genre et classe d'âge pour l'année sélectionnée. Hommes à gauche, femmes à droite.",
    "effectifs-base100": "Chaque courbe démarre à 100 (= effectif de la première année disponible). Les valeurs suivantes expriment l'évolution relative : 110 = +10 %, 90 = −10 %. Comparaison des trajectoires EC, permanents, non-permanents et effectif total.",
    "taux-feminisation": "Part des femmes dans l'effectif total.",
    "femi-ec": "Part des femmes parmi les seuls enseignants-chercheurs (PR + MCF).",
    "femi-permanents": "Part des femmes parmi les personnels permanents (EC + titulaires non-EC).",
    "femi-non-permanents": "Part des femmes parmi les non-permanents (contractuels, ATER, etc.).",
    "femi-par-statut-base100": "Chaque courbe démarre à 100 (= taux de féminisation de la première année). Une valeur de 115 signifie que le taux a crû de 15 % par rapport à l'année de référence. Compare la vitesse de féminisation entre les différents statuts.",
    "genre-base100": "Chaque courbe démarre à 100 (= effectif de la première année). Permet de comparer la vitesse de croissance des effectifs femmes vs hommes, indépendamment de leurs niveaux absolus.",
    "taux-permanents": "Part des personnels titulaires dans l'effectif total.",
    "taux-ec": "Part des enseignants-chercheurs dans l'effectif total.",
    "taux-ec-sur-permanents": "Part des EC parmi les seuls permanents (hors 2nd degré et assimilés au dénominateur).",
    "effectif-ec-seul": "Effectif des enseignants-chercheurs (PR + MCF et assimilés).",
    "effectif-permanents-seul": "Effectif total des permanents (EC + titulaires non-EC).",
    "statut-base100": "Chaque courbe démarre à 100. Permet de comparer les vitesses d'évolution des EC, permanents et non-permanents, même si leurs effectifs de départ sont très différents.",
    "ec-mcf-pr": "Répartition des EC entre maîtres de conférences (MCF) et professeurs des universités (PR).",
    "effectif-mcf-seul": "Effectif des maîtres de conférences et assimilés.",
    "effectif-pr-seul": "Effectif des professeurs des universités et assimilés.",
    "taux-pr-sur-ec": "Part des PR parmi l'ensemble des enseignants-chercheurs.",
    "femi-mcf": "Part des femmes parmi les MCF et assimilés.",
    "femi-pr": "Part des femmes parmi les PR et assimilés.",
    "femi-mcf-pr-compare": "Chaque courbe démarre à 100 (= taux de féminisation de la première année). Compare la vitesse de féminisation des MCF, des PR et du taux global.",
    "ec-mcf-pr-base100": "Chaque courbe démarre à 100. Compare la vitesse de croissance des effectifs MCF et PR, indépendamment de leurs niveaux de départ.",
    "categories-personnel": "Répartition détaillée en 4 catégories : PR, MCF, titulaires non-EC et non-permanents.",
    "categories-base100": "Chaque courbe démarre à 100 (= effectif de la première année disponible pour cette catégorie). Une valeur de 120 signifie +20 % par rapport au départ. Compare les trajectoires des PR, MCF, titulaires non-EC et non-permanents, même si leurs effectifs de départ sont très différents.",
};

const ANALYSIS_READING_KEYS: Record<string, string> = {
    "effectif-total": "Identifier les ruptures de pente : accélérations de recrutement ou contractions budgétaires.",
    "genre-effectifs": "Un resserrement progressif des deux zones indique une convergence vers la parité. En valeur absolue, observer si les hausses d'effectifs bénéficient autant aux femmes qu'aux hommes.",
    "statut-effectifs": "Un segment « non-permanents » qui gagne en proportion signale une précarisation de la structure enseignante.",
    "age-effectifs": "L'épaississement de la couche ≥ 56 ans traduit un vieillissement ; celui de la couche ≤ 35 ans un rajeunissement par recrutement.",
    "pyramide-ages": "L'asymétrie gauche/droite révèle le déséquilibre de genre par tranche d'âge. Une base large en bas indique un renouvellement générationnel.",
    "effectifs-base100": "Comparer les pentes : la courbe la plus pentue croît le plus vite. Si deux courbes divergent, leurs effectifs évoluent à des rythmes différents. Un indice sous 100 = recul par rapport à la première année.",
    "taux-feminisation": "Une courbe ascendante traduit une féminisation en cours. Un plateau peut signaler un frein structurel.",
    "femi-ec": "Comparer au taux global : un écart marqué et persistant entre les deux signale un plafond de verre spécifique aux EC.",
    "femi-permanents": "Comparer au taux des non-permanents : un écart important indique une féminisation concentrée sur les emplois précaires.",
    "femi-non-permanents": "Un taux stable et élevé indique que les femmes restent plus souvent en poste non-permanent.",
    "femi-par-statut-base100": "La courbe la plus pentue est la catégorie où la féminisation progresse le plus vite. Une convergence des courbes traduit un rattrapage entre statuts.",
    "genre-base100": "Si la courbe « Femmes » domine, leur effectif a crû plus vite que celui des hommes sur la période.",
    "taux-permanents": "Un taux en baisse traduit une précarisation croissante de la structure enseignante.",
    "taux-ec": "Observer si la part des EC recule au profit d'autres statuts (2nd degré, contractuels).",
    "taux-ec-sur-permanents": "Plus ce ratio est élevé, plus les permanents exercent un double mandat enseignement-recherche.",
    "effectif-ec-seul": "Repérer les inflexions : accélérations ou ralentissements du rythme de recrutement d'EC.",
    "effectif-permanents-seul": "Vérifier si la croissance suit celle de l'effectif total ou si la part de permanents se contracte.",
    "statut-base100": "La courbe la plus pentue signale le statut en plus fort développement relatif. Si la courbe des non-permanents monte plus vite, leur poids augmente structurellement.",
    "ec-mcf-pr": "Un segment PR qui s'élargit traduit davantage de promotions ou recrutements au professorat. Un resserrement signale un engorgement.",
    "effectif-mcf-seul": "Le trend reflète les flux de recrutement au 1er poste d'EC. Une baisse peut signaler une raréfaction des postes au concours.",
    "effectif-pr-seul": "La dynamique reflète les promotions HDR et recrutements directs. Croiser avec le taux PR/EC pour contextualiser.",
    "taux-pr-sur-ec": "Un ratio en hausse signifie que les PR pèsent davantage parmi les EC. Un plateau peut masquer un renouvellement générationnel équilibré.",
    "femi-mcf": "Rapprocher de la courbe PR pour quantifier l'écart de féminisation entre les deux corps (plafond de verre).",
    "femi-pr": "C'est historiquement le taux le plus bas. Sa progression traduit un rééquilibrage dans l'accès au grade le plus élevé.",
    "femi-mcf-pr-compare": "L'écart entre MCF et PR quantifie le plafond de verre. Une convergence des courbes indique un rattrapage.",
    "ec-mcf-pr-base100": "Si la courbe PR monte plus vite que MCF, le corps des professeurs se développe proportionnellement plus vite.",
    "categories-personnel": "Observer l'évolution de la composition : une couche « non-permanents » qui croît au détriment des autres signale une précarisation structurelle.",
    "categories-base100": "La courbe la plus pentue identifie la catégorie en plus forte croissance relative. Si PR et MCF divergent, le ratio MCF/PR évolue. Si « non-permanents » monte plus vite que toutes les autres, la structure se précarise.",
};

function getAnalysisComment(key: string, ageClass: string, periodText: string): string {
    let comment = ANALYSIS_COMMENTS[key] || "";
    if (!comment) {
        if (key.startsWith("disc-")) comment = "Répartition femmes/hommes pour cette grande discipline.";
        else if (key.startsWith("cnu-g-")) comment = "Répartition femmes/hommes pour ce groupe CNU.";
        else if (key.startsWith("cnu-s-")) comment = "Répartition femmes/hommes pour cette section CNU.";
        else if (key === "disciplines-evolution") comment = "Effectifs par grande discipline.";
        else if (key === "cnu-groups-evolution") comment = "Effectifs par groupe CNU.";
    }
    if (periodText) comment += ` Période : ${periodText}.`;
    if (ageClass && key !== "pyramide-ages" && key !== "age-effectifs") {
        comment += ` Filtre actif : classe d'âge « ${ageClass} ».`;
    }
    return comment;
}

function getAnalysisReadingKey(key: string, chartType: string, viewMode: string, displayMode: string): string {
    if (chartType === "single" && viewMode === "variation") {
        return "Barres positives = hausse, négatives = baisse par rapport à l'année précédente. La hauteur indique l'ampleur du changement.";
    }
    if ((chartType === "stacked" || chartType === "area") && displayMode === "percentage") {
        return "Chaque année totalise 100 %. Les variations de proportion deviennent visibles indépendamment de l'évolution globale des effectifs.";
    }
    if (key.startsWith("disc-")) {
        return "Comparer la part relative femmes/hommes avec d'autres disciplines pour repérer les écarts de genre disciplinaires.";
    }
    if (key.startsWith("cnu-g-")) {
        return "Observer le ratio femmes/hommes dans ce groupe CNU et le comparer au ratio global des EC.";
    }
    if (key.startsWith("cnu-s-")) {
        return "Observer le ratio femmes/hommes dans cette section CNU.";
    }
    if (key === "disciplines-evolution") {
        return "La taille relative de chaque segment indique le poids de la discipline dans l'effectif total.";
    }
    if (key === "cnu-groups-evolution") {
        return "La taille relative de chaque segment indique le poids du groupe CNU dans l'effectif total.";
    }
    return ANALYSIS_READING_KEYS[key] || "";
}

export default function FmEvolutionChart({
    records,
    selectedAnalysis,
    allAnalyses,
    metricsConfig,
    periodText,
    ageClass,
    onAgeClassChange,
}: FmEvolutionChartProps) {
    const [displayMode, setDisplayMode] = useState<"values" | "percentage">("values");
    const [viewMode, setViewMode] = useState<"evolution" | "variation">("evolution");
    const [pyramidYearIndex, setPyramidYearIndex] = useState<number>(-1);

    const analysisConfig = allAnalyses[selectedAnalysis];

    const chartOptions = useMemo(() => {
        if (!analysisConfig || !records.length) return null;
        const { chartType, metrics } = analysisConfig;

        if (chartType === "pyramid") {
            const idx = pyramidYearIndex >= 0 && pyramidYearIndex < records.length
                ? pyramidYearIndex
                : records.length - 1;
            return createFmPyramidOptions(records[idx]);
        }
        if (chartType === "stacked") {
            return createFmStackedOptions(records, metrics, metricsConfig, displayMode === "percentage");
        }
        if (chartType === "area") {
            return createFmStackedAreaOptions(records, metrics, metricsConfig, displayMode === "percentage");
        }
        if (chartType === "base100") {
            return createFmBase100Options(records, metrics, metricsConfig);
        }
        // single
        const metricKey = metrics[0];
        const config = metricsConfig[metricKey];
        if (!config) return null;
        if (viewMode === "variation") {
            return createFmVariationOptions(records, metricKey, config);
        }
        return createFmSingleOptions(records, metricKey, config);
    }, [analysisConfig, records, metricsConfig, displayMode, viewMode, pyramidYearIndex]);

    if (!analysisConfig) return null;
    if (!chartOptions) return <DefaultSkeleton height="440px" />;

    const { chartType, metrics, label } = analysisConfig;
    const primaryConfig = metricsConfig[metrics[0]];

    const commentText = getAnalysisComment(selectedAnalysis, ageClass, periodText);
    const readingKeyText = getAnalysisReadingKey(selectedAnalysis, chartType, viewMode, displayMode);

    const chartConfig = {
        id: `fm-evolution-${selectedAnalysis}`,
        title: { fr: label, look: "h5" as const },
        comment: commentText ? { fr: <>{commentText}</> } : undefined,
        readingKey: readingKeyText ? { fr: <>{readingKeyText}</> } : undefined,
        sources: [{ label: { fr: <>MESR-SIES, SISE</> }, url: { fr: "https://data.enseignementsup-recherche.gouv.fr" } }],
    };

    return (
        <>
            {chartType === "single" && (
                <div className="fr-mb-2w">
                    <SegmentedControl className="fr-segmented--sm" name="fm-view-mode">
                        <SegmentedElement
                            checked={viewMode === "evolution"}
                            label="Évolution"
                            onClick={() => setViewMode("evolution")}
                            value="evolution"
                        />
                        <SegmentedElement
                            checked={viewMode === "variation"}
                            label="Variation annuelle"
                            onClick={() => setViewMode("variation")}
                            value="variation"
                        />
                    </SegmentedControl>
                </div>
            )}

            {(chartType === "stacked" || chartType === "area") && (
                <div className="fr-mb-2w">
                    <SegmentedControl className="fr-segmented--sm" name="fm-display-mode">
                        <SegmentedElement
                            checked={displayMode === "values"}
                            label="Valeurs"
                            onClick={() => setDisplayMode("values")}
                            value="values"
                        />
                        <SegmentedElement
                            checked={displayMode === "percentage"}
                            label="Répartition %"
                            onClick={() => setDisplayMode("percentage")}
                            value="percentage"
                        />
                    </SegmentedControl>
                </div>
            )}

            {chartType !== "pyramid" && (
                <div className="fr-mb-3w">
                    <SegmentedControl name="fm-age-filter" className="fr-segmented--sm">
                        <SegmentedElement label="Tous âges" value="" checked={ageClass === ""} onClick={() => onAgeClassChange("")} />
                        <SegmentedElement label="≤ 35 ans" value="35 ans et moins" checked={ageClass === "35 ans et moins"} onClick={() => onAgeClassChange("35 ans et moins")} />
                        <SegmentedElement label="36 – 55 ans" value="36 à 55 ans" checked={ageClass === "36 à 55 ans"} onClick={() => onAgeClassChange("36 à 55 ans")} />
                        <SegmentedElement label="≥ 56 ans" value="56 ans et plus" checked={ageClass === "56 ans et plus"} onClick={() => onAgeClassChange("56 ans et plus")} />
                    </SegmentedControl>
                </div>
            )}

            {chartType === "pyramid" && records.length > 1 && (
                <div className="fr-mb-3w">
                    <label className="fr-label fr-text--sm fr-mb-1w" htmlFor="pyramid-year-slider">
                        Année : <strong>{records[pyramidYearIndex >= 0 && pyramidYearIndex < records.length ? pyramidYearIndex : records.length - 1]?.annee_universitaire}</strong>
                    </label>
                    <input
                        id="pyramid-year-slider"
                        type="range"
                        className="fr-range"
                        min={0}
                        max={records.length - 1}
                        step={1}
                        value={pyramidYearIndex >= 0 && pyramidYearIndex < records.length ? pyramidYearIndex : records.length - 1}
                        onChange={(e) => setPyramidYearIndex(Number(e.target.value))}
                    />
                </div>
            )}

            <ChartWrapper config={chartConfig} options={chartOptions} constructorType="chart" />

            {chartType === "single" && viewMode === "evolution" && records.length >= 2 && primaryConfig && (() => {
                const first = records[0];
                const last = records[records.length - 1];
                const v1 = first[metrics[0]];
                const v2 = last[metrics[0]];
                if (typeof v1 !== "number" || typeof v2 !== "number") return null;
                const diff = v2 - v1;
                const isPercent = primaryConfig.format === "percent";
                const formattedDiff = isPercent
                    ? `${diff >= 0 ? "+" : ""}${diff.toFixed(1)}\u00a0pp`
                    : `${diff >= 0 ? "+" : ""}${Math.round(diff).toLocaleString("fr-FR")}`;
                return (
                    <p className="fr-text--xs fr-mt-1w" style={{ color: "var(--text-mention-grey)" }}>
                        De {first.annee_universitaire} à {last.annee_universitaire}&nbsp;:{" "}
                        <strong>{formattedDiff}</strong>
                        {!isPercent && <> (soit {((diff / v1) * 100).toFixed(1)}\u00a0% d'évolution)</>}.
                    </p>
                );
            })()}
        </>
    );
}
