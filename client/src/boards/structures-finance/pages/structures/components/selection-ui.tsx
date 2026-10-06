import { useMemo } from "react";
import { Row, Col, Title, Button } from "@dataesr/dsfr-plus";
import { useFilters } from "../../../utils/useFilters";
import "../../national/styles.scss";

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

        <Row gutters className="fr-mb-3w">
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
                {availableRegions.map((region) => (
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
                {availableTypologies.map((typo) => (
                  <option key={typo} value={typo}>{typo}</option>
                ))}
              </select>
            </div>
          </Col>
        </Row>

        <div className="fr-mb-3w">
          <div className="fr-select-group">
            <label className="fr-label" htmlFor="structure-select">
              Accéder à une structure
              <span className="fr-hint-text">
                La sélection ouvre directement la page de la structure
              </span>
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
