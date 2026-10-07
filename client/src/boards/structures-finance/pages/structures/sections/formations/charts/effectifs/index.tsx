import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import { Row, Col } from "@dataesr/dsfr-plus";
import { useFinanceEtablissementEvolution } from "../../../../../../api";
import {
  createEffectifsNiveauChartOptions,
  createEffectifsSpecifiquesChartOptions,
  createEffectifsDisciplinesChartOptions,
  createEffectifsDegreesChartOptions,
} from "./options";
import ChartWrapper from "../../../../../../../../components/chart-wrapper";

interface EffectifsChartProps {
  data: any;
  selectedYear?: string | number;
}

export default function EffectifsChart({
  data: propData,
  selectedYear: propSelectedYear,
}: EffectifsChartProps) {
  const [searchParams] = useSearchParams();
  const etablissementId = searchParams.get("structureId") || "";
  const selectedYear = propSelectedYear || searchParams.get("year") || "";

  const { data: evolutionData } = useFinanceEtablissementEvolution(
    etablissementId,
    !!etablissementId
  );

  const data = useMemo(() => {
    if (propData) return propData;
    if (!evolutionData || !selectedYear) return null;
    return evolutionData.find(
      (item: any) => String(item.exercice) === String(selectedYear)
    );
  }, [propData, evolutionData, selectedYear]);

  const hasCursusData =
    data?.has_effectif_l || data?.has_effectif_m || data?.has_effectif_d;

  const hasSpecifiquesData =
    (data?.has_effectif_iut && data?.effectif_sans_cpge_iut > 0) ||
    (data?.has_effectif_ing && data?.effectif_sans_cpge_ing > 0) ||
    (data?.has_effectif_sante && data?.effectif_sans_cpge_sante > 0);

  const hasDisciplinesData =
    (data?.has_effectif_dsa && data?.effectif_sans_cpge_dsa > 0) ||
    (data?.has_effectif_llsh && data?.effectif_sans_cpge_llsh > 0) ||
    (data?.has_effectif_theo && data?.effectif_sans_cpge_theo > 0) ||
    (data?.has_effectif_si && data?.effectif_sans_cpge_si > 0) ||
    (data?.has_effectif_staps && data?.effectif_sans_cpge_staps > 0) ||
    (data?.has_effectif_sante && data?.effectif_sans_cpge_sante > 0) ||
    (data?.has_effectif_veto && data?.effectif_sans_cpge_veto > 0) ||
    (data?.has_effectif_interd && data?.effectif_sans_cpge_interd > 0);

  const hasDegreesData =
    (data?.effectif_sans_cpge_deg0 || 0) > 0 ||
    (data?.effectif_sans_cpge_deg1 || 0) > 0 ||
    (data?.effectif_sans_cpge_deg2 || 0) > 0 ||
    (data?.effectif_sans_cpge_deg3 || 0) > 0 ||
    (data?.effectif_sans_cpge_deg4 || 0) > 0 ||
    (data?.effectif_sans_cpge_deg5 || 0) > 0 ||
    (data?.effectif_sans_cpge_deg6 || 0) > 0 ||
    (data?.effectif_sans_cpge_deg9 || 0) > 0;

  const cursusOptions = useMemo(() => {
    if (!data) return {} as Highcharts.Options;
    return createEffectifsNiveauChartOptions(data);
  }, [data]);

  const specifiquesOptions = useMemo(() => {
    if (!data) return {} as Highcharts.Options;
    return createEffectifsSpecifiquesChartOptions(data);
  }, [data]);

  const disciplinesOptions = useMemo(() => {
    if (!data) return {} as Highcharts.Options;
    return createEffectifsDisciplinesChartOptions(data);
  }, [data]);

  const degreesOptions = useMemo(() => {
    if (!data) return {} as Highcharts.Options;
    return createEffectifsDegreesChartOptions(data);
  }, [data]);

  if (!data) return null;

  const niveauConfig = {
    id: "effectifs-niveau-chart",
    integrationURL: `/integration?chart_id=effectifs-niveau&structureId=${etablissementId}&year=${selectedYear}`,
    title: "Par cursus",
  };

  const specifiquesConfig = {
    id: "effectifs-specifiques-chart",
    integrationURL: `/integration?chart_id=effectifs-specifiques&structureId=${etablissementId}&year=${selectedYear}`,
    title: "Filières spécifiques",
  };

  const disciplinesConfig = {
    id: "effectifs-disciplines-chart",
    integrationURL: `/integration?chart_id=effectifs-disciplines&structureId=${etablissementId}&year=${selectedYear}`,
    title: "Par disciplines",
  };

  const degreesConfig = {
    id: "effectifs-degrees-chart",
    integrationURL: `/integration?chart_id=effectifs-degrees&structureId=${etablissementId}&year=${selectedYear}`,
    title: "Degrés d'étude",
  };

  const renderNiveauChart = () => (
    <ChartWrapper
      config={niveauConfig}
      options={cursusOptions}
    />
  );

  const renderSpecifiquesChart = () => (
    <ChartWrapper
      config={specifiquesConfig}
      options={specifiquesOptions}
    />
  );

  const renderDisciplinesChart = () => (
    <ChartWrapper
      config={disciplinesConfig}
      options={disciplinesOptions}
    />
  );

  const renderDegreesChart = () => (
    <ChartWrapper
      config={degreesConfig}
      options={degreesOptions}
    />
  );

  return (
    <div>
      <Row gutters>
        {hasCursusData && (
          <Col xs="12" lg="4">
            {renderNiveauChart()}
          </Col>
        )}

        {hasDegreesData && (
          <Col xs="12" md="8">
            {renderDegreesChart()}
          </Col>
        )}
      </Row>
      <Row gutters className="fr-mt-3w">
        {hasSpecifiquesData && (
          <Col xs="12" md="8">
            {renderSpecifiquesChart()}
          </Col>
        )}
        {hasDisciplinesData && (
          <Col xs="12" lg="4">
            {renderDisciplinesChart()}
          </Col>
        )}
      </Row>
    </div>
  );
}
