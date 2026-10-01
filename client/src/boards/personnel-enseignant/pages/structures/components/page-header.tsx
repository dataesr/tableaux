import { useMemo } from "react";
import { Row, Col, Title, Text, Button, SegmentedControl, SegmentedElement } from "@dataesr/dsfr-plus";
import { ViewType, FacultyScope } from "../api";
import { getCssColor } from "../../../../../utils/colors";
import DistributionBarChart from "./charts/distribution-bar";
import { AGE_CLASSES } from "../../../config/age-classes";
import "../styles.scss";

const VIEW_BACK_LABELS: Record<ViewType, string> = {
    structure: "Changer d'établissement",
    discipline: "Changer de discipline",
    region: "Changer de région",
    academie: "Changer d'académie",
};

const STATUS_ROWS: { key: string; label: string; color: string }[] = [
    { key: "enseignant_chercheur", label: "Enseignants-chercheurs", color: "fm-statut-ec" },
    { key: "titulaire_non_chercheur", label: "Autres permanents", color: "fm-statut-titulaire" },
    { key: "non_titulaire", label: "Non permanents", color: "fm-statut-non-permanent" },
];

const VIEW_NEIGHBOR_LABELS: Record<ViewType, string> = {
    structure: "Établissements de taille comparable",
    discipline: "Disciplines d'effectif comparable",
    region: "Régions d'effectif comparable",
    academie: "Académies d'effectif comparable",
};

interface PageHeaderProps {
    data: any;
    evolutionData?: any;
    entityName: string;
    selectedId: string;
    selectedYear: string;
    totalCount: number;
    viewType: ViewType;
    scope: FacultyScope;
    onClose: () => void;
    onSelectEntity: (id: string) => void;
    onScopeChange: (scope: FacultyScope) => void;
}

