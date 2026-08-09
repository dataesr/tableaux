import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Col, Container, Row } from "@dataesr/dsfr-plus";
import { useFinanceYears, useFinanceEtablissementEvolution } from "../../../api";
import {
  useFinanceStructureDetail,
  useCheckMultipleStructures,
  useCheckStructureExists,
} from "../api";
import PageHeader from "./page-header";
import SectionNavigation from "./section-navigation";
import {
  FinancementsSection,
  SanteFinancierSection,
  MoyensHumainsSection,
  ErcSection,
  EtudiantsSection,
  AnalysesSection,
  ImplantationsSection,
  PositionnementSection,
} from "../sections/sections";
import StructureNotExistsAlert from "./structure-not-exists-alert";
import NoDataForYearAlert from "./no-data-for-year-alert";
import MultipleStructuresSelector from "./multiple-structures-selector";
import DefaultSkeleton from "../../../../../components/charts-skeletons/default";
import Breadcrumb from "../../../components/breadcrumb";
import { DEFAULT_REFERENCE_YEAR } from "../../../config/constants";

export default function StructureView() {
  const [searchParams, setSearchParams] = useSearchParams();

  const selectedYear = searchParams.get("year") || DEFAULT_REFERENCE_YEAR;
  const selectedStructure = searchParams.get("structureId") || "";
  const useHistorical = searchParams.get("useHistorical") === "true";
  const section = searchParams.get("section") || "ressources";

  const { data: yearsData, isLoading: isLoadingYears } = useFinanceYears();
  const years = yearsData?.years || [];

  const { data: evolutionData } = useFinanceEtablissementEvolution(
    selectedStructure,
    !!selectedStructure
  );

  const availableYears = useMemo(() => {
    if (!evolutionData?.length) return years;
    const exerciceSet = new Set(evolutionData.map((d: any) => String(d.exercice)));
    const filtered = years.filter((y: number) => exerciceSet.has(String(y)));
    return filtered.length > 0 ? filtered : years;
  }, [evolutionData, years]);

  const { data: multiplesData, isLoading: isCheckingMultiples } =
    useCheckMultipleStructures(
      selectedStructure,
      String(selectedYear || years[0] || ""),
      !!selectedStructure && !!(selectedYear || years[0]) && !useHistorical
    );

  const { data: existsData, isLoading: isCheckingExists } =
    useCheckStructureExists(
      selectedStructure,
      String(selectedYear || years[0] || ""),
      !!selectedStructure && !!(selectedYear || years[0])
    );

  const showMultipleSelector =
    !useHistorical && multiplesData?.hasMultiples && !isCheckingMultiples;

  // Cas fusion/remplacement : l'établissement actuel est différent ET a des données pour cette année
  const showNotExistsAlert =
    existsData?.isRedirectAvailable === true &&
    existsData.etablissementActuel &&
    existsData.etablissementActuel.etablissement_id_paysage !== selectedStructure;

  // Cas pas de données pour l'année : l'établissement existe mais pas pour cette année
  const showNoDataAlert = existsData && !existsData.exists && !showNotExistsAlert;

  const { data: detailData, isLoading } = useFinanceStructureDetail(
    selectedStructure,
    String(selectedYear || years[0] || ""),
    !!selectedStructure &&
    !!(selectedYear || years[0]) &&
    !showMultipleSelector &&
    !showNotExistsAlert);

  const handleClearSelection = () => {
    const params = Object.fromEntries(searchParams);
    delete params.structureId;
    delete params.useHistorical;
    setSearchParams(params);
  };

  const handleSectionChange = (newSection: string) => {
    const params = Object.fromEntries(searchParams);
    delete params.analysis;
    delete params.analysisDisplay;
    delete params.analysisPrice;
    delete params.analysisValue;
    delete params.chart;
    delete params.filterType;
    delete params.filterTypologie;
    delete params.filterRegion;
    delete params.filterRce;
    delete params.filterDevimmo;
    delete params.positioningChart;
    setSearchParams({ ...params, section: newSection });
  };

  const handleYearChange = (year: string) => {
    const params = Object.fromEntries(searchParams);
    params.year = year;
    delete params.useHistorical;
    setSearchParams(params);
  };

  const renderSectionContent = () => {
    if (!detailData) return null;

    switch (section) {
      case "ressources":
        return (
          <FinancementsSection data={detailData} selectedYear={selectedYear} />
        );
      case "sante-financiere":
        return <SanteFinancierSection data={detailData} />;
      case "moyens-humains":
        return <MoyensHumainsSection data={detailData} />;
      case "erc":
        return <ErcSection data={detailData} />;
      case "diplomes-formations":
        return (
          <EtudiantsSection data={detailData} selectedYear={selectedYear} />
        );
      case "implantations":
        return <ImplantationsSection data={detailData} />;
      case "positionnement":
        return (
          <PositionnementSection
            data={detailData}
            selectedYear={selectedYear}
          />
        );
      case "analyses":
        return (
          <AnalysesSection
            data={detailData}
            selectedStructure={selectedStructure}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading || isCheckingMultiples || isCheckingExists || isLoadingYears) {
    return (
      <main>
        <Container fluid className="etablissement-selector__wrapper">
          <Container className="fr-py-4w">
            <DefaultSkeleton />
          </Container>
        </Container>
      </main>
    );
  }

  if (showNotExistsAlert && existsData?.etablissementActuel) {

    return (
      <main>
        <StructureNotExistsAlert
          etablissementLibHistorique={
            existsData.etablissement_lib_historique || selectedStructure
          }
          etablissementActuel={existsData.etablissementActuel}
          selectedYear={selectedYear}
        />
      </main>
    );
  }

  if (showNoDataAlert) {

    return (
      <NoDataForYearAlert
        etablissementLib={
          existsData?.etablissement_lib_historique || selectedStructure
        }
        selectedYear={selectedYear}
        availableYears={availableYears}
        onYearChange={handleYearChange}
        onClearSelection={handleClearSelection}
      />
    );
  }

  if (showMultipleSelector && multiplesData) {
    return (
      <main>
        <Container fluid className="etablissement-selector__wrapper">
          <Container as="section">
            <Row>
              <Col>
                <Breadcrumb
                  items={[
                    { label: "Accueil", href: "/structures-finance/accueil" },
                    {
                      label:
                        multiplesData.etablissements[0]
                          ?.etablissement_actuel_lib || "Établissement",
                    },
                  ]}
                />
              </Col>
            </Row>
          </Container>
        </Container>
        <MultipleStructuresSelector
          etablissements={multiplesData.etablissements}
          selectedYear={selectedYear}
          etablissementActuelLib={
            multiplesData.etablissements[0]?.etablissement_actuel_lib || ""
          }
        />
      </main>
    );
  }

  if (!detailData) {
    return null;
  }

  return (
    <main>
      <Container fluid className="etablissement-selector__wrapper">
        <Container>
          <Row>
            <Col>
              <Breadcrumb
                items={[
                  { label: "Accueil", href: "/structures-finance/accueil" },
                  {
                    label:
                      detailData?.etablissement_lib ||
                      detailData?.etablissement_actuel_lib ||
                      "Établissement",
                  },
                ]}
              />
            </Col>
          </Row>
          <Row>
            <Col>
              <PageHeader data={detailData} onClose={handleClearSelection} />
            </Col>
          </Row>
        </Container>
      </Container>

      <Container>
        <SectionNavigation
          activeSection={section}
          years={years}
          selectedYear={selectedYear}
          onSectionChange={handleSectionChange}
          onYearChange={handleYearChange}
          data={detailData}
        />
      </Container>

      <Container as="section" className="fr-mt-4w" aria-label={section}>
        {renderSectionContent()}
      </Container>
    </main>
  );
}
