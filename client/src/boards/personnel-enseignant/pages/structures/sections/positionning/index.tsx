import { Col, Row, Text, Title } from "@dataesr/dsfr-plus";
import { type ViewType } from "../../api";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import SectionYearSelect from "../../../../../../components/section-year-select";
import { usePositioningParams } from "./hooks/usePositioningParams";
import { useFacultyPositioningData } from "./hooks/useFacultyPositioningData";
import AnalysisFilter from "./components/analysis-filter";
import ComparisonBarChart from "./charts/comparison-bar";
import FmMetricDefinitionsTable from "../../../../components/metric-definitions";

interface Props {
    viewType: ViewType;
    selectedId: string;
    selectedYear: string;
}

const VIEW_ENTITY_LABEL: Record<ViewType, string> = {
    structure: "l'établissement",
    region: "la région",
    academie: "l'académie",
    discipline: "la discipline",
};

export default function ComparaisonSection({ viewType, selectedId, selectedYear }: Props) {
    const { filters, setFilters, selectedMetric, selectedMetricLabel, setSelectedMetric } = usePositioningParams();
    const { allItems, filteredItems, currentItem, isLoading } = useFacultyPositioningData(
        viewType,
        selectedId,
        selectedYear,
        filters,
        selectedMetric
    );

    const entityLabel = VIEW_ENTITY_LABEL[viewType];
    const entityName = currentItem?.etablissement_actuel_lib || selectedId;

    if (isLoading) return <DefaultSkeleton />;

    if (!allItems.length) {
        return (
            <section id="section-comparaison" aria-labelledby="section-comparaison-title">
                <div className="section-header section-header--year fr-mb-4w">
                    <Title as="h2" look="h5" id="section-comparaison-title" className="section-header__title">
                        Positionnement de {entityName}
                    </Title>
                    <SectionYearSelect />
                </div>
                <div className="fr-alert fr-alert--warning">
                    <Text>Les données de comparaison ne sont pas disponibles pour l'année sélectionnée.</Text>
                </div>
            </section>
        );
    }

    return (
        <section id="section-comparaison" aria-labelledby="section-comparaison-title">
            <div className="section-header section-header--year fr-mb-4w">
                <div className="section-header__title">
                    <Title as="h2" look="h5" id="section-comparaison-title" className="fr-mb-1w">
                        Positionnement de {entityName}
                    </Title>
                    <Text className="fr-text--sm fr-mb-0" style={{ color: "var(--text-mention-grey)" }}>
                        Comparez {entityLabel} avec d'autres entités de même nature.
                    </Text>
                </div>
                <SectionYearSelect />
            </div>

            <Row gutters>
                <Col xs="12" md="4">
                    <AnalysisFilter
                        selectedMetric={selectedMetric}
                        onSelectMetric={setSelectedMetric}
                        year={selectedYear}
                        viewType={viewType}
                        currentItem={currentItem}
                        filters={filters}
                        onFiltersChange={setFilters}
                    />
                </Col>
                <Col xs="12" md="8">
                    {filteredItems.length <= 1 ? (
                        <div className="fr-alert fr-alert--warning">
                            <Text>Aucune entité ne correspond aux filtres sélectionnés.</Text>
                        </div>
                    ) : (
                        <ComparisonBarChart
                            data={filteredItems}
                            currentId={selectedId}
                            currentName={entityName}
                            selectedMetric={selectedMetric}
                            selectedYear={selectedYear}
                            labelOverride={selectedMetricLabel || undefined}
                        />
                    )}
                </Col>
            </Row>

            <FmMetricDefinitionsTable
                definitionKeys={[
                    "Positionnement relatif",
                    "Personnel enseignant",
                    "Taux de féminisation",
                    "Statut : 3 catégories mutuellement exclusives",
                    "Classe d'\u00e2ge",
                ]}
            />
        </section>
    );
}