export default function PageHeader({
    data,
    evolutionData,
    entityName,
    selectedYear,
    totalCount,
    viewType,
    scope,
    onClose,
    onSelectEntity,
    onScopeChange,
}: PageHeaderProps) {
    const genderDistribution = data?.gender_distribution || [];
    const statusDistribution = data?.status_distribution || [];
    const ageDistribution = data?.age_distribution || [];
    const neighbors = data?.neighbors || [];
    const ranking = data?.ranking || null;

    const ageSegments = AGE_CLASSES.map(({ key, color }) => {
        const a = ageDistribution.find((x: any) => x._id === key);
        const gb = a?.gender_breakdown || [];
        return {
            name: key,
            value: a?.total || 0,
            color: getCssColor(color),
            female: gb.find((g: any) => g.gender === "Féminin")?.count || 0,
            male: gb.find((g: any) => g.gender === "Masculin")?.count || 0,
        };
    });

    const statusSegments = STATUS_ROWS.map(({ key, label, color }) => {
        const s = statusDistribution.find((x: any) => x._id === key);
        const gb = s?.gender_breakdown || [];
        return {
            name: label,
            value: s?.count || 0,
            color: getCssColor(color),
            female: gb.find((g: any) => g.gender === "Féminin")?.count || 0,
            male: gb.find((g: any) => g.gender === "Masculin")?.count || 0,
        };
    });

    const maleCount =
        genderDistribution.find((g: any) => g._id === "Masculin")?.count || 0;
    const femaleCount =
        genderDistribution.find((g: any) => g._id === "Féminin")?.count || 0;
    const femalePct = totalCount > 0 ? ((femaleCount / totalCount) * 100).toFixed(1) : "0";
    const malePct = totalCount > 0 ? ((maleCount / totalCount) * 100).toFixed(1) : "0";

    const contextInfo = data?.context_info || {};
    const metaItems: string[] = [];
    if (viewType === "structure") {
        if (contextInfo.structure_type) metaItems.push(contextInfo.structure_type);
        if (contextInfo.academie) metaItems.push(`Académie de ${contextInfo.academie}`);
        if (contextInfo.region) metaItems.push(contextInfo.region);
    } else if (viewType === "academie") {
        if (contextInfo.region) metaItems.push(contextInfo.region);
    }

    const trends = useMemo(() => {
        const globalEvo = evolutionData?.global_evolution;
        if (!globalEvo?.length || globalEvo.length < 2) return null;

        const currentYearData = globalEvo.find((e: any) => String(e._id) === selectedYear);
        const currentIdx = globalEvo.indexOf(currentYearData);
        if (!currentYearData || currentIdx < 1) return null;

        const prevYearData = globalEvo[currentIdx - 1];
        const prevTotal = prevYearData?.total || 0;
        const currTotal = currentYearData?.total || 0;
        const totalDiff = currTotal - prevTotal;
        const totalPct = prevTotal > 0 ? ((totalDiff / prevTotal) * 100).toFixed(1) : null;

        const prevFemale = prevYearData?.gender_breakdown?.find((g: any) => g.gender === "Féminin")?.count || 0;
        const currFemale = currentYearData?.gender_breakdown?.find((g: any) => g.gender === "Féminin")?.count || 0;
        const prevFemalePct = prevTotal > 0 ? (prevFemale / prevTotal) * 100 : 0;
        const currFemalePct = currTotal > 0 ? (currFemale / currTotal) * 100 : 0;
        const femalePctDiff = currFemalePct - prevFemalePct;

        const firstYear = globalEvo[0]?._id;
        const lastYear = globalEvo[globalEvo.length - 1]?._id;

        return {
            prevYear: prevYearData._id,
            totalDiff,
            totalPct,
            femalePctDiff: femalePctDiff.toFixed(1),
            yearRange: firstYear && lastYear ? `${firstYear}–${lastYear}` : null,
        };
    }, [evolutionData, selectedYear]);

    return (
        <header className="page-header fr-mb-4w">
            <Row gutters className="fr-grid-row--middle fr-mb-2w">
                <Col xs="12" md="8">
                    <Title as="h1" look="h4" className="fr-mb-0">
                        {entityName}
                    </Title>
                    {metaItems.length > 0 && (
                        <Text size="xs" className="fr-mb-0 fr-text-mention--grey">
                            {metaItems.join(" · ")}
                        </Text>
                    )}
                </Col>
                <Col xs="12" md="4" style={{ display: "flex", justifyContent: "flex-end" }}>
                    <Button
                        variant="tertiary"
                        icon="arrow-go-back-line"
                        iconPosition="left"
                        onClick={onClose}
                    >
                        {VIEW_BACK_LABELS[viewType]}
                    </Button>
                </Col>
            </Row>

            <Row gutters className="fr-grid-row--middle fr-mb-2w">
                <Col xs="12">
                    <p className="fr-text--xs fr-mb-1v fr-text-mention--grey">
                        Champ de population — le total et les répartitions ci-dessous en dépendent
                    </p>
                    <SegmentedControl
                        className="fr-segmented--sm"
                        name="fm-scope"
                        aria-label="Champ de population"
                    >
                        <SegmentedElement
                            checked={scope === "all"}
                            label="Permanents + non permanents"
                            onClick={() => onScopeChange("all")}
                            value="all"
                        />
                        <SegmentedElement
                            checked={scope === "permanents"}
                            label="Permanents seulement"
                            onClick={() => onScopeChange("permanents")}
                            value="permanents"
                        />
                    </SegmentedControl>
                </Col>
            </Row>

            <Row gutters className="page-header__stats-row">
                {/* COLONNE GAUCHE */}
                <Col xs="12" md="4">
                    <div className="page-header__stack">
                        <div className="fr-card fr-card--shadow fr-px-3v fr-py-2w">
                            <div className="page-header__stat-card-content">
                                <span
                                    className="page-header__stat-icon page-header__stat-icon--blue-france"
                                    aria-hidden="true"
                                >
                                    <span className="fr-icon-team-fill" aria-hidden="true" />
                                </span>

                                <div>
                                    <Text size="lg" bold className="fr-mb-0">
                                        {totalCount.toLocaleString("fr-FR")} enseignants en {selectedYear}
                                    </Text>

                                    {trends?.totalPct && (
                                        <Text
                                            size="xs"
                                            className="fr-mb-0 fr-text-mention--grey"
                                        >
                                            <span
                                                className={`page-header__trend ${Number(trends.totalDiff) >= 0
                                                    ? "page-header__trend--up"
                                                    : "page-header__trend--down"
                                                    }`}
                                            >
                                                {Number(trends.totalDiff) >= 0 ? "↑" : "↓"}{" "}
                                                {trends.totalDiff >= 0 ? "+" : ""}
                                                {trends.totalPct}%
                                            </span>{" "}
                                            vs {trends.prevYear}
                                        </Text>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="fr-card fr-card--shadow fr-px-3v fr-py-2w fr-mt-2w">
                            <DistributionBarChart
                                id="fm-status-summary"
                                title="Statuts"
                                segments={statusSegments}
                                description="Répartition des effectifs par statut (enseignants-chercheurs, autres permanents, non-permanents), en part du total, avec le détail femmes-hommes en infobulle."
                            />
                        </div>
                    </div>
                </Col>

                {/* COLONNE MILIEU */}
                <Col xs="12" md="4">
                    <div className="page-header__stack">
                        <div className="fr-card fr-card--shadow fr-px-3v fr-py-2w ">
                            <div className="page-header__stat-card-content">
                                <span
                                    className="page-header__stat-icon page-header__stat-icon--pink-tuile"
                                    aria-hidden="true"
                                >
                                    <span className="fr-icon-user-fill" aria-hidden="true" />
                                </span>

                                <div>
                                    <Text size="lg" bold className="fr-mb-0">
                                        {femalePct}% de femmes
                                    </Text>

                                    <Text
                                        size="xs"
                                        className="fr-mb-0 fr-text-mention--grey"
                                    >
                                        {femaleCount.toLocaleString("fr-FR")} F ·{" "}
                                        {maleCount.toLocaleString("fr-FR")} H ({malePct}%)

                                        {trends && (
                                            <>
                                                {" · "}
                                                <span
                                                    className={`page-header__trend ${Number(trends.femalePctDiff) >= 0
                                                        ? "page-header__trend--up"
                                                        : "page-header__trend--down"
                                                        }`}
                                                >
                                                    {Number(trends.femalePctDiff) >= 0 ? "↑" : "↓"}{" "}
                                                    {Number(trends.femalePctDiff) >= 0 ? "+" : ""}
                                                    {trends.femalePctDiff} pts
                                                </span>
                                            </>
                                        )}
                                    </Text>
                                </div>
                            </div>
                        </div>

                        <div className="fr-card fr-card--shadow fr-px-3v fr-py-2w fr-mt-2w">
                            <DistributionBarChart
                                id="fm-age-summary"
                                title="Répartition par âge"
                                segments={ageSegments}
                                description="Répartition des effectifs par tranche d'âge, en part du total, avec le détail femmes-hommes en infobulle."
                            />
                        </div>
                    </div>
                </Col>

                <Col xs="12" md="4" className="page-header__ranking-col">
                    <div className="fr-card fr-card--shadow fr-px-3v fr-py-2w page-header__ranking-card">
                        <Text size="sm" bold className="fr-mb-1v">
                            {VIEW_NEIGHBOR_LABELS[viewType]}
                        </Text>

                        {ranking && (
                            <Text
                                size="xs"
                                className="fr-mb-2w fr-text-mention--grey"
                            >
                                Rang {ranking.rank} sur {ranking.count} · de{" "}
                                {ranking.min.toLocaleString("fr-FR")} à{" "}
                                {ranking.max.toLocaleString("fr-FR")} enseignants
                            </Text>
                        )}

                        <ul className="page-header__detail-list">
                            {neighbors.map((item: any, idx: number) => (
                                <li key={item.id || idx}>
                                    <button
                                        type="button"
                                        className={`page-header__neighbor-btn${item.is_current
                                            ? " page-header__neighbor-btn--current"
                                            : ""
                                            }`}
                                        onClick={() => onSelectEntity(item.id)}
                                        disabled={item.is_current}
                                        title={
                                            item.is_current
                                                ? item.label
                                                : `Voir ${item.label}`
                                        }
                                    >
                                        <span className="page-header__detail-label">
                                            {item.label}
                                        </span>

                                        <span className="page-header__detail-value">
                                            {item.total.toLocaleString("fr-FR")}
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </Col>
            </Row>
        </header>
    );
}
