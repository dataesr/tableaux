import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Row, Col } from "@dataesr/dsfr-plus";
import EvolutionChart from "./charts";
import { useAnalysesWithData } from "./useAnalysesWithData";
import AnalysisFilter from "./analysis-filter";
import {
  AnalysesSectionWrapper,
  EmptyState,
} from "../../components/analyses/section-wrapper";
import "../styles.scss";
import { AnalysisKey } from "../../../../config/metrics-config";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";

interface AnalysesSectionProps {
  data: any;
  selectedStructure?: string;
}

export function AnalysesSection({
  data,
  selectedStructure,
}: AnalysesSectionProps) {
  const etablissementId = selectedStructure || "";
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedAnalysisParam = searchParams.get(
    "analysis"
  ) as AnalysisKey | null;

  const { analysesWithData, periodText, isLoading } =
    useAnalysesWithData(etablissementId);

  useEffect(() => {
    if (analysesWithData.size === 0) return;

    if (selectedAnalysisParam && analysesWithData.has(selectedAnalysisParam)) {
      return;
    }

    const fallbackAnalysis = Array.from(analysesWithData)[0];
    if (!fallbackAnalysis) return;

    const params = new URLSearchParams(searchParams);
    params.set("analysis", fallbackAnalysis);
    setSearchParams(params, { replace: true });
  }, [analysesWithData, selectedAnalysisParam, searchParams, setSearchParams]);

  const selectedAnalysis =
    selectedAnalysisParam && analysesWithData.has(selectedAnalysisParam)
      ? selectedAnalysisParam
      : null;

  const handleSelectAnalysis = (analysis: AnalysisKey) => {
    const params = new URLSearchParams(searchParams);
    params.set("analysis", analysis);
    setSearchParams(params, { replace: true });
  };

  if (isLoading) {
    return (
      <AnalysesSectionWrapper>
        <Row gutters>
          <Col md="4" xs="12">
            <DefaultSkeleton height="400px" />
          </Col>
          <Col md="8" xs="12">
            <DefaultSkeleton height="400px" />
          </Col>
        </Row>
      </AnalysesSectionWrapper>
    );
  }

  if (analysesWithData.size === 0) {
    return (
      <AnalysesSectionWrapper>
        <div className="fr-alert fr-alert--info" role="status">
          <p>Aucune donnée d'évolution disponible pour cet établissement</p>
        </div>
      </AnalysesSectionWrapper>
    );
  }

  return (
    <AnalysesSectionWrapper>
      <Row gutters>
        <Col md="4" xs="12">
          <AnalysisFilter
            analysesWithData={analysesWithData}
            selectedAnalysis={selectedAnalysis}
            onSelectAnalysis={handleSelectAnalysis}
          />
        </Col>

        <Col md="8" xs="12">
          {!selectedAnalysis && (
            <EmptyState message="Sélectionnez une analyse pour afficher le graphique" />
          )}

          {selectedAnalysis && (
            <EvolutionChart
              etablissementId={etablissementId}
              etablissementName={data.etablissement_lib}
              selectedAnalysis={selectedAnalysis}
              periodText={periodText}
            />
          )}
        </Col>
      </Row>
    </AnalysesSectionWrapper>
  );
}
