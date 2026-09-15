import { Col, Row, Title } from "@dataesr/dsfr-plus";
import { ViewType } from "../../api";
import { getCssColor } from "../../../../../../utils/colors";
import MetricCard from "../../components/metric-card";
import FmMetricDefinitionsTable from "../../../../components/metric-definitions";

interface EffectifsSectionProps {
    selectedYear: string;
    dashboardData: any;
    evolutionData: any;
    totalCount: number;
    viewType: ViewType;
}

const STATUS_ORDER = ["enseignant_chercheur", "titulaire_non_chercheur", "non_titulaire"];
const STATUS_LABELS: Record<string, string> = {
    enseignant_chercheur: "Enseignants-chercheurs",
    titulaire_non_chercheur: "Titulaires (autres)",
    non_titulaire: "Non permanents",
};
const STATUS_COLORS: Record<string, string> = {
    enseignant_chercheur: getCssColor("fm-statut-ec"),
    titulaire_non_chercheur: getCssColor("fm-statut-titulaire"),
    non_titulaire: getCssColor("fm-statut-non-permanent"),
};
const AGE_COLORS: Record<string, string> = {
    "35 ans et moins": getCssColor("fm-age-35-et-moins-ec"),
    "36 à 55 ans": getCssColor("fm-age-36-55-ec"),
    "56 ans et plus": getCssColor("fm-age-56-et-plus-ec"),
};

export default function EffectifsSection({
    selectedYear,
    dashboardData,
    evolutionData,
    totalCount,
}: EffectifsSectionProps) {
    const genderDist = dashboardData?.gender_distribution || [];
    const statusDist = dashboardData?.status_distribution || [];
    const quotiteByGender = dashboardData?.quotite_by_gender || [];
    const ageDist: any[] = [...(dashboardData?.age_distribution || [])].sort((a, b) =>
        (a._id || "").localeCompare(b._id || "")
    );

    const globalEvo = evolutionData?.global_evolution || [];
    const statusEvo = evolutionData?.status_evolution || [];
    const ageEvo = evolutionData?.age_evolution || [];
    const quotiteEvo = evolutionData?.quotite_evolution || [];

    const femaleCount = genderDist.find((g: any) => g._id === "Féminin")?.count || 0;
    const maleCount = genderDist.find((g: any) => g._id === "Masculin")?.count || 0;
    const fullTimeCount = quotiteByGender.reduce((acc: number, g: any) =>
        acc + (g.quotite_breakdown?.find((q: any) => q.quotite === "Temps plein")?.count || 0), 0);
    const partTimeCount = Math.max(0, totalCount - fullTimeCount);

    const toSpark = (evo: any[], getter: (e: any) => number) =>
        evo.map((e: any) => ({ year: String(e._id), value: getter(e) }));

    const pct = (count: number) =>
        totalCount > 0 ? `${((count / totalCount) * 100).toFixed(1)} % de l'effectif` : "";

    return (
        <>
            <div className="section-header fr-mb-5w">
                <Title as="h2" look="h5" id="section-effectifs-title" className="section-header__title">
                    Effectif global
                </Title>
            </div>
            <div className="fr-mb-4w">
                <Row gutters>
                    <Col xs="12" md="4">
                        <MetricCard
                            title="Effectif total"
                            value={totalCount.toLocaleString("fr-FR")}
                            detail={`Enseignants en ${selectedYear}`}
                            color={getCssColor("blue-france-main-525")}
                            evolutionData={toSpark(globalEvo, (e) => e.total || 0)}
                        />
                    </Col>
                    <Col xs="12" md="4">
                        <MetricCard
                            title="Femmes"
                            value={femaleCount.toLocaleString("fr-FR")}
                            detail={pct(femaleCount)}
                            color={getCssColor("fm-femmes")}
                            evolutionData={toSpark(globalEvo, (e) =>
                                e.gender_breakdown?.find((g: any) => g.gender === "Féminin")?.count || 0)}
                        />
                    </Col>
                    <Col xs="12" md="4">
                        <MetricCard
                            title="Hommes"
                            value={maleCount.toLocaleString("fr-FR")}
                            detail={pct(maleCount)}
                            color={getCssColor("fm-hommes")}
                            evolutionData={toSpark(globalEvo, (e) =>
                                e.gender_breakdown?.find((g: any) => g.gender === "Masculin")?.count || 0)}
                        />
                    </Col>
                </Row>
            </div>

            <div className="fr-mb-4w">
                <Title as="h3" look="h6" className="fr-mb-3w">Statut</Title>
                <Row gutters>
                    {STATUS_ORDER.map((status) => {
                        const count = statusDist.find((s: any) => s._id === status)?.count || 0;
                        return (
                            <Col xs="12" md="4" key={status}>
                                <MetricCard
                                    title={STATUS_LABELS[status]}
                                    value={count.toLocaleString("fr-FR")}
                                    detail={pct(count)}
                                    color={STATUS_COLORS[status]}
                                    evolutionData={toSpark(statusEvo, (e) =>
                                        e.status_breakdown?.find((s: any) => s.status === status)?.count || 0)}
                                />
                            </Col>
                        );
                    })}
                </Row>
            </div>

            <div className="fr-mb-4w">
                <Title as="h3" look="h6" className="fr-mb-3w">Quotité</Title>
                <Row gutters>
                    <Col xs="12" md="6">
                        <MetricCard
                            title="Temps plein"
                            value={fullTimeCount.toLocaleString("fr-FR")}
                            detail={pct(fullTimeCount)}
                            color={getCssColor("fm-quotite-temps-plein")}
                            evolutionData={toSpark(quotiteEvo, (e) =>
                                e.quotite_breakdown?.find((q: any) => q.quotite === "Temps plein")?.count || 0)}
                        />
                    </Col>
                    <Col xs="12" md="6">
                        <MetricCard
                            title="Temps partiel"
                            value={partTimeCount.toLocaleString("fr-FR")}
                            detail={pct(partTimeCount)}
                            color={getCssColor("fm-quotite-temps-partiel")}
                            evolutionData={toSpark(quotiteEvo, (e) =>
                                Math.max(0, (e.total || 0) - (e.quotite_breakdown?.find((q: any) => q.quotite === "Temps plein")?.count || 0)))}
                        />
                    </Col>
                </Row>
            </div>

            <div className="fr-mb-4w">
                <Title as="h3" look="h6" className="fr-mb-3w">Âge</Title>
                <Row gutters>
                    {ageDist.map((ag: any) => (
                        <Col xs="12" md="4" key={ag._id}>
                            <MetricCard
                                title={ag._id || "Non précisé"}
                                value={(ag.total || 0).toLocaleString("fr-FR")}
                                detail={pct(ag.total || 0)}
                                color={AGE_COLORS[ag._id] ?? getCssColor("blue-france-main-525")}
                                evolutionData={toSpark(ageEvo, (e) =>
                                    e.age_breakdown?.find((a: any) => a.age_class === ag._id)?.count || 0)}
                            />
                        </Col>
                    ))}
                </Row>
            </div>

            <FmMetricDefinitionsTable
                definitionKeys={[
                    "Personnel enseignant",
                    "Statut : 3 catégories mutuellement exclusives",
                    "Enseignant-chercheur (EC)",
                    "Permanent / Non permanent",
                    "Quotité de travail",
                    "Temps plein",
                    "Temps partiel",
                    "Classe d'\u00e2ge",
                ]}
            />
        </>
    );
}

