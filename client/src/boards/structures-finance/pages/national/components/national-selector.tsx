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
import Dropdown from "../../../../../components/dropdown";
import Breadcrumb from "../../../components/breadcrumb";
import { DEFAULT_REFERENCE_YEAR } from "../../../config/constants";

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
    if (searchParams.has("section")) {
      searchParams.delete("section");
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
    labels,
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
            <Breadcrumb
              items={[
                { label: "Accueil", href: "/structures-finance/accueil" },
                { label: "Vue nationale" },
              ]}
            />
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

            <div className="filter-bar fr-mb-2w">
              <Dropdown
                label={selectedYear}
                icon="calendar-line"
                size="sm"
                className="filter-bar__year"
              >
                {years.map((year) => (
                  <Dropdown.Item
                    key={year}
                    active={selectedYear === String(year)}
                    onClick={() => handleYearChange(String(year))}
                  >
                    {year}
                  </Dropdown.Item>
                ))}
              </Dropdown>

              <Dropdown label={labels.type} icon="building-line" size="sm">
                <Dropdown.Item
                  active={!selectedType}
                  onClick={() => handleTypeChange("")}
                >
                  Tous les types
                </Dropdown.Item>
                {availableTypes.map((type: string) => (
                  <Dropdown.Item
                    key={type}
                    active={selectedType === type}
                    onClick={() => handleTypeChange(type)}
                  >
                    {type}
                  </Dropdown.Item>
                ))}
              </Dropdown>

              <Dropdown label={labels.region} icon="map-pin-2-line" size="sm">
                <Dropdown.Item
                  active={!selectedRegion}
                  onClick={() => handleRegionChange("")}
                >
                  Toutes les régions
                </Dropdown.Item>
                {availableRegions.map((region: string) => (
                  <Dropdown.Item
                    key={region}
                    active={selectedRegion === region}
                    onClick={() => handleRegionChange(region)}
                  >
                    {region}
                  </Dropdown.Item>
                ))}
              </Dropdown>
            </div>

            <div className="filter-bar fr-mb-2w">
              <Dropdown
                label={labels.rce}
                icon="bank-line"
                size="sm"
                className="filter-bar__rce"
              >
                <Dropdown.Item
                  active={!selectedRce}
                  onClick={() => handleRceChange("")}
                >
                  RCE et non RCE
                </Dropdown.Item>
                <Dropdown.Item
                  active={selectedRce === "rce"}
                  onClick={() => handleRceChange("rce")}
                >
                  RCE uniquement
                </Dropdown.Item>
                <Dropdown.Item
                  active={selectedRce === "non-rce"}
                  onClick={() => handleRceChange("non-rce")}
                >
                  Non RCE uniquement
                </Dropdown.Item>
              </Dropdown>
              <Dropdown
                label={labels.devimmo}
                icon="home-4-line"
                size="sm"
                className="filter-bar__devimmo"
              >
                <Dropdown.Item
                  active={!selectedDevimmo}
                  onClick={() => handleDevimmoChange("")}
                >
                  Avec ou sans dévolution immobilière
                </Dropdown.Item>
                <Dropdown.Item
                  active={selectedDevimmo === "devimmo"}
                  onClick={() => handleDevimmoChange("devimmo")}
                >
                  Avec dévolution immobilière
                </Dropdown.Item>
                <Dropdown.Item
                  active={selectedDevimmo === "non-devimmo"}
                  onClick={() => handleDevimmoChange("non-devimmo")}
                >
                  Sans dévolution immobilière
                </Dropdown.Item>
              </Dropdown>
            </div>

            <div className="filter-bar fr-mb-3w">
              <Dropdown
                label={labels.typologie}
                icon="layout-grid-line"
                size="sm"
                className="filter-bar__typologie"
              >
                <Dropdown.Item
                  active={!selectedTypologie}
                  onClick={() => handleTypologieChange("")}
                >
                  Toutes les typologies
                </Dropdown.Item>
                {availableTypologies.map((typo: string) => (
                  <Dropdown.Item
                    key={typo}
                    active={selectedTypologie === typo}
                    onClick={() => handleTypologieChange(typo)}
                  >
                    {typo}
                  </Dropdown.Item>
                ))}
              </Dropdown>
            </div>
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
