import { Row, Col, Container, Title, Button, Text } from "@dataesr/dsfr-plus";
import { useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { useFinanceYears } from "../../../api";
import { useFinanceAdvancedComparison } from "../../../api";
import {
  useAvailableOptions,
  sortUniversitiesFirst,
} from "../../../utils/useAvailableOptions";
import { useFilteredNationalData } from "../hooks/useFilteredNationalData";
import { useFilters } from "../../../utils/useFilters";
import "../styles.scss";
import { DEFAULT_REFERENCE_YEAR } from "../../../config/constants";
import navigationConfig from "../../../components/layouts/navigation-config.json";
import Breadcrumb from "../../../../../components/breadcrumb";

const DEFAULT_YEAR = DEFAULT_REFERENCE_YEAR;

export default function NationalSelector() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: yearsData } = useFinanceYears();
  const years = yearsData?.years || [];

  const yearFromUrl = searchParams.get("year") || "";
  const selectedYear = yearFromUrl || DEFAULT_YEAR;

  useEffect(() => {
    let hasChanges = false;

    if (searchParams.has("structureId")) {
      searchParams.delete("structureId");
      hasChanges = true;
    }
    if (searchParams.has("onglet")) {
      searchParams.delete("onglet");
      hasChanges = true;
    }

    if (hasChanges) {
      setSearchParams(searchParams, { replace: true });
    }
  }, []);

  const { data: comparisonData } = useFinanceAdvancedComparison(
    {
      annee: String(selectedYear),
      type: "",
      typologie: "",
      region: "",
    },
    !!selectedYear
  );

  const allItems = comparisonData?.items || [];

  const {
    selectedType,
    selectedTypologie,
    selectedRegion,
    selectedRce,
    selectedDevimmo,
    handleTypeChange,
    handleTypologieChange,
    handleRegionChange,
    handleRceChange,
    handleDevimmoChange,
    handleResetFilters,
    hasActiveFilters,
  } = useFilters();

  const { types: availableTypes, typologies: availableTypologies, regions: availableRegions } =
    useAvailableOptions(allItems, [
      { key: "types", field: "type", selected: selectedType, sort: sortUniversitiesFirst },
      { key: "typologies", field: "etablissement_categorie", selected: selectedTypologie, sort: sortUniversitiesFirst },
      { key: "regions", field: "region", selected: selectedRegion },
    ]);

  const filteredItems = useFilteredNationalData(
    allItems,
    selectedType,
    selectedTypologie,
    selectedRegion,
    selectedRce,
    selectedDevimmo
  );

  const etablissementCount = filteredItems.length;

  useEffect(() => {
    if (!years.length) return;
    if (!yearFromUrl || !years.map(String).includes(yearFromUrl)) {
      searchParams.set("year", DEFAULT_YEAR);
      setSearchParams(searchParams);
    }
  }, [years, yearFromUrl, searchParams, setSearchParams]);

  const handleYearChange = (year: string) => {
    searchParams.set("year", year);
    setSearchParams(searchParams);
  };

  return (
    <Container fluid className="etablissement-selector__wrapper">
      <Container as="section">
        <Row>
          <Col xs="12">
            <Breadcrumb config={navigationConfig} />
          </Col>
        </Row>

        <Row>
          <Col xs="12" md="8">
            <div className="filter-header fr-mb-2w">
              <Title as="h1" look="h4" className="fr-mb-0">
                Vue nationale
              </Title>

              {hasActiveFilters && (
                <Button
                  variant="tertiary"
                  size="sm"
                  icon="refresh-line"
                  iconPosition="left"
                  onClick={handleResetFilters}
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>

            <Row gutters className="fr-mb-2w">
              <Col xs="12" md="6" lg="4">
                <div className="fr-select-group">
                  <label className="fr-label" htmlFor="filter-year">Année</label>
                  <select
                    className="fr-select"
                    id="filter-year"
                    name="year"
                    value={selectedYear}
                    onChange={(e) => handleYearChange(e.target.value)}
                  >
                    {years.map((year) => (
                      <option key={year} value={String(year)}>{year}</option>
                    ))}
                  </select>
                </div>
              </Col>
              <Col xs="12" md="6" lg="4">
                <div className="fr-select-group">
                  <label className="fr-label" htmlFor="filter-type">Type d'établissement</label>
                  <select
                    className="fr-select"
                    id="filter-type"
                    name="type"
                    value={selectedType}
                    onChange={(e) => handleTypeChange(e.target.value)}
                  >
                    <option value="">Tous les types</option>
                    {availableTypes.map((type: string) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
              </Col>
              <Col xs="12" md="6" lg="4">
                <div className="fr-select-group">
                  <label className="fr-label" htmlFor="filter-region">Région</label>
                  <select
                    className="fr-select"
                    id="filter-region"
                    name="region"
                    value={selectedRegion}
                    onChange={(e) => handleRegionChange(e.target.value)}
                  >
                    <option value="">Toutes les régions</option>
                    {availableRegions.map((region: string) => (
                      <option key={region} value={region}>{region}</option>
                    ))}
                  </select>
                </div>
              </Col>
              <Col xs="12" md="6" lg="4">
                <div className="fr-select-group">
                  <label className="fr-label" htmlFor="filter-rce">RCE</label>
                  <select
                    className="fr-select"
                    id="filter-rce"
                    name="rce"
                    value={selectedRce}
                    onChange={(e) => handleRceChange(e.target.value)}
                  >
                    <option value="">RCE et non RCE</option>
                    <option value="rce">RCE uniquement</option>
                    <option value="non-rce">Non RCE uniquement</option>
                  </select>
                </div>
              </Col>
              <Col xs="12" md="6" lg="4">
                <div className="fr-select-group">
                  <label className="fr-label" htmlFor="filter-devimmo">Dévolution immobilière</label>
                  <select
                    className="fr-select"
                    id="filter-devimmo"
                    name="devimmo"
                    value={selectedDevimmo}
                    onChange={(e) => handleDevimmoChange(e.target.value)}
                  >
                    <option value="">Avec ou sans dévolution immobilière</option>
                    <option value="devimmo">Avec dévolution immobilière</option>
                    <option value="non-devimmo">Sans dévolution immobilière</option>
                  </select>
                </div>
              </Col>
              <Col xs="12" md="6" lg="4">
                <div className="fr-select-group">
                  <label className="fr-label" htmlFor="filter-typologie">Typologie</label>
                  <select
                    className="fr-select"
                    id="filter-typologie"
                    name="typologie"
                    value={selectedTypologie}
                    onChange={(e) => handleTypologieChange(e.target.value)}
                  >
                    <option value="">Toutes les typologies</option>
                    {availableTypologies.map((typo: string) => (
                      <option key={typo} value={typo}>{typo}</option>
                    ))}
                  </select>
                </div>
              </Col>
            </Row>
            <Text size="sm" className="fr-mb-0 fr-text--bold">
              {etablissementCount} établissement
              {etablissementCount > 1 ? "s" : ""}
            </Text>
          </Col>
          <Col
            xs="12"
            md="4"
            className="fr-hidden fr-unhidden-md fr-grid-row fr-grid-row--center fr-grid-row--middle"
          >
            <svg
              className="fr-artwork"
              aria-hidden="true"
              viewBox="0 0 80 80"
              width="180px"
              height="180px"
            >
              <use
                className="fr-artwork-decorative"
                href="/artwork/pictograms/map/location-france.svg#artwork-decorative"
              />
              <use
                className="fr-artwork-minor"
                href="/artwork/pictograms/map/location-france.svg#artwork-minor"
              />
              <use
                className="fr-artwork-major"
                href="/artwork/pictograms/map/location-france.svg#artwork-major"
              />
            </svg>
          </Col>
        </Row>
      </Container>
    </Container>
  );
}
