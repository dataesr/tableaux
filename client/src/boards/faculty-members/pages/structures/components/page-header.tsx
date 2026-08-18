import { useMemo } from "react";
import { Row, Col, Title, Text, Button } from "@dataesr/dsfr-plus";
import { ViewType } from "../api";
import { getCssColor } from "../../../../../utils/colors";
import "../styles.scss";

const VIEW_BACK_LABELS: Record<ViewType, string> = {
    structure: "Changer d'établissement",
    discipline: "Changer de discipline",
    region: "Changer de région",
    academie: "Changer d'académie",
};

const AGE_COLORS: Record<string, string> = {
    "35 ans et moins": "fm-age-35-et-moins-ec",
    "36 à 55 ans": "fm-age-36-55-ec",
    "56 ans et plus": "fm-age-56-et-plus-ec",
};

const VIEW_NEIGHBOR_LABELS: Record<ViewType, string> = {
    structure: "Établissements de taille comparable",
    discipline: "Disciplines d'effectif comparable",
    region: "Régions d'effectif comparable",
    academie: "Académies d'effectif comparable",
};

function femalePctOf(items: any[]): string {
    const total = items.reduce((s: number, i: any) => s + (i.count || 0), 0);
    const female = items.find((i: any) => i.gender === "Féminin")?.count || 0;
    return total > 0 ? ((female / total) * 100).toFixed(0) : "–";
}

interface PageHeaderProps {
    data: any;
    evolutionData?: any;
    entityName: string;
    selectedId: string;
    selectedYear: string;
    totalCount: number;
    viewType: ViewType;
    onClose: () => void;
    onSelectEntity: (id: string) => void;
}

