import { useMemo } from "react";
import { Row, Col, Title, Button } from "@dataesr/dsfr-plus";
import { useFilters } from "../../../utils/useFilters";
import "../../national/styles.scss";
import Dropdown from "../../../../../components/dropdown";

interface SelectionUIProps {
  availableTypes: string[];
  availableTypologies: string[];
  availableRegions: string[];
  filteredStructures: any[];
  onStructureSelect: (id: string) => void;
}

export default function SelectionUI({
  availableTypes,
  availableTypologies,
  availableRegions,
  filteredStructures,
  onStructureSelect,
}: SelectionUIProps) {
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
  const structureOptions = useMemo(
    () =>
      filteredStructures
        .map((etab: any) => {
          const displayName =
            etab.etablissement_actuel_lib || etab.etablissement_lib || etab.nom;

          const id =
            etab.etablissement_id_paysage ||
            etab.etablissement_id_paysage_actuel ||
            etab.id;

          return {
            id,
            hasValidPaysageId: !!etab.etablissement_id_paysage,
            label: `${displayName}${etab.etablissement_actuel_region || etab.region
                ? ` — ${etab.etablissement_actuel_region || etab.region}`
                : ""
              }`,
            subtitle: etab.champ_recherche,
            data: etab,
          };
        })
        .sort((a, b) => {
          return a.label.localeCompare(b.label, "fr", { sensitivity: "base" });
        }),
    [filteredStructures]
  );

  const handleStructureSelect = (id?: string) => {
    if (id) {
      const selected = structureOptions.find((opt) => opt.id === id);
      const finalId = selected?.data?.etablissement_id_paysage || id;

      if (!finalId || finalId === "undefined") {
        console.error("Invalid structure ID:", finalId);
        return;
      }

      onStructureSelect(finalId);
    }
  };

  return (
    <Row>
      <Col xs="12" md="8">
        <div className="filter-header fr-mb-2w">
          <Title as="h1" look="h4" className="fr-mb-0">
            Sélectionnez une structure
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
            {availableRegions.map((region) => (
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
            {availableTypologies.map((typo) => (
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

        <div className="fr-mb-3w">
          <div className="fr-select-group">
            <label className="fr-label" htmlFor="structure-select">
              Accéder à une structure
            </label>
            <select
              className="fr-select"
              id="structure-select"
              name="structure"
              value=""
              onChange={(e) => handleStructureSelect(e.target.value)}
            >
              <option value="" disabled>
                Sélectionner une structure
              </option>
              {structureOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Col>
      <Col xs="12" md="4" className="fr-mt-4w text-center">
        <svg
          className="fr-artwork"
          aria-hidden="true"
          viewBox="0 0 80 80"
          width="180px"
          height="180px"
        >
          <use
            className="fr-artwork-decorative"
            href="/artwork/pictograms/buildings/school.svg#artwork-decorative"
          />
          <use
            className="fr-artwork-minor"
            href="/artwork/pictograms/buildings/school.svg#artwork-minor"
          />
          <use
            className="fr-artwork-major"
            href="/artwork/pictograms/buildings/school.svg#artwork-major"
          />
        </svg>
      </Col>
    </Row>
  );
}
