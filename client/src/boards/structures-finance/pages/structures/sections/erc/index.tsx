import { Row, Col, Title } from "@dataesr/dsfr-plus";
import { MetricChartCard } from "../../components/metric-chart-card";
import { useMetricEvolution } from "../../api";
import "../styles.scss";
import MetricDefinitionsTable from "../../../../components/metric-definitions/metric-definitions-table";
import { getCssColor } from "../../../../../../utils/colors";
import SectionYearSelect from "../../../../../../components/section-year-select";

interface ErcSectionProps {
  data: any;
}

export function ErcSection({ data }: ErcSectionProps) {
  const exercice = data.exercice;

  return (
    <section
      id="section-erc"
      aria-labelledby="section-erc-title"
      className="section-container"
    >
      <div className="section-header section-header--year fr-mb-5w">
        <Title
          as="h2"
          look="h5"
          id="section-erc-title"
          className="section-header__title"
        >
          Subvention des projets de recherche exploratoire d'excellence (ERC)
        </Title>
        <SectionYearSelect />
      </div>

      <div className="fr-mb-5w">
        <Row gutters>
          <Col xs="12" md="6">
            <MetricChartCard
              title="Nombre de projets lauréats"
              titleAs="h3"
              value={
                data.erc_nb != null
                  ? `${data.erc_nb.toLocaleString("fr-FR")} projet(s)`
                  : "—"
              }
              detail={`Pour les calls de l'année ${exercice}`}
              color={getCssColor("section-erc")}
              evolutionData={useMetricEvolution("erc_nb")}
              unit="projets"
            />
          </Col>
          <Col xs="12" md="6">
            <MetricChartCard
              title="Subvention obtenue"
              titleAs="h3"
              value={
                data.erc_sub != null
                  ? `${data.erc_sub.toLocaleString("fr-FR")} €`
                  : "—"
              }
              detail={`Pour les calls de l'année ${exercice}`}
              color={getCssColor("section-erc")}
              evolutionData={useMetricEvolution("erc_sub")}
              unit="€"
            />
          </Col>
        </Row>
      </div>

      <div>
        <Title as="h2" look="h5" className="fr-mb-3w">
          Types de projets
        </Title>
        <Row gutters>
          {data.erc_nb_stg != null && data.erc_nb_stg > 0 && (
            <Col xs="12" sm="6" md="4">
              <MetricChartCard
                title="Dont pour les jeunes chercheurs prometteurs"
                titleAs="h3"
                value={`${data.erc_nb_stg.toLocaleString("fr-FR")} projet(s)`}
                detail="Starting Grants"
                color={getCssColor("section-erc")}
              />
            </Col>
          )}
          {data.erc_nb_cog != null && data.erc_nb_cog > 0 && (
            <Col xs="12" sm="6" md="4">
              <MetricChartCard
                title="Dont pour les chercheurs confirmés souhaitant consolider leur équipe"
                titleAs="h3"
                value={`${data.erc_nb_cog.toLocaleString("fr-FR")} projet(s)`}
                detail="Consolidator Grants"
                color={getCssColor("section-erc")}
              />
            </Col>
          )}
          {data.erc_nb_adg != null && data.erc_nb_adg > 0 && (
            <Col xs="12" sm="6" md="4">
              <MetricChartCard
                title="Dont pour les chercheurs expérimentés"
                titleAs="h3"
                value={`${data.erc_nb_adg.toLocaleString("fr-FR")} projet(s)`}
                detail="Advanced Grants"
                color={getCssColor("section-erc")}
              />
            </Col>
          )}
          {data.erc_nb_syg != null && data.erc_nb_syg > 0 && (
            <Col xs="12" sm="6" md="4">
              <MetricChartCard
                title="Dont pour des projets collaboratifs ambitieux"
                titleAs="h3"
                value={`${data.erc_nb_syg.toLocaleString("fr-FR")} projet(s)`}
                detail="Synergy Grants"
                color={getCssColor("section-erc")}
              />
            </Col>
          )}
          {data.erc_nb_poc != null && data.erc_nb_poc > 0 && (
            <Col xs="12" sm="6" md="4">
              <MetricChartCard
                title="Dont pour aider à transformer des résultats de recherche en innovations"
                titleAs="h3"
                value={`${data.erc_nb_poc.toLocaleString("fr-FR")} projet(s)`}
                detail="Proof of Concept"
                color={getCssColor("section-erc")}
              />
            </Col>
          )}
        </Row>
        <Row>
          <Col>
            <MetricDefinitionsTable
              metricKeys={[
                "erc_nb",
                "erc_sub",
                "erc_nb_stg",
                "erc_nb_cog",
                "erc_nb_adg",
                "erc_nb_syg",
                "erc_nb_poc",
              ]}
            />
          </Col>
        </Row>
      </div>
    </section>
  );
}
