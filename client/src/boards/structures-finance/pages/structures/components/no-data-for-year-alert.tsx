import { Container, Row, Col, Button } from "@dataesr/dsfr-plus";
import navigationConfig from "../../../components/layouts/navigation-config.json";
import Breadcrumb from "../../../../../components/breadcrumb";

interface NoDataForYearAlertProps {
    etablissementLib: string;
    selectedYear: string;
    availableYears: number[];
    onYearChange: (year: string) => void;
    onClearSelection: () => void;
}

export default function NoDataForYearAlert({
    etablissementLib,
    selectedYear,
    availableYears,
    onYearChange,
    onClearSelection,
}: NoDataForYearAlertProps) {
    return (
        <main>
            <Container fluid className="etablissement-selector__wrapper">
                <Container as="section">
                    <Row>
                        <Col>
                            <Breadcrumb config={{
                                    ...navigationConfig,
                                    etablissements: { ...navigationConfig.etablissements, label: { fr: etablissementLib || "Établissement" } },
                                }} />
                        </Col>
                    </Row>
                </Container>
                <Container className="fr-py-4w">
                    <Row gutters className="fr-grid-row--middle fr-mb-3w">
                        <Col xs="12" md="8">
                            <div className="fr-alert fr-alert--info">
                                <p>
                                    Aucune donnée disponible pour <strong>{etablissementLib}</strong> en <strong>{selectedYear}</strong>.
                                </p>
                            </div>
                        </Col>

                        <Col xs="12" md="4" className="text-right">
                            <div className="fr-select-group fr-mb-1w">
                                <label className="fr-label" htmlFor="no-data-year">
                                    Année disponible
                                </label>
                                <select
                                    className="fr-select"
                                    id="no-data-year"
                                    name="year"
                                    value={selectedYear}
                                    onChange={(e) => onYearChange(e.target.value)}
                                >
                                    {!availableYears.map(String).includes(selectedYear) && (
                                        <option value={selectedYear} disabled>
                                            {selectedYear}
                                        </option>
                                    )}
                                    {availableYears.map((year) => (
                                        <option key={year} value={year.toString()}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Button
                                variant="tertiary"
                                icon="arrow-go-back-line"
                                iconPosition="left"
                                onClick={onClearSelection}
                            >
                                Changer d'établissement
                            </Button>
                        </Col>
                    </Row>
                </Container>
            </Container>
        </main>
    );
}
