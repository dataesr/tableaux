import { useMemo } from "react";
import { Accordion, AccordionGroup, Col, Row, Tab, Tabs, Title, Text } from "@dataesr/dsfr-plus";
import { ViewType, useFaculty2ndDegreeTeachers } from "../../api";
import { getCssColor } from "../../../../../../utils/colors";
import MetricCard from "../../components/metric-card";
import CategoryEvolutionChart from "./charts/category-evolution";
import GenderEvolutionChart from "./charts/gender-evolution";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import AgeDistributionChart from "./charts/age-distribution";
import CategoryDistributionChart from "./charts/category-distribution";
import FeminizationRateChart from "./charts/feminization-rate";
import AgeCategoryHeatmapChart from "./charts/age-category-heatmap";
import QuotiteByCategoryChart from "./charts/quotite-by-category";
import PartTimeEvolutionChart from "./charts/part-time-evolution";
import FmMetricDefinitionsTable from "../../../../components/metric-definitions";

interface Enseignants2ndDegreArtsMetiersSectionProps {
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

export default function Enseignants2ndDegreArtsMetiersSection({
    viewType,
    selectedId,
    selectedYear,
}: Enseignants2ndDegreArtsMetiersSectionProps) {
    const { data: currentData, isLoading } = useFaculty2ndDegreeTeachers(
        viewType,
        selectedId,
        selectedYear
    );

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
            <div className="section-header fr-mb-5w">
                <Title as="h2" look="h5" id="section-ec-title" className="section-header__title">
                    Les enseignants du 2nd degré et Arts et Métiers en détail
                </Title>
            </div>
            <div className="fr-callout fr-mb-4w">
                <Text className="fr-callout__text fr-text--sm">
                    <strong>Qui sont les enseignants du second degré et Arts et Métiers ?</strong>
                    <br />
                    Il s'agit d'enseignants titulaires du second degré (professeurs agrégés – PRAG,
                    professeurs certifiés – PRCE, etc.) affectés dans l'enseignement supérieur, ainsi
                    que des corps propres aux écoles d'Arts et Métiers. À la différence des
                    enseignants-chercheurs, ils assurent principalement une mission d'enseignement et
                    n'ont pas d'obligation statutaire de recherche. Ils contribuent fortement à
                    l'encadrement pédagogique, en particulier dans les premiers cycles.
                </Text>
            </div>

            <Title as="h3" look="h6" className="fr-mb-2w">
                Synthèse par catégorie
            </Title>
            <Row gutters className="fr-mb-4w">
                {categories.map((cat: any, idx: number) => {
                    const color = getCssColor(SCALE_COLORS[idx % SCALE_COLORS.length]);
                    const evo = catEvoMap.get(cat.categoryCode);
                    const total = cat.totalCount || 0;
                    return (
                        <Col xs="12" md="4" lg="3" key={cat.categoryCode}>
                            <MetricCard
                                title={cat.categoryName}
                                value={total.toLocaleString("fr-FR")}
                                detail={`${pct(total, totalEC)} des enseignants du 2nd degré et Arts et Métiers · ${pct(cat.femaleCount || 0, total)} de femmes`}
                                color={color}
                                evolutionData={evo?.total}
                            />
                        </Col>
                    );
                })}
            </Row>

            <Tabs>
                <Tab label="Évolutions">
                    <Row gutters>
                        <Col xs="12" md="6">
                            <CategoryEvolutionChart categoryEvolution={currentData?.categoryEvolution} />
                        </Col>
                        <Col xs="12" md="6">
                            <GenderEvolutionChart genderEvolution={currentData?.genderEvolution} />
                        </Col>
                    </Row>
                    <Row gutters className="fr-mt-3w">
                        <Col xs="12">
                            <FeminizationRateChart genderEvolution={currentData?.genderEvolution} />
                        </Col>
                    </Row>
                </Tab>
                <Tab label="Répartitions">
                    <Row gutters>
                        <Col xs="12" md="6">
                            <AgeDistributionChart ageDistribution={currentData?.ageDistribution} selectedYear={selectedYear} />
                        </Col>
                        <Col xs="12" md="6">
                            <CategoryDistributionChart categoryDistribution={currentData?.categoryDistribution} selectedYear={selectedYear} />
                        </Col>
                    </Row>
                    <Row gutters className="fr-mt-3w">
                        <Col xs="12">
                            <AgeCategoryHeatmapChart categoryDistribution={currentData?.categoryDistribution} selectedYear={selectedYear} />
                        </Col>
                    </Row>
                </Tab>
                <Tab label="Quotité">
                    <Row gutters>
                        <Col xs="12" md="6">
                            <QuotiteByCategoryChart quotiteByCategory={currentData?.quotiteByCategory} selectedYear={selectedYear} />
                        </Col>
                        <Col xs="12" md="6">
                            <PartTimeEvolutionChart quotiteEvolution={currentData?.quotiteEvolution} />
                        </Col>
                    </Row>
                </Tab>
                <Tab label="Détail par catégorie">
                    <AccordionGroup>
                        {categories.map((cat: any, idx: number) => {
                            const scColor = getCssColor(SCALE_COLORS[idx % SCALE_COLORS.length]);
                            const scEvo = catEvoMap.get(cat.categoryCode);
                            const scTotal = cat.totalCount || 0;
                            return (
                                <Accordion
                                    key={cat.categoryCode}
                                    title={`${cat.categoryName} · ${scTotal.toLocaleString("fr-FR")} enseignants du 2nd degré et Arts et Métiers`}
                                    titleAs="h4"
                                    defaultExpanded={false}
                                >
                                    <Row gutters className="fr-mb-2w">
                                        <Col xs="12" md="4">
                                            <MetricCard
                                                title="Effectif total"
                                                value={scTotal.toLocaleString("fr-FR")}
                                                detail={`soit ${pct(scTotal, totalEC)} des enseignants du 2nd degré et Arts et Métiers`}
                                                color={scColor}
                                                evolutionData={scEvo?.total}
                                            />
                                        </Col>
                                        <Col xs="12" md="4">
                                            <MetricCard
                                                title="Femmes"
                                                value={(cat.femaleCount || 0).toLocaleString("fr-FR")}
                                                detail={`${pct(cat.femaleCount || 0, scTotal)} de la catégorie`}
                                                color={getCssColor("fm-femmes")}
                                                evolutionData={scEvo?.female}
                                            />
                                        </Col>
                                        <Col xs="12" md="4">
                                            <MetricCard
                                                title="Hommes"
                                                value={(cat.maleCount || 0).toLocaleString("fr-FR")}
                                                detail={`${pct(cat.maleCount || 0, scTotal)} de la catégorie`}
                                                color={getCssColor("fm-hommes")}
                                                evolutionData={scEvo?.male}
                                            />
                                        </Col>
                                    </Row>
                                    <Row gutters>
                                        {AGE_CLASSES.map(({ key, label, color: ageColor }) => {
                                            const count = cat.ageDistribution?.find((a: any) => a.ageClass === key)?.count || 0;
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
                                </Accordion>
                            );
                        })}
                    </AccordionGroup>
                </Tab>
            </Tabs>

            <FmMetricDefinitionsTable
                definitionKeys={[
                    "Enseignant du second degré affecté dans le supérieur",
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
