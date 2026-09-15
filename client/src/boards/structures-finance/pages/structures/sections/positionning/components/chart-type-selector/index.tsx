import { Row, Col } from "@dataesr/dsfr-plus";
import { type ChartView } from "../../charts";

const CHART_OPTIONS: { value: ChartView; label: string }[] = [
  { value: "comparison", label: "Comparaison par analyse" },
  { value: "column-range", label: "Variation entre deux années" },
  { value: "scatter-1", label: "Produits vs Effectifs" },
  { value: "scatter-2", label: "SCSP vs Encadrement" },
  { value: "scatter-3", label: "SCSP vs Ressources" },
];

interface ChartTypeSelectorProps {
  activeChart: ChartView;
  onChartChange: (chart: ChartView) => void;
}

export default function ChartTypeSelector({
  activeChart,
  onChartChange,
}: ChartTypeSelectorProps) {
  return (
    <Row gutters className="fr-mb-3w">
      <Col xs="12" md="4" offsetMd="8">
        <div className="fr-select-group">
          <label className="fr-label" htmlFor="positionnement-chart-type">
            Type de graphique
          </label>
          <select
            className="fr-select"
            id="positionnement-chart-type"
            name="chart-type"
            value={activeChart}
            onChange={(e) => onChartChange(e.target.value as ChartView)}
          >
            {CHART_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </Col>
    </Row>
  );
}
