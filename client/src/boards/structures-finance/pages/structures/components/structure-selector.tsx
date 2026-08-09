import { useSearchParams } from "react-router-dom";
import { Col, Container, Row, Text } from "@dataesr/dsfr-plus";
import { useStructuresFilters } from "./useStructuresFilters";
import { useFinanceYears } from "../../../api";
import { DEFAULT_REFERENCE_YEAR } from "../../../config/constants";
import { useFilters } from "../../../utils/useFilters";
import SelectionUI from "./selection-ui";
import CardSimple from "../../../../../components/card-simple";
import DefaultSkeleton from "../../../../../components/charts-skeletons/default";
import Breadcrumb from "../../../components/breadcrumb";

export default function StructureSelection() {
  const [, setSearchParams] = useSearchParams();

  const { data: yearsData, isLoading: isLoadingYears } = useFinanceYears();
  const latestYear = (() => {
    if (!yearsData?.years?.length) return DEFAULT_REFERENCE_YEAR;
    return String(Math.max(...yearsData.years));
  })();

  const {
    selectedType,
    selectedTypologie,
    selectedRegion,
    selectedRce,
    selectedDevimmo,
  } = useFilters();

  const {
    availableTypes,
    availableRegions,
    availableTypologies,
    filteredEtablissements,
    isLoading: isLoadingStructures,
  } = useStructuresFilters({
    selectedYear: latestYear,
    selectedType: selectedType || "tous",
    selectedRegion: selectedRegion || "toutes",
    selectedTypologie: selectedTypologie || "toutes",
    selectedRce: selectedRce || "tous",
    selectedDevimmo: selectedDevimmo || "tous",
  });

  const isLoading = isLoadingYears || isLoadingStructures;

  const handleStructureSelect = (id: string) => {
    setSearchParams({
      structureId: id,
      section: "ressources",
      year: DEFAULT_REFERENCE_YEAR,
    });
  };

  return (
    <main>
      <Container fluid className="etablissement-selector__wrapper">
        <Container as="section">
          <Row>
            <Col>
              <Breadcrumb
                items={[
                  { label: "Accueil", href: "/structures-finance/accueil" },
                  { label: "Sélectionner un établissement" },
                ]}
              />
            </Col>
          </Row>
          {isLoading ? (
            <Row>
              <Col>
                <DefaultSkeleton />
              </Col>
            </Row>
          ) : (
            <Row>
              <Col>
                <SelectionUI
                  availableTypes={availableTypes}
                  availableTypologies={availableTypologies}
                  availableRegions={availableRegions}
                  filteredStructures={filteredEtablissements}
                  onStructureSelect={handleStructureSelect}
                />
              </Col>
            </Row>
          )}
        </Container>
      </Container>

      {!isLoading && filteredEtablissements.length > 0 && (
        <Container
          as="section"
          className="fr-py-4w"
          aria-label="Résultats de recherche"
        >
          <Text size="sm" className="fr-mb-2w" aria-live="polite">
            {filteredEtablissements.length} établissement
            {filteredEtablissements.length > 1 ? "s" : ""} trouvé
            {filteredEtablissements.length > 1 ? "s" : ""}
          </Text>
          <Row gutters className="fr-raw-list">
            {filteredEtablissements.map((etab: any) => {
              const id =
                etab.etablissement_id_paysage ||
                etab.etablissement_id_paysage_actuel ||
                etab.id;
              const displayName = etab.etablissement_lib || "";
              const type = etab.etablissement_actuel_categorie || "";
              const region = etab.etablissement_actuel_region;
              const studentCount = etab.effectif_sans_cpge;
              const year = etab.anuniv;

              return (
                <Col key={id} xs="12" md="6" lg="4">
                  <CardSimple
                    description={region}
                    onClick={() => handleStructureSelect(id)}
                    stat={studentCount}
                    subtitle={type}
                    title={displayName}
                    year={year}
                  />
                </Col>
              );
            })}
          </Row>
        </Container>
      )}
    </main>
  );
}
