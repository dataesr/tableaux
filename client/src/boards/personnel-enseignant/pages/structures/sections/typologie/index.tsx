import { useMemo } from "react";
import { Col, Row, Title } from "@dataesr/dsfr-plus";
import { getCssColor } from "../../../../../../utils/colors";
import MetricCard from "../../components/metric-card";
import DisciplineChart from "./charts/disciplines";
import FmMetricDefinitionsTable from "../../../../components/metric-definitions";

interface TypologieSectionProps {
    selectedYear: string;
    dashboardData: any;
    evolutionData: any;
    totalCount: number;
}

const SCALE_COLORS = Array.from({ length: 14 }, (_, i) => `scale-${i + 1}`);

export default function TypologieSection({
    selectedYear,
    dashboardData,
    evolutionData,
    totalCount,
}: TypologieSectionProps) {
    const disciplineDistribution = dashboardData?.discipline_distribution || [];

    const disciplineCards = useMemo(() => {
        const discEvo: any[] = evolutionData?.discipline_evolution || [];

        return [...disciplineDistribution]
            .filter((d: any) => (d.total || 0) > 0)
            .sort((a: any, b: any) => (b.total || 0) - (a.total || 0))
            .map((d: any, i: number) => {
                const code = d._id?.code || d._id?.discipline_code || "";
                const name = d._id?.name || d._id?.discipline_name || "Non précisé";
                const total = d.total || 0;
                const pct = totalCount > 0 ? (total / totalCount) * 100 : 0;
                const femaleCount = d.gender_breakdown?.find((g: any) => g.gender === "Féminin")?.count || 0;
                const femalePct = total > 0 ? (femaleCount / total) * 100 : 0;
                const color = getCssColor(SCALE_COLORS[i % SCALE_COLORS.length]);

                const evo = discEvo.find((e: any) => e._id?.code === code);
                const sparkline = evo?.yearly
                    ?.sort((a: any, b: any) => String(a.year).localeCompare(String(b.year)))
                    .map((y: any) => ({ year: String(y.year), value: y.count || 0 })) || [];

                return { name, total, pct, femalePct, color, sparkline };
            });
    }, [disciplineDistribution, evolutionData, totalCount]);

    return (
        <>
            <div className="section-header fr-mb-5w">
                <Title
                    as="h2"
                    look="h5"
                    id="section-typologie-title"
                    className="section-header__title"
                >
                    Profil disciplinaire et démographique
                </Title>
            </div>

            <Row gutters className="fr-mb-3w">
                {disciplineCards.map((d) => (
                    <Col xs="12" md="4" lg="3" key={d.name}>
                        <MetricCard
                            title={d.name}
                            value={d.total.toLocaleString("fr-FR")}
                            detail={`${d.pct.toFixed(1)} % du total · ${d.femalePct.toFixed(0)} % femmes`}
                            color={d.color}
                            evolutionData={d.sparkline}
                        />
                    </Col>
                ))}
            </Row>

            <div className="fr-mb-4w">

                <Row gutters>
                    <Col xs="12">
                        <DisciplineChart
                            selectedYear={selectedYear}
                            disciplineDistribution={disciplineDistribution}
                        />
                    </Col>
                </Row>
            </div>


            <FmMetricDefinitionsTable
                definitionKeys={[
                    "Grande discipline",
                    "Classe d'\u00e2ge",
                    "Taux de féminisation",
                    "Personnel enseignant",
                ]}
            />
        </>
    );
}
