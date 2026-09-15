import { Row, Col, Title } from "@dataesr/dsfr-plus";
import EffectifsChart from "./charts/effectifs";
import { MetricChartCard } from "../../components/metric-chart-card";
import "../styles.scss";
import MetricDefinitionsTable from "../../../../components/metric-definitions/metric-definitions-table";
import { getCssColor } from "../../../../../../utils/colors";
import { useMetricEvolution } from "../../api";
import SectionYearSelect from "../../../../../../components/section-year-select";

interface EtudiantsSectionProps {
  data: any;
  selectedYear?: string | number;
}

const num = (n?: number) =>
  n != null ? n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) : "—";

export function EtudiantsSection({
  data,
  selectedYear,
}: EtudiantsSectionProps) {
  const effectifEvolution = useMetricEvolution("effectif_sans_cpge");
  const effectifDnEvolution = useMetricEvolution("effectif_sans_cpge_dn");
  const effectifDuEvolution = useMetricEvolution("effectif_sans_cpge_du");

  return (
    <section
      id="section-etudiants"
      aria-labelledby="section-etudiants-title"
      className="section-container"
    >
      <div className="section-header section-header--year fr-mb-4w">
        <Title
          as="h2"
          look="h5"
          id="section-etudiants-title"
          className="section-header__title"
        >
          Les étudiants inscrits en {`${data.anuniv}`}
        </Title>
        <SectionYearSelect />
      </div>

      <div className="fr-mb-4w">
        <Row gutters>
          <Col xs="12" md="4">
            <MetricChartCard
              title="Total des étudiants"
              titleAs="h3"
              value={`${num(data.effectif_sans_cpge)} étudiants inscrits`}
              detail="Hors doubles inscriptions CPGE"
              color={getCssColor("section-diplomes-formations")}
              evolutionData={effectifEvolution}
            />
          </Col>
          <Col xs="12" md="4">
            <MetricChartCard
              title="Dont dans les diplômes nationaux"
              titleAs="h3"
              value={num(data.effectif_sans_cpge_dn)}
              detail={`${data.effectif_sans_cpge ? ((data.effectif_sans_cpge_dn / data.effectif_sans_cpge) * 100).toFixed(1) : 0}% du total des étudiants inscrits`}
              color={getCssColor("section-diplomes-formations")}
              evolutionData={effectifDnEvolution}
            />
          </Col>
          <Col xs="12" md="4">
            <MetricChartCard
              title="Dont dans les diplômes d'établissement"
              titleAs="h3"
              value={num(data.effectif_sans_cpge_du)}
              detail={`${data.effectif_sans_cpge ? ((data.effectif_sans_cpge_du / data.effectif_sans_cpge) * 100).toFixed(1) : 0}% du total des étudiants inscrits`}
              color={getCssColor("section-diplomes-formations")}
              evolutionData={effectifDuEvolution}
            />
          </Col>
        </Row>
      </div>

      <div className="fr-mb-4w">
        <EffectifsChart data={data} selectedYear={selectedYear} />
      </div>

      <MetricDefinitionsTable
        metricKeys={[
          "effectif_sans_cpge",
          "effectif_sans_cpge_dn",
          "effectif_sans_cpge_du",
        ]}
      />
    </section>
  );
}
