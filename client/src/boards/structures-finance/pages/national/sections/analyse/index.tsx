import { useState } from "react";
import { Row, Col, Title } from "@dataesr/dsfr-plus";
import { useSearchParams } from "react-router-dom";
import NationalChart from "./charts";
import AnalysisFilter from "./analysis-filter";
import { type AnalysisKey } from "../../../../config/metrics-config";
import { DEFAULT_REFERENCE_YEAR } from "../../../../config/constants";
import { useFinanceYears } from "../../../../api";
import { useFinanceAdvancedComparison } from "../../../../api";
import { useFilteredNationalData } from "../../hooks/useFilteredNationalData";
import "../../../structures/sections/styles.scss";

interface AnalyseSectionProps {
  selectedType?: string;
  selectedTypologie?: string;
  selectedRegion?: string;
  selectedRce?: string;
  selectedDevimmo?: string;
}

export function AnalyseSection({
  selectedType,
  selectedTypologie,
  selectedRegion,
  selectedRce,
  selectedDevimmo,
}: AnalyseSectionProps) {
  const [searchParams] = useSearchParams();
  const urlYear = searchParams.get("year") || DEFAULT_REFERENCE_YEAR;

  const [localYear, setLocalYear] = useState<string>(urlYear);

  const [selectedAnalysis, setSelectedAnalysis] = useState<AnalysisKey | null>(
    null
  );
  const [selectedCategory, setSelectedCategory] = useState<string>(
    "Ressources financières"
  );

  const { data: yearsData } = useFinanceYears();
  const years = yearsData?.years || [];

  const { data: comparisonData, isLoading } = useFinanceAdvancedComparison(
    {
      annee: localYear,
      type: "",
      typologie: "",
      region: "",
    },
    !!localYear
  );

  const { data: allYearsComparisonData, isLoading: isLoadingAllYears } =
    useFinanceAdvancedComparison(
      {
        type: "",
        typologie: "",
        region: "",
      },
      true
    );

  const allItems = comparisonData?.items || [];

  const allYearsItems = allYearsComparisonData?.items || [];

  const data = useFilteredNationalData(
    allItems,
    selectedType || "",
    selectedTypologie || "",
    selectedRegion || "",
    selectedRce || "",
    selectedDevimmo || ""
  );

  const allYearsData = useFilteredNationalData(
    allYearsItems,
    selectedType || "",
    selectedTypologie || "",
    selectedRegion || "",
    selectedRce || "",
    selectedDevimmo || ""
  );

  return (
    <section
      id="section-comparison"
      role="region"
      className="fr-mb-3w section-container"
    >
      <div className="section-header fr-mb-4w">
        <Title
          as="h2"
          look="h5"
          id="section-comparison-title"
          className="section-header__title"
        >
          Analyses comparatives
        </Title>
      </div>

      <Row gutters>
        <Col md="4" xs="12">
          <AnalysisFilter
            data={data}
            selectedAnalysis={selectedAnalysis}
            selectedCategory={selectedCategory}
            onSelectAnalysis={setSelectedAnalysis}
            onSelectCategory={setSelectedCategory}
          />
        </Col>

        <Col md="8" xs="12">
          {!selectedAnalysis && (
            <div className="fr-p-4w fr-background-alt--grey fr-grid-row fr-grid-row--center fr-grid-row--middle fr-py-10w">
              <div className="fr-text--center">
                <span
                  className="fr-icon-bar-chart-box-line fr-icon--lg fr-text-mention--grey fr-mb-2w fr-displayed"
                  aria-hidden="true"
                />
                <p className="fr-text-mention--grey fr-mb-0">
                  Sélectionnez une analyse pour afficher le graphique comparatif
                </p>
              </div>
            </div>
          )}

          {selectedAnalysis && (
            <NationalChart
              data={data}
              allYearsData={allYearsData}
              selectedAnalysis={selectedAnalysis}
              selectedYear={localYear}
              availableYears={years}
              onYearChange={setLocalYear}
              isLoading={isLoading || isLoadingAllYears}
            />
          )}
        </Col>
      </Row>
    </section>
  );
}
