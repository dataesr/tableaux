import { useMemo, useState } from "react";
import { Col, Row, Title, Text } from "@dataesr/dsfr-plus";
import { ViewType, useFacultyResearchTeachers } from "../../api";
import { getCssColor } from "../../../../../../utils/colors";
import MetricCard from "../../components/metric-card";
import TreemapSectionsChart from "./charts/treemap-sections";

import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import FmMetricDefinitionsTable from "../../../../components/metric-definitions";
import { CNU_GROUPS } from "../../../definitions/cnu-data";

interface GroupesCnuSectionProps {
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

export default function GroupesCnuSection({ viewType, selectedId, selectedYear }: GroupesCnuSectionProps) {
    const { data: currentData, isLoading } = useFacultyResearchTeachers(viewType, selectedId, selectedYear);
    const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

    const groupEvoMap = useMemo(() => {
        type GroupEvo = {
            total: Array<{ year: string; value: number }>;
            female: Array<{ year: string; value: number }>;
            male: Array<{ year: string; value: number }>;
            age: Record<string, Array<{ year: string; value: number }>>;
        };
        const map = new Map<string, GroupEvo>();
        (currentData?.cnuGroupEvolution || []).forEach((e: any) => {
            const code = e._id?.group_code;
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

    return (
        <>
            <div className="section-header fr-mb-5w">
                <Title as="h2" look="h5" id="section-groupes-cnu-title" className="section-header__title">
                    Groupes CNU
                </Title>
            </div>

            {Array.from({ length: Math.ceil(groups.length / 4) }, (_, rowIdx) => {
                const rowGroups: any[] = groups.slice(rowIdx * 4, rowIdx * 4 + 4);
                const rowSelectedGroup = rowGroups.find((g: any) => g.cnuGroupId === selectedGroupId);

                return (
                    <div key={rowIdx}>
                        <Row gutters className="fr-mb-2w">
                            {rowGroups.map((g: any, i: number) => {
                                const globalIdx = rowIdx * 4 + i;
                                const total = g.totalCount || 0;
                                const color = getCssColor(SCALE_COLORS[globalIdx % SCALE_COLORS.length]);
                                const evo = groupEvoMap.get(g.cnuGroupId);
                                const isSelected = selectedGroupId === g.cnuGroupId;

                                return (
                                    <Col xs="12" md="4" lg="3" key={g.cnuGroupId}>
                                        <div
                                            role="button"
                                            tabIndex={0}
                                            aria-pressed={isSelected}
                                            aria-label={`${isSelected ? "Masquer" : "Afficher"} le détail du groupe ${g.cnuGroupId}`}
                                            onClick={() => setSelectedGroupId(isSelected ? null : g.cnuGroupId)}
                                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedGroupId(isSelected ? null : g.cnuGroupId); } }}
                                            style={{
                                                cursor: "pointer",
                                                outline: isSelected ? `2px solid ${color}` : "none",
                                                outlineOffset: "2px",
                                                borderRadius: "4px",
                                                height: "100%",
                                            }}
                                        >
                                            <MetricCard
                                                title={`${g.cnuGroupId} — ${g.cnuGroupLabel}`}
                                                value={total.toLocaleString("fr-FR")}
                                                detail={`${pct(total, totalEC)} des enseignants-chercheurs · ${pct(g.femaleCount || 0, total)} de femmes`}
                                                color={color}
                                                evolutionData={evo?.total}
                                            />
                                        </div>
                                    </Col>
                                );
                            })}
                        </Row>

                        {rowSelectedGroup && (() => {
                            const sg = rowSelectedGroup;
                            const sgIdx = groups.findIndex((g: any) => g.cnuGroupId === sg.cnuGroupId);
                            const sgEvo = groupEvoMap.get(sg.cnuGroupId);
                            const sgColor = getCssColor(SCALE_COLORS[sgIdx % SCALE_COLORS.length]);
                            const sgTotal = sg.totalCount || 0;
                            return (
                                <div className="fr-mb-4w fr-p-3w" style={{ backgroundColor: "var(--background-alt-grey)", borderRadius: "4px", borderLeft: `4px solid ${sgColor}` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} className="fr-mb-3w">
                                        <Title as="h3" look="h6" className="fr-mb-0">
                                            {sg.cnuGroupId} — {sg.cnuGroupLabel}
                                        </Title>
                                        <button
                                            className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-close-line fr-btn--icon-right"
                                            aria-label="Fermer le détail"
                                            onClick={() => setSelectedGroupId(null)}
                                        >
                                            Fermer
                                        </button>
                                    </div>
                                    <Row gutters className="fr-mb-2w">
                                        <Col xs="12" md="4">
                                            <MetricCard
                                                title="Effectif total"
                                                value={sgTotal.toLocaleString("fr-FR")}
                                                detail={`soit ${pct(sgTotal, totalEC)} des enseignants-chercheurs`}
                                                color={sgColor}
                                                evolutionData={sgEvo?.total}
                                            />
                                        </Col>
                                        <Col xs="12" md="4">
                                            <MetricCard
                                                title="Femmes"
                                                value={(sg.femaleCount || 0).toLocaleString("fr-FR")}
                                                detail={`${pct(sg.femaleCount || 0, sgTotal)} du groupe`}
                                                color={getCssColor("fm-femmes")}
                                                evolutionData={sgEvo?.female}
                                            />
                                        </Col>
                                        <Col xs="12" md="4">
                                            <MetricCard
                                                title="Hommes"
                                                value={(sg.maleCount || 0).toLocaleString("fr-FR")}
                                                detail={`${pct(sg.maleCount || 0, sgTotal)} du groupe`}
                                                color={getCssColor("fm-hommes")}
                                                evolutionData={sgEvo?.male}
                                            />
                                        </Col>
                                    </Row>
                                    <Row gutters>
                                        {AGE_CLASSES.map(({ key, label, color: ageColor }) => {
                                            const count = sg.ageDistribution?.find((a: any) => a.ageClass === key)?.count || 0;
                                            return (
                                                <Col xs="12" md="3" key={key}>
                                                    <MetricCard
                                                        title={label}
                                                        value={count.toLocaleString("fr-FR")}
                                                        detail={`${pct(count, sgTotal)} du groupe`}
                                                        color={getCssColor(ageColor)}
                                                        evolutionData={sgEvo?.age[key]}
                                                    />
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                    {CNU_GROUPS[String(sg.cnuGroupId)] && (
                                        <p className="fr-text--sm fr-mt-3w fr-mb-0" style={{ color: "var(--text-mention-grey)" }}>
                                            <span className="fr-icon-information-line fr-icon--sm fr-mr-1w" aria-hidden="true" />
                                            {CNU_GROUPS[String(sg.cnuGroupId)]}
                                        </p>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                );
            })}

            <div className="section-header fr-mb-4w">
                <Title as="h2" look="h5" id="section-ec-title" className="section-header__title">
                    Sections CNU
                </Title>
            </div>
            <div className="fr-callout fr-mb-4w">
                <Text className="fr-callout__text fr-text--sm">
                    <strong> Explicitez le périmètre de la donnée de la section CNU </strong>
                    <br />
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi risus diam,
                    vestibulum vitae neque at, maximus placerat risus. In malesuada blandit lectus
                    at scelerisque. Mauris a diam vel ante feugiat accumsan id finibus mi.
                    Nam pellentesque libero sed turpis varius dapibus. Fusce sit amet urna id eros
                    venenatis malesuada in et libero. Integer aliquam, magna quis tempus dignissim,
                    magna metus efficitur nisl, in suscipit velit eros sit amet erat. Fusce dolor nibh, sagittis sed molestie id, auctor et augue. Nam nec magna vel nisl consequat interdum. Maecenas vestibulum lorem sit amet pretium scelerisque.
                </Text>
            </div>
            <Row className="fr-mb-5w">
                <Col>
                    <TreemapSectionsChart cnuGroups={currentData.cnuGroups} selectedYear={selectedYear} />
                </Col>
            </Row>

            <FmMetricDefinitionsTable
                definitionKeys={[
                    "Groupe CNU",
                    "Enseignant-chercheur (EC)",
                    "Taux de féminisation",
                    "Classe d'\u00e2ge",
                ]}
                extraItems={groups.map((g: any) => ({
                    title: `Groupe ${g.cnuGroupId} — ${g.cnuGroupLabel}`,
                    definition: CNU_GROUPS[String(g.cnuGroupId)] || g.cnuGroupLabel,
                }))}
            />
        </>
    );
}
