import { Row, Col, Text, DismissibleTag } from "@dataesr/dsfr-plus";
import type { PositioningFilters } from "../../hooks";
import "../../charts/shared.scss";
import "./filters.scss";

interface PositioningFiltersProps {
  data: any[];
  currentStructure: any;
  filters: PositioningFilters;
  onFiltersChange: (filters: PositioningFilters) => void;
}

export default function PositioningFilters({
  currentStructure,
  filters,
  onFiltersChange,
}: PositioningFiltersProps) {
  const structureType =
    currentStructure?.etablissement_actuel_type || currentStructure?.type || "";
  const structureTypologie =
    currentStructure?.etablissement_actuel_typologie ||
    currentStructure?.typologie ||
    "";
  const structureRegion =
    currentStructure?.etablissement_actuel_region ||
    currentStructure?.region ||
    "";
  const structureIsRce = currentStructure?.is_rce === true;
  const structureIsDevimmo = currentStructure?.is_devimmo === true;

  const handleFilterChange = (key: keyof PositioningFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  return (
    <div className="positioning-filters fr-mb-3w">
      <Row gutters>
        <Col xs="12" md="12">
          <div className="positioning-filters__card">
            <div className="positioning-filters__card-header">
              <div className="positioning-filters__icon-wrapper positioning-filters__icon-wrapper--blue">
                <span className="fr-icon-filter-line" aria-hidden="true" />
              </div>
              <Text className="fr-text--sm fr-text--bold text-mention-grey">
                Filtrer la comparaison
              </Text>
            </div>

            <div className="fr-mb-2w">
              <Row gutters>
                <Col xs="12" md="6">
                  <div className="fr-select-group">
                    <label className="fr-label" htmlFor="pos-filter-type">Type</label>
                    <select
                      className="fr-select"
                      id="pos-filter-type"
                      name="type"
                      value={filters.type}
                      onChange={(e) => handleFilterChange("type", e.target.value)}
                    >
                      <option value="">Tous les types</option>
                      <option value="same-type">Même type ({structureType})</option>
                    </select>
                  </div>
                </Col>
                <Col xs="12" md="6">
                  <div className="fr-select-group">
                    <label className="fr-label" htmlFor="pos-filter-region">Région</label>
                    <select
                      className="fr-select"
                      id="pos-filter-region"
                      name="region"
                      value={filters.region}
                      onChange={(e) => handleFilterChange("region", e.target.value)}
                    >
                      <option value="">Toutes les régions</option>
                      <option value="same-region">Même région ({structureRegion})</option>
                    </select>
                  </div>
                </Col>
              </Row>
            </div>

            <div className="fr-mb-2w">
              <Row gutters>
                <Col xs="12" md="6">
                  <div className="fr-select-group">
                    <label className="fr-label" htmlFor="pos-filter-typologie">Typologie</label>
                    <select
                      className="fr-select"
                      id="pos-filter-typologie"
                      name="typologie"
                      value={filters.typologie}
                      onChange={(e) => handleFilterChange("typologie", e.target.value)}
                    >
                      <option value="">Toutes les typologies</option>
                      <option value="same-typologie">Même typologie ({structureTypologie})</option>
                    </select>
                  </div>
                </Col>
                <Col xs="12" md="6">
                  <div className="fr-select-group">
                    <label className="fr-label" htmlFor="pos-filter-rce">RCE</label>
                    <select
                      className="fr-select"
                      id="pos-filter-rce"
                      name="rce"
                      value={filters.rce}
                      onChange={(e) => handleFilterChange("rce", e.target.value)}
                    >
                      <option value="">RCE et non RCE</option>
                      <option value={structureIsRce ? "rce" : "non-rce"}>
                        {structureIsRce ? "RCE uniquement" : "Non RCE uniquement"}
                      </option>
                    </select>
                  </div>
                </Col>
              </Row>
            </div>

            <div>
              <Row gutters>
                <Col xs="12" md="6">
                  <div className="fr-select-group">
                    <label className="fr-label" htmlFor="pos-filter-devimmo">Dévolution immobilière</label>
                    <select
                      className="fr-select"
                      id="pos-filter-devimmo"
                      name="devimmo"
                      value={filters.devimmo}
                      onChange={(e) => handleFilterChange("devimmo", e.target.value)}
                    >
                      <option value="">Avec ou sans dévolution immobilière</option>
                      <option value={structureIsDevimmo ? "devimmo" : "non-devimmo"}>
                        {structureIsDevimmo
                          ? "Avec dévolution immobilière"
                          : "Sans dévolution immobilière"}
                      </option>
                    </select>
                  </div>
                </Col>
              </Row>
            </div>
            {Object.values(filters).some(Boolean) && (
              <div className="fr-mt-2w">
                <div className="fr-text--sm fr-mb-1w">Filtres :</div>
                <div
                  style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}
                >
                  {filters.type && (
                    <DismissibleTag
                      color="blue-cumulus"
                      aria-label={`Retirer filtre type`}
                      onClick={() => handleFilterChange("type", "")}
                    >
                      Même type ({structureType})
                    </DismissibleTag>
                  )}
                  {filters.typologie && (
                    <DismissibleTag
                      color="blue-cumulus"
                      aria-label={`Retirer filtre typologie`}
                      onClick={() => handleFilterChange("typologie", "")}
                    >
                      Même typologie ({structureTypologie})
                    </DismissibleTag>
                  )}
                  {filters.region && (
                    <DismissibleTag
                      color="blue-cumulus"
                      aria-label={`Retirer filtre région`}
                      onClick={() => handleFilterChange("region", "")}
                    >
                      Même région ({structureRegion})
                    </DismissibleTag>
                  )}
                  {filters.rce && (
                    <DismissibleTag
                      color="blue-cumulus"
                      aria-label={`Retirer filtre RCE`}
                      onClick={() => handleFilterChange("rce", "")}
                    >
                      {structureIsRce ? "RCE uniquement" : "Non RCE uniquement"}
                    </DismissibleTag>
                  )}
                  {filters.devimmo && (
                    <DismissibleTag
                      color="blue-cumulus"
                      aria-label={`Retirer filtre dévolution`}
                      onClick={() => handleFilterChange("devimmo", "")}
                    >
                      {structureIsDevimmo
                        ? "Avec dévolution immobilière"
                        : "Sans dévolution immobilière"}
                    </DismissibleTag>
                  )}
                </div>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </div>
  );
}