export default function PageHeader({
    data,
    evolutionData,
    entityName,
    selectedYear,
    totalCount,
    viewType,
    onClose,
    onSelectEntity,
}: PageHeaderProps) {
    const genderDistribution = data?.gender_distribution || [];
    const statusDistribution = data?.status_distribution || [];
    const ageDistribution = data?.age_distribution || [];
    const neighbors = data?.neighbors || [];

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

            <Row gutters className="fr-mb-2w">
                <Col xs="12">
                    <ul className="page-header__stats-list">
                        <li>
                            <div className="fr-card fr-card--shadow fr-px-3v fr-py-2w page-header__stat-card">
                                <div className="page-header__stat-card-content">
                                    <span className="page-header__stat-icon page-header__stat-icon--blue-france" aria-hidden="true">
                                        <span className="fr-icon-team-fill" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <Text size="lg" bold className="fr-mb-0">
                                            {totalCount.toLocaleString("fr-FR")} enseignants en {selectedYear}
                                        </Text>
                                        {trends?.totalPct && (
                                            <Text size="xs" className="fr-mb-0 fr-text-mention--grey">
                                                <span className={`page-header__trend ${Number(trends.totalDiff) >= 0 ? "page-header__trend--up" : "page-header__trend--down"}`}>
                                                    {Number(trends.totalDiff) >= 0 ? "↑" : "↓"} {trends.totalDiff >= 0 ? "+" : ""}{trends.totalPct}%
                                                </span>
                                                {" "}vs {trends.prevYear}
                                            </Text>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </li>
                        <li>
                            <div className="fr-card fr-card--shadow fr-px-3v fr-py-2w page-header__stat-card">
                                <div className="page-header__stat-card-content">
                                    <span className="page-header__stat-icon page-header__stat-icon--pink-tuile" aria-hidden="true">
                                        <span className="fr-icon-user-fill" aria-hidden="true" />
                                    </span>
                                    <div>
                                        <Text size="lg" bold className="fr-mb-0">
                                            {femalePct}% de femmes
                                        </Text>
                                        <Text size="xs" className="fr-mb-0 fr-text-mention--grey">
                                            {femaleCount.toLocaleString("fr-FR")} F · {maleCount.toLocaleString("fr-FR")} H ({malePct}%)
                                            {trends && (
                                                <>
                                                    {" · "}
                                                    <span className={`page-header__trend ${Number(trends.femalePctDiff) >= 0 ? "page-header__trend--up" : "page-header__trend--down"}`}>
                                                        {Number(trends.femalePctDiff) >= 0 ? "↑" : "↓"} {Number(trends.femalePctDiff) >= 0 ? "+" : ""}{trends.femalePctDiff} pts
                                                    </span>
                                                </>
                                            )}
                                        </Text>
                                    </div>
                                </div>
                            </div>
                        </li>
                    </ul>
                </Col>
            </Row>

            <Row gutters>
                <Col xs="12" md="4">
                    <div className="fr-card fr-card--shadow fr-px-3v fr-py-2w page-header__detail-card">
                        <Text size="sm" bold className="fr-mb-1w">Statuts</Text>
                        <ul className="page-header__detail-list">
                            {(() => {
                                const ecCount = statusDistribution.find((s: any) => s._id === "enseignant_chercheur")?.count || 0;
                                const titNonEcCount = statusDistribution.find((s: any) => s._id === "titulaire_non_chercheur")?.count || 0;
                                const nonTitCount = statusDistribution.find((s: any) => s._id === "non_titulaire")?.count || 0;
                                const rows = [
                                    { key: "enseignant_chercheur", label: "Enseignants-chercheurs", count: ecCount },
                                    { key: "titulaire_non_chercheur", label: "Autres permanents", count: titNonEcCount },
                                    { key: "non_titulaire", label: "Non permanents", count: nonTitCount },
                                ];
                                return rows.map(({ key, label, count }) => {
                                    const pct = totalCount > 0 ? ((count / totalCount) * 100).toFixed(0) : "0";
                                    return (
                                        <li key={key} className="page-header__detail-row">
                                            <span className="page-header__detail-label">{label}</span>
                                            <span className="page-header__detail-value">
                                                {count.toLocaleString("fr-FR")}
                                                <span className="page-header__detail-pct"> ({pct}%)</span>
                                            </span>
                                        </li>
                                    );
                                });
                            })()}
                        </ul>
                    </div>
                </Col>

                <Col xs="12" md="4">
                    <div className="fr-card fr-card--shadow fr-px-3v fr-py-2w page-header__detail-card">
                        <Text size="sm" bold className="fr-mb-2w">Répartition par âge</Text>
                        <div className="page-header__age-stacked-bar" role="presentation">
                            {ageDistribution
                                .filter((a: any) => a._id && a._id !== "Non précisé")
                                .map((age: any) => {
                                    const pct = totalCount > 0 ? (age.total / totalCount) * 100 : 0;
                                    return (
                                        <div
                                            key={age._id}
                                            className="page-header__age-stacked-segment"
                                            style={{ flex: pct, backgroundColor: getCssColor(AGE_COLORS[age._id] ?? "blue-france-main-525") }}
                                            aria-hidden="true"
                                        />
                                    );
                                })}
                        </div>
                        <ul className="page-header__detail-list fr-mt-2w">
                            {ageDistribution.map((age: any) => {
                                const pct = totalCount > 0 ? ((age.total / totalCount) * 100).toFixed(0) : "0";
                                const fPct = femalePctOf(age.gender_breakdown || []);
                                return (
                                    <li key={age._id} className="page-header__detail-row">
                                        <span
                                            className="page-header__age-dot"
                                            style={{ backgroundColor: getCssColor(AGE_COLORS[age._id] ?? "blue-france-main-525") }}
                                            aria-hidden="true"
                                        />
                                        <span className="page-header__detail-label">{age._id || "Âge non renseigné"}</span>
                                        <span className="page-header__detail-value">
                                            {age.total.toLocaleString("fr-FR")}
                                            <span className="page-header__detail-pct"> · {pct}% ({fPct}% F)</span>
                                        </span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                </Col>

                <Col xs="12" md="4">
                    <div className="fr-card fr-card--shadow fr-px-3v fr-py-2w page-header__detail-card">
                        <Text size="sm" bold className="fr-mb-1w">{VIEW_NEIGHBOR_LABELS[viewType]}</Text>
                        <ul className="page-header__detail-list">
                            {neighbors.map((item: any, idx: number) => (
                                <li key={item.id || idx}>
                                    <button
                                        type="button"
                                        className={`page-header__neighbor-btn${item.is_current ? " page-header__neighbor-btn--current" : ""}`}
                                        onClick={() => onSelectEntity(item.id)}
                                        disabled={item.is_current}
                                        title={item.is_current ? item.label : `Voir ${item.label}`}
                                    >
                                        <span className="page-header__detail-label">{item.label}</span>
                                        <span className="page-header__detail-value">{item.total.toLocaleString("fr-FR")}</span>
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
