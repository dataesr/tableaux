import { useMemo, useState } from "react";
import { Col, Row, Title, Text } from "@dataesr/dsfr-plus";
import { ViewType, useFacultyNonPermanentsTeachers } from "../../api";
import { getCssColor } from "../../../../../../utils/colors";
import MetricCard from "../../components/metric-card";
import CategoryEvolutionChart from "./charts/category-evolution";
import GenderEvolutionChart from "./charts/gender-evolution";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import AgeDistributionChart from "./charts/age-distribution";
import CategoryDistributionChart from "./charts/category-distribution";
import FmMetricDefinitionsTable from "../../../../components/metric-definitions";

interface EnseignantsNonPermanentsSectionProps {
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

export default function EnseignantsNonPermanentsSection({
    viewType,
    selectedId,
    selectedYear,
}: EnseignantsNonPermanentsSectionProps) {
    const { data: currentData, isLoading } = useFacultyNonPermanentsTeachers(
        viewType,
        selectedId,
        selectedYear
    );
    const [selectedCategoryCode, setSelectedCategoryCode] = useState<string | null>(null);

    const catEvoMap = useMemo(() => {
        type CatEvo = {
            total: Array<{ year: string; value: number }>;
            female: Array<{ year: string; value: number }>;
            male: Array<{ year: string; value: number }>;
            age: Record<string, Array<{ year: string; value: number }>>;
        };
        const map = new Map<string, CatEvo>();
        (currentData?.categoryAssimilEvolution || []).forEach((e: any) => {
            const code = e._id?.category_code;
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
            map.set(code, { total, female, male, age: {} });
        });
        (currentData?.categoryAgeEvolution || []).forEach((e: any) => {
            const code = e._id?.category_code;
            if (!code) return;
            const entry = map.get(code);
            if (!entry) return;
            (e.age_classes || []).forEach((ac: any) => {
                const sorted = [...(ac.yearly || [])].sort((a: any, b: any) =>
                    String(a.year).localeCompare(String(b.year))
                );
                entry.age[ac.age_class] = sorted.map((y: any) => ({ year: String(y.year), value: y.count || 0 }));
            });
        });
        return map;
    }, [currentData]);

    if (isLoading) return <DefaultSkeleton />;
    if (!currentData) return null;

    const categories: any[] = [...(currentData.categoryDistribution || [])].sort(
        (a: any, b: any) => (b.totalCount || 0) - (a.totalCount || 0)
    );
    const totalEC = categories.reduce((s: number, c: any) => s + (c.totalCount || 0), 0);
    const pct = (count: number, total: number) =>
        total > 0 ? `${((count / total) * 100).toFixed(1)} %` : "";

    return (
        <>
            <div className="section-header fr-mb-4w">
                <Title as="h2" look="h5" id="section-ec-title" className="section-header__title">
                    Les enseignants non permanents en détail
                </Title>
            </div>
            <div className="fr-callout fr-mb-4w">
                <Text className="fr-callout__text fr-text--sm">
                    <strong>Explicitez la définition des EC et nuances entre MCF et Prof </strong>
                    <br />
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi risus diam,
                    vestibulum vitae neque at, maximus placerat risus. In malesuada blandit lectus
                    at scelerisque. Mauris a diam vel ante feugiat accumsan id finibus mi.
                    Nam pellentesque libero sed turpis varius dapibus. Fusce sit amet urna id eros
                    venenatis malesuada in et libero. Integer aliquam, magna quis tempus dignissim,
                    magna metus efficitur nisl, in suscipit velit eros sit amet erat. Fusce dolor nibh, sagittis sed molestie id, auctor et augue. Nam nec magna vel nisl consequat interdum. Maecenas vestibulum lorem sit amet pretium scelerisque.
                </Text>
            </div>

            {Array.from({ length: Math.ceil(categories.length / 4) }, (_, rowIdx) => {
                const rowCats: any[] = categories.slice(rowIdx * 4, rowIdx * 4 + 4);
                const rowSelectedCat = rowCats.find((c: any) => c.categoryCode === selectedCategoryCode);

                return (
                    <div key={rowIdx}>
                        <Row gutters className="fr-mb-2w">
                            {rowCats.map((cat: any, i: number) => {
                                const globalIdx = rowIdx * 4 + i;
                                const color = getCssColor(SCALE_COLORS[globalIdx % SCALE_COLORS.length]);
                                const evo = catEvoMap.get(cat.categoryCode);
                                const isSelected = selectedCategoryCode === cat.categoryCode;
                                const total = cat.totalCount || 0;

                                return (
                                    <Col xs="12" md="4" lg="3" key={cat.categoryCode}>
                                        <MetricCard
                                            title={cat.categoryName || cat.categoryCode}
                                            value={total.toLocaleString("fr-FR")}
                                            detail={`${pct(total, totalEC)} des enseignants non permanents · ${pct(cat.femaleCount || 0, total)} de femmes`}
                                            color={color}
                                            evolutionData={evo?.total}
                                            onToggle={() => setSelectedCategoryCode(isSelected ? null : cat.categoryCode)}
                                            isExpanded={isSelected}
                                        />
                                    </Col>
                                );
                            })}
                        </Row>

                        {rowSelectedCat && (() => {
                            const sc = rowSelectedCat;
                            const scIdx = categories.findIndex((c: any) => c.categoryCode === sc.categoryCode);
                            const scEvo = catEvoMap.get(sc.categoryCode);
                            const scColor = getCssColor(SCALE_COLORS[scIdx % SCALE_COLORS.length]);
                            const scTotal = sc.totalCount || 0;
                            return (
                                <div className="fr-mb-4w fr-p-3w" style={{ backgroundColor: "var(--background-alt-grey)", borderRadius: "4px", borderLeft: `4px solid ${scColor}` }}>
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }} className="fr-mb-3w">
                                        <Title as="h3" look="h6" className="fr-mb-0">
                                            {sc.categoryName}
                                        </Title>
                                        <button
                                            className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm fr-icon-close-line fr-btn--icon-right"
                                            aria-label="Fermer le détail"
                                            onClick={() => setSelectedCategoryCode(null)}
                                        >
                                            Fermer
                                        </button>
                                    </div>
                                    <Row gutters className="fr-mb-2w">
                                        <Col xs="12" md="4">
                                            <MetricCard
                                                title="Effectif total"
                                                value={scTotal.toLocaleString("fr-FR")}
                                                detail={`soit ${pct(scTotal, totalEC)} des enseignants non permanents`}
                                                color={scColor}
                                                evolutionData={scEvo?.total}
                                            />
                                        </Col>
                                        <Col xs="12" md="4">
                                            <MetricCard
                                                title="Femmes"
                                                value={(sc.femaleCount || 0).toLocaleString("fr-FR")}
                                                detail={`${pct(sc.femaleCount || 0, scTotal)} de la catégorie`}
                                                color={getCssColor("fm-femmes")}
                                                evolutionData={scEvo?.female}
                                            />
                                        </Col>
                                        <Col xs="12" md="4">
                                            <MetricCard
                                                title="Hommes"
                                                value={(sc.maleCount || 0).toLocaleString("fr-FR")}
                                                detail={`${pct(sc.maleCount || 0, scTotal)} de la catégorie`}
                                                color={getCssColor("fm-hommes")}
                                                evolutionData={scEvo?.male}
                                            />
                                        </Col>
                                    </Row>
                                    <Row gutters>
                                        {AGE_CLASSES.map(({ key, label, color: ageColor }) => {
                                            const count = sc.ageDistribution?.find((a: any) => a.ageClass === key)?.count || 0;
                                            return (
                                                <Col xs="12" md="3" key={key}>
                                                    <MetricCard
                                                        title={label}
                                                        value={count.toLocaleString("fr-FR")}
                                                        detail={`${pct(count, scTotal)} de la catégorie`}
                                                        color={getCssColor(ageColor)}
                                                        evolutionData={scEvo?.age[key]}
                                                    />
                                                </Col>
                                            );
                                        })}
                                    </Row>
                                </div>
                            );
                        })()}
                    </div>
                );
            })}

            <Row gutters className="fr-mb-2w fr-mt-3w">
                <Col xs="12" md="6">
                    <CategoryEvolutionChart categoryEvolution={currentData?.categoryEvolution} />
                </Col>
                <Col xs="12" md="6">
                    <GenderEvolutionChart genderEvolution={currentData?.genderEvolution} />
                </Col>
            </Row>
            <Row gutters className="fr-mt-3w">
                <Col xs="12" md="6">
                    <AgeDistributionChart ageDistribution={currentData?.ageDistribution} selectedYear={selectedYear} />
                </Col>
                <Col xs="12" md="6">
                    <CategoryDistributionChart categoryDistribution={currentData?.categoryDistribution} selectedYear={selectedYear} />
                </Col>
            </Row>

            <FmMetricDefinitionsTable
                definitionKeys={[
                    "Enseignant-chercheur (EC)",
                    "Professeurs des universités (PR)",
                    "Maîtres de conférences (MCF)",
                    "Catégorie d'assimilation",
                    "Corps d'enseignant-chercheur",
                    "Taux de féminisation",
                    "Classe d'\u00e2ge",
                    "Groupe CNU",
                    "Section CNU",
                ]}
            />
        </>
    );
}
