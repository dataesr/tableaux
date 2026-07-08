import { useMemo, useState } from "react";
import { Col, Row, Title } from "@dataesr/dsfr-plus";
import { ViewType, useFacultyResearchTeachers } from "../../api";
import { getCssColor } from "../../../../../../utils/colors";
import MetricCard from "../../components/metric-card";
import TreemapSectionsChart from "./charts/treemap-sections";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import FmMetricDefinitionsTable from "../../../../components/metric-definitions";
import { CNU_SECTIONS } from "../../../definitions/cnu-data";

interface SectionsCnuSectionProps {
    viewType: ViewType;
    selectedId: string;
    selectedYear: string;
}

const AGE_CLASSES = [
    { key: "35 ans et moins", label: "≤ 35 ans", color: "fm-age-35-et-moins-ec" },
    { key: "36 à 55 ans", label: "36 – 55 ans", color: "fm-age-36-55-ec" },
    { key: "56 ans et plus", label: "≥ 56 ans", color: "fm-age-56-et-plus-ec" },
    { key: "Non précisé", label: "Non précisé", color: "blue-france-main-525" },
];

const SCALE_COLORS = Array.from({ length: 14 }, (_, i) => `scale-${i + 1}`);

export default function SectionsCnuSection({ viewType, selectedId, selectedYear }: SectionsCnuSectionProps) {
    const { data: currentData, isLoading } = useFacultyResearchTeachers(viewType, selectedId, selectedYear);
    const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
    console.log("currentData", currentData);
    const sectionEvoMap = useMemo(() => {
        type SectionEvo = {
            total: Array<{ year: string; value: number }>;
            female: Array<{ year: string; value: number }>;
            male: Array<{ year: string; value: number }>;
            age: Record<string, Array<{ year: string; value: number }>>;
        };
        const map = new Map<string, SectionEvo>();
        (currentData?.cnuSectionEvolution || []).forEach((e: any) => {
            const code = e._id?.section_code;
            if (!code) return;
            const yearly = [...(e.yearly || [])].sort((a: any, b: any) =>
                String(a.year).localeCompare(String(b.year))
            );
            const total = yearly.map((y: any) => ({ year: String(y.year), value: y.count || 0 }));
            const female = yearly.map((y: any) => ({
                year: String(y.year),
                value: y.gender_breakdown?.find((g: any) => g.gender === "Féminin")?.count || 0,
            }));
            const male = yearly.map((y: any) => ({
                year: String(y.year),
                value: y.gender_breakdown?.find((g: any) => g.gender === "Masculin")?.count || 0,
            }));
            const age: Record<string, Array<{ year: string; value: number }>> = {};
            AGE_CLASSES.forEach(({ key }) => {
                age[key] = yearly.map((y: any) => ({
                    year: String(y.year),
                    value: y.age_breakdown?.find((a: any) => a.age_class === key)?.count || 0,
                }));
            });
            map.set(code, { total, female, male, age });
        });
        return map;
    }, [currentData]);

    if (isLoading) return <DefaultSkeleton />;
    if (!currentData?.cnuGroups?.length) return null;

    const groups = [...currentData.cnuGroups].sort(
        (a: any, b: any) => (b.totalCount || 0) - (a.totalCount || 0)
    );
    const totalEC = groups.reduce((s: number, g: any) => s + (g.totalCount || 0), 0);
    const pct = (count: number, total: number) =>
        total > 0 ? `${((count / total) * 100).toFixed(1)} %` : "";

    const renderDetailPanel = (section: any, color: string) => {
        const evo = sectionEvoMap.get(section.cnuSectionId);
        const sTotal = section.totalCount || 0;
        return (
            <div className="fr-mb-4w fr-p-3w" style={{ backgroundColor: "var(--background-alt-grey)", borderRadius: "4px", borderLeft: `4px solid ${color}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} className="fr-mb-3w">
                    <Title as="h5" look="h6" className="fr-mb-0">
                        {section.cnuSectionId} — {section.cnuSectionLabel}
                    </Title>
                    <button
                        className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-close-line fr-btn--icon-right"
                        aria-label="Fermer le détail"
                        onClick={() => setSelectedSectionId(null)}
                    >
                        Fermer
                    </button>
                </div>
                <Row gutters className="fr-mb-2w">
                    <Col xs="12" md="4">
                        <MetricCard title="Effectif total" value={sTotal.toLocaleString("fr-FR")} detail={`soit ${pct(sTotal, totalEC)} des enseignants-chercheurs`} color={color} evolutionData={evo?.total} />
                    </Col>
                    <Col xs="12" md="4">
                        <MetricCard title="Femmes" value={(section.femaleCount || 0).toLocaleString("fr-FR")} detail={`${pct(section.femaleCount || 0, sTotal)} de la section`} color={getCssColor("fm-femmes")} evolutionData={evo?.female} />
                    </Col>
                    <Col xs="12" md="4">
                        <MetricCard title="Hommes" value={(section.maleCount || 0).toLocaleString("fr-FR")} detail={`${pct(section.maleCount || 0, sTotal)} de la section`} color={getCssColor("fm-hommes")} evolutionData={evo?.male} />
                    </Col>
                </Row>
                <Row gutters>
                    {AGE_CLASSES.map(({ key, label, color: ageColor }) => {
                        const count = section.ageDistribution?.find((a: any) => a.ageClass === key)?.count || 0;
                        return (
                            <Col xs="12" md="3" key={key}>
                                <MetricCard title={label} value={count.toLocaleString("fr-FR")} detail={`${pct(count, sTotal)} de la section`} color={getCssColor(ageColor)} evolutionData={evo?.age[key]} />
                            </Col>
                        );
                    })}
                </Row>
                {CNU_SECTIONS[String(section.cnuSectionId)] && (
                    <p className="fr-text--sm fr-mt-3w fr-mb-0" style={{ color: "var(--text-mention-grey)" }}>
                        <span className="fr-icon-information-line fr-icon--sm fr-mr-1w" aria-hidden="true" />
                        {CNU_SECTIONS[String(section.cnuSectionId)]}
                    </p>
                )}
            </div>
        );
    };

    return (
        <>
            <div className="section-header fr-mb-5w">
                <Title as="h2" look="h5" id="section-sections-cnu-title" className="section-header__title">
                    Sections CNU
                </Title>
            </div>

            <Row gutters className="fr-mb-5w">
                <Col>
                    <TreemapSectionsChart cnuGroups={currentData.cnuGroups} selectedYear={selectedYear} />
                </Col>
            </Row>

            {groups.map((g: any, gi: number) => {
                const groupColor = getCssColor(SCALE_COLORS[gi % SCALE_COLORS.length]);
                const sections: any[] = [...(g.cnuSections || [])].sort(
                    (a: any, b: any) => (b.totalCount || 0) - (a.totalCount || 0)
                );
                if (!sections.length) return null;

                return (
                    <div key={g.cnuGroupId} className="fr-mb-5w">
                        <Title as="h3" look="h6" className="fr-mb-3w" style={{ borderLeft: `3px solid ${groupColor}`, paddingLeft: "0.75rem" }}>
                            {g.cnuGroupId} — {g.cnuGroupLabel}
                        </Title>

                        {Array.from({ length: Math.ceil(sections.length / 4) }, (_, rowIdx) => {
                            const rowSections = sections.slice(rowIdx * 4, rowIdx * 4 + 4);
                            const rowSelectedSection = rowSections.find((s: any) => s.cnuSectionId === selectedSectionId);

                            return (
                                <div key={rowIdx}>
                                    <Row gutters className="fr-mb-2w">
                                        {rowSections.map((s: any) => {
                                            const sTotal = s.totalCount || 0;
                                            const evo = sectionEvoMap.get(s.cnuSectionId);
                                            const isSelected = selectedSectionId === s.cnuSectionId;
                                            return (
                                                <Col xs="12" md="4" lg="3" key={s.cnuSectionId}>
                                                    <div
                                                        role="button"
                                                        tabIndex={0}
                                                        aria-pressed={isSelected}
                                                        aria-label={`${isSelected ? "Masquer" : "Afficher"} le détail de la section ${s.cnuSectionId}`}
                                                        onClick={() => setSelectedSectionId(isSelected ? null : s.cnuSectionId)}
                                                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedSectionId(isSelected ? null : s.cnuSectionId); } }}
                                                        style={{ cursor: "pointer", outline: isSelected ? `2px solid ${groupColor}` : "none", outlineOffset: "2px", borderRadius: "4px", height: "100%" }}
                                                    >
                                                        <MetricCard
                                                            title={`${s.cnuSectionId} — ${s.cnuSectionLabel}`}
                                                            value={sTotal.toLocaleString("fr-FR")}
                                                            detail={`${pct(sTotal, totalEC)} des enseignants-chercheurs · ${pct(s.femaleCount || 0, sTotal)} de femmes`}
                                                            color={groupColor}
                                                            evolutionData={evo?.total}
                                                        />
                                                    </div>
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                    {rowSelectedSection && renderDetailPanel(rowSelectedSection, groupColor)}
                                </div>
                            );
                        })}
                    </div>
                );
            })}

            <FmMetricDefinitionsTable
                definitionKeys={[
                    "Section CNU",
                    "Groupe CNU",
                    "Enseignant-chercheur (EC)",
                    "Taux de féminisation",
                    "Classe d'\u00e2ge",
                ]}
                extraItems={groups.flatMap((g: any) =>
                    (g.cnuSections || []).map((s: any) => ({
                        title: `${s.cnuSectionId} — ${s.cnuSectionLabel}`,
                        definition: CNU_SECTIONS[String(s.cnuSectionId)] || s.cnuSectionLabel,
                    }))
                )}
            />
        </>
    );
}
