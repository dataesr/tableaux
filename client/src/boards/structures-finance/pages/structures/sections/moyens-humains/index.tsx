import { Row, Col, Title } from "@dataesr/dsfr-plus";
import { useMetricEvolution } from "../../api";
import { MetricChartCard } from "../../components/metric-chart-card";
import "../styles.scss";
import MetricDefinitionsTable from "../../../../components/metric-definitions/metric-definitions-table";
import { getCssColor } from "../../../../../../utils/colors";
import SectionYearSelect from "../../../../../../components/section-year-select";

interface MoyensHumainsSectionProps {
  data: any;
}

export function MoyensHumainsSection({ data }: MoyensHumainsSectionProps) {
  return (
    <section
      id="section-moyens-humains"
      aria-labelledby="section-moyens-humains-title"
      className="section-container"
    >
      {/* <div className="section-header fr-mb-5w">
        <Title
          as="h2"
          look="h5"
          id="section-moyens-humains-title"
          className="section-header__title"
        >
          Les enseignants permanents
        </Title>
      </div>

      <SectionBudgetWarning
        metrics={[
          "charges_de_personnel",
          "charges_de_personnel_produits_encaissables",
          "taux_de_remuneration_des_permanents",
        ]}
      />

      <div className="fr-mb-5w">
        <Row gutters>
          <Col xs="12" md="6">
            <MetricChartCard
              title="Nombre d'emplois d’enseignants"
              value={
                data.emploi_etpt != null
                  ? data.emploi_etpt.toLocaleString("fr-FR", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 1,
                    })
                  : "—"
              }
              detail="Équivalent temps plein travaillé (ETPT)"
              color={getCssColor("section-moyens-humains")}
              evolutionData={useMetricEvolution("emploi_etpt")}
              unit="ETPT"
            />
          </Col>
          <Col xs="12" md="6">
            <MetricChartCard
              title="Taux d'encadrement"
              value={
                data.taux_encadrement != null
                  ? `${data.taux_encadrement.toLocaleString("fr-FR", {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    })} étudiants par emploi d'enseignant`
                  : "—"
              }
              detail={
                data.effectif_sans_cpge
                  ? `Pour ${data.effectif_sans_cpge.toLocaleString(
                      "fr-FR"
                    )} étudiants`
                  : "Enseignants permanents"
              }
              color={getCssColor("section-moyens-humains")}
              evolutionData={useMetricEvolution("taux_encadrement")}
              unit="%"
            />
          </Col>
        </Row>
      </div> */}

      <div>
        <div className="section-header section-header--year fr-mb-3w">
          <Title
            as="h2"
            look="h5"
            id="section-moyens-humains-title"
            className="section-header__title"
          >
            La masse salariale
          </Title>
          <SectionYearSelect />
        </div>
        <Row gutters>
          <Col xs="12" sm="6" md="4">
            <MetricChartCard
              title="Charges de personnel"
              value={
                data.charges_de_personnel != null
                  ? `${Number(data.charges_de_personnel).toLocaleString(
                    "fr-FR",
                    {
                      maximumFractionDigits: 0,
                    }
                  )} €`
                  : "—"
              }
              detail="Dépenses de masse salariale"
              color={getCssColor("section-moyens-humains")}
              evolutionData={useMetricEvolution("charges_de_personnel")}
              unit="€"
              metricKey="charges_de_personnel"
            />
          </Col>
          <Col xs="12" sm="6" md="4">
            <MetricChartCard
              title="Poids sur produits"
              value={
                data.charges_de_personnel_produits_encaissables != null
                  ? `${data.charges_de_personnel_produits_encaissables.toLocaleString(
                    "fr-FR",
                    {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    }
                  )} %`
                  : "—"
              }
              detail="Part des produits encaissables"
              color={getCssColor("section-moyens-humains")}
              evolutionData={useMetricEvolution(
                "charges_de_personnel_produits_encaissables"
              )}
              unit="%"
              metricKey="charges_de_personnel_produits_encaissables"
            />
          </Col>
          {data?.is_rce && (
            <Col xs="12" md="4">
              <MetricChartCard
                title="Rémunération permanents"
                value={
                  data.taux_de_remuneration_des_permanents != null
                    ? `${data.taux_de_remuneration_des_permanents.toLocaleString(
                      "fr-FR",
                      {
                        minimumFractionDigits: 1,
                        maximumFractionDigits: 1,
                      }
                    )} %`
                    : "—"
                }
                detail="Part des dépenses de personnel"
                color={getCssColor("section-moyens-humains")}
                evolutionData={useMetricEvolution(
                  "taux_de_remuneration_des_permanents"
                )}
                unit="%"
              />
            </Col>
          )}
        </Row>
      </div>

      <MetricDefinitionsTable
        metricKeys={[
          "emploi_etpt",
          "taux_encadrement",
          "charges_de_personnel",
          "charges_de_personnel_produits_encaissables",
          "taux_de_remuneration_des_permanents",
        ]}
      />
    </section>
  );
}
