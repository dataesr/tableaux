import { useSearchParams } from "react-router-dom";
import { Col, Container, Row } from "@dataesr/dsfr-plus";
import { ViewType, useFacultyYears, useFacultyDashboard, useFacultyEvolution } from "../api";
import PageHeader from "./page-header";
import SectionNavigation from "./section-navigation";
import PersonnelsSection from "../sections/personnels";
import GroupesCnuSection from "../sections/groupes-cnu";
import ComparaisonSection from "../sections/positionning";
import DefaultSkeleton from "../../../../../components/charts-skeletons/default";
import Breadcrumb from "../../../components/breadcrumb";
import { IncompleteYearWarning } from "../../../components/incomplete-year";
import EvolutionsSection from "../sections/analyses";
import { getParamKey } from "../utils";

const VIEW_LABELS: Record<ViewType, { plural: string; singular: string; basePath: string }> = {
    structure: { plural: "Établissements", singular: "établissement", basePath: "/personnel-enseignant/etablissements" },
    discipline: { plural: "Disciplines", singular: "discipline", basePath: "/personnel-enseignant/disciplines" },
    region: { plural: "Régions", singular: "région", basePath: "/personnel-enseignant/regions" },
    academie: { plural: "Académies", singular: "académie", basePath: "/personnel-enseignant/academies" },
};

const POPULATION_SECTIONS = [
    "enseignants-chercheurs",
    "enseignants-2nd-degre-arts-metiers",
    "enseignants-non-permanents",
];

interface Props {
    viewType: ViewType;
}

export default function EntityView({ viewType }: Props) {
    const [searchParams, setSearchParams] = useSearchParams();
    const labels = VIEW_LABELS[viewType];

    const selectedId = searchParams.get(getParamKey(viewType)) || "";
    const rawSection = searchParams.get("section") || "personnels";

    const section = POPULATION_SECTIONS.includes(rawSection) ? "personnels" : rawSection;
    const initialPopulation = POPULATION_SECTIONS.includes(rawSection) ? rawSection : undefined;

    const { data: yearsData, isLoading: isLoadingYears } = useFacultyYears(viewType, selectedId);
    const years: string[] = yearsData?.years || [];
    const latestCompleteYear = yearsData?.latestCompleteYear || (years.length > 0 ? years[years.length - 1] : "");
    const selectedYear = searchParams.get("year") || latestCompleteYear;

    const { data: dashboardData, isLoading: isLoadingDashboard } =
        useFacultyDashboard(viewType, selectedId, selectedYear);

    const { data: evolutionData } = useFacultyEvolution(viewType, selectedId);

    const entityName = dashboardData?.context_info?.name || selectedId;
    const totalCount = dashboardData?.total_count || 0;

    const handleClearSelection = () => {
        const params = Object.fromEntries(searchParams);

        delete params[getParamKey(viewType)];
        delete params.section;
        delete params.year;

        setSearchParams(params);
    };

    const handleSectionChange = (newSection: string) => {
        const params = Object.fromEntries(searchParams);
        setSearchParams({ ...params, section: newSection });
    };

    const handleYearChange = (year: string) => {
        const params = Object.fromEntries(searchParams);
        setSearchParams({ ...params, year });
    };

    const renderSectionContent = () => {
        switch (section) {
            case "personnels":
                return (
                    <PersonnelsSection
                        viewType={viewType}
                        selectedId={selectedId}
                        selectedYear={selectedYear}
                        initialPopulation={initialPopulation}
                    />
                );
            case "groupes-cnu":
                return (
                    <GroupesCnuSection
                        viewType={viewType}
                        selectedId={selectedId}
                        selectedYear={selectedYear}
                    />
                );
            case "comparaison":
                return (
                    <ComparaisonSection
                        viewType={viewType}
                        selectedId={selectedId}
                        selectedYear={selectedYear}
                    />
                );
            case "analyses":
                return (
                    <EvolutionsSection
                        viewType={viewType}
                        selectedId={selectedId}
                    />
                );
            default:
                return null;
        }
    };

    if (isLoadingYears || (isLoadingDashboard && !dashboardData)) {
        return (
            <main>
                <Container fluid className="fm-etablissement-selector__wrapper">
                    <Container className="fr-py-4w">
                        <DefaultSkeleton />
                    </Container>
                </Container>
            </main>
        );
    }

    return (
        <main>
            <Container fluid className="fm-etablissement-selector__wrapper">
                <Container as="section">
                    <Row>
                        <Col>
                            <Breadcrumb
                                items={[
                                    { label: "Accueil", href: "/personnel-enseignant/accueil" },
                                    { label: labels.plural, href: labels.basePath },
                                    { label: entityName },
                                ]}
                            />
                        </Col>
                    </Row>

                    <PageHeader
                        data={dashboardData}
                        evolutionData={evolutionData}
                        entityName={entityName}
                        selectedId={selectedId}
                        selectedYear={selectedYear}
                        totalCount={totalCount}
                        viewType={viewType}
                        onClose={handleClearSelection}
                    />
                </Container>
            </Container>

            <Container>
                <SectionNavigation
                    activeSection={section}
                    viewType={viewType}
                    years={years}
                    selectedYear={selectedYear}
                    onSectionChange={handleSectionChange}
                    onYearChange={handleYearChange}
                />
            </Container>

            <Container className="fr-py-4w">
                <IncompleteYearWarning selectedYear={selectedYear} latestCompleteYear={latestCompleteYear} />
                {renderSectionContent()}
            </Container>
        </main>
    );
}
