import { Row, Col, Title } from "@dataesr/dsfr-plus";
import { useMetricEvolution } from "../../api";
import { MetricChartCard } from "../../components/metric-chart-card";
import RessourcesPropresChart from "./charts/ressources-propres";
import "../styles.scss";
import MetricDefinitionsTable from "../../../../components/metric-definitions/metric-definitions-table";
import { SectionBudgetWarning } from "../../../../components/budget-warning";
import { getCssColor } from "../../../../../../utils/colors";
import SectionYearSelect from "../../../../../../components/section-year-select";

const euro = (n?: number) =>
  n != null ? n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) : "—";

interface FinancementsSectionProps {
  data: any;
  selectedYear?: string | number;
}

export function FinancementsSection({
  data,
  selectedYear,
}: FinancementsSectionProps) {
  return (
    <section
      id="section-financements"
      aria-labelledby="section-financements-title"
      className="section-container"
    >
      <div className="section-header section-header--year fr-mb-4w">
        <Title
          as="h2"
          look="h5"
          id="section-financements-title"
          className="section-header__title"
        >
          Les ressources de l'établissement
        </Title>
        <SectionYearSelect />
      </div>

      <SectionBudgetWarning
        metrics={[
          "produits_de_fonctionnement_encaissables",
          "recettes_propres",
          "ressources_propres_produits_encaissables",
          "tot_ress_formation",
          "tot_ress_recherche",
          "tot_ress_autres_recette",
        ]}
      />

      <div className="fr-mb-4w">
        <Row gutters>
          <Col xs="12" md="4">
            <MetricChartCard
              titleAs="h3"
              title="Total"
              value={`${euro(data.produits_de_fonctionnement_encaissables)} €`}
              detail="Hors opérations en capital"
              color={getCssColor("section-ressources")}
              evolutionData={useMetricEvolution(
                "produits_de_fonctionnement_encaissables"
              )}
              unit="€"
              metricKey="produits_de_fonctionnement_encaissables"
            />
          </Col>
          <Col xs="12" md="4">
            <MetricChartCard
              titleAs="h3"
              title="Ressources propres"
              value={`${euro(data.recettes_propres)} €`}
              color={getCssColor("section-ressources")}
              evolutionData={useMetricEvolution("recettes_propres")}
              unit="€"
              metricKey="recettes_propres"
            />
          </Col>
          <Col xs="12" md="4">
            <MetricChartCard
              titleAs="h3"
              title="Autonomie financière"
              value={
                data.ressources_propres_produits_encaissables != null
                  ? `${data.ressources_propres_produits_encaissables.toFixed(1)} %`
                  : "—"
              }
              detail="Part des ressources propres sur le total"
              color={getCssColor("section-ressources")}
              evolutionData={useMetricEvolution(
                "ressources_propres_produits_encaissables"
              )}
              unit="%"
              metricKey="ressources_propres_produits_encaissables"
            />
          </Col>
        </Row>
      </div>

      {/* <div className="fr-mb-4w">
        <Title as="h3" look="h5" className="fr-mb-3w">
          Financements attribués à l’établissement par le ministère en charge de
          l'Enseignement supérieur
        </Title>
        <Row gutters>
          <Col xs="12" md="3">
            <MetricChartCard
              title="Dotation du ministère en charge de l'Enseignement supérieur"
              value={`${euro(data.scsp)} €`}
              detail={
                data.is_rce === false
                  ? "Subvention pour charges de service public (SCSP) et dépenses de personnel prises en charge par le ministère en charge de l'Enseignement supérieur"
                  : "Subvention pour charges de service public (SCSP) "
              }
              color={getCssColor("section-ressources")}
              evolutionData={useMetricEvolution("scsp")}
              unit="€"
            />
          </Col>

          <Col xs="12" md="3">
            <MetricChartCard
              title={`Dotation du ministère en charge de l'Enseignement supérieur par étudiant financé`}
              value={`${euro(data.scsp_par_etudiants)} €`}
              detail={
                data.scsp_etudiants
                  ? `${data.is_rce === false ? "Subvention pour charges de service public (SCSP) (inclut la masse salariale prise en charge par le ministère en charge de l'Enseignement supérieur). " : "Subvention pour charges de service public (SCSP)"}${data.etablissement_categorie === "École normale supérieure" ? " (inclut le salaire des élèves fonctionnaires)" : ""}`
                  : data.is_rce === false
                    ? `Ratio SCSP / étudiants financés (inclut la masse salariale prise en charge par le ministère en charge de l'Enseignement supérieur)${data.etablissement_categorie === "École normale supérieure" ? " et le salaire des élèves fonctionnaires" : ""}`
                    : `Ratio SCSP / étudiants financés${data.etablissement_categorie === "École normale supérieure" ? " (inclut le salaire des élèves fonctionnaires)" : ""}`
              }
              color={getCssColor("section-ressources")}
              evolutionData={useMetricEvolution("scsp_par_etudiants")}
              unit="€"
            />
          </Col>
          <Col xs="12" md="3">
            <MetricChartCard
              title={`Nombre d'étudiants financés par le ministère en charge de l'Enseignement supérieur`}
              value={
                data.scsp_etudiants != null
                  ? `${data.scsp_etudiants.toLocaleString("fr-FR")} étudiant${data.scsp_etudiants > 1 ? "s" : ""} en ${data.anuniv}`
                  : "—"
              }
              color={getCssColor("section-ressources")}
              evolutionData={useMetricEvolution("scsp_etudiants")}
              unit="étudiants"
            />
          </Col>
          <Col xs="12" md="3">
            <MetricChartCard
              title="Part des étudiants financés"
              value={
                data.part_scsp_etudiants_effectif_sans_cpge != null
                  ? `${data.part_scsp_etudiants_effectif_sans_cpge.toFixed(1)} %`
                  : "—"
              }
              color={getCssColor("section-ressources")}
              evolutionData={useMetricEvolution(
                "part_scsp_etudiants_effectif_sans_cpge"
              )}
              unit="%"
            />
          </Col>
        </Row>
      </div> */}

      <div className="fr-mb-4w">
        <Title as="h2" look="h5" className="fr-mb-3w">Détail des ressources propres</Title>
        <Row gutters>
          <Col xs="12" sm="6" md="4">
            <MetricChartCard
              titleAs="h3"
              title="Ressources propres liées aux activités de formation"
              value={
                data.tot_ress_formation != null
                  ? `${data.tot_ress_formation.toLocaleString("fr-FR", {
                    maximumFractionDigits: 0,
                  })} €`
                  : "—"
              }
              detail={
                data.part_ress_formation != null
                  ? `${data.part_ress_formation.toFixed(1)} % des ressources propres`
                  : "Part des ressources propres"
              }
              color={getCssColor("section-ressources")}
              evolutionData={useMetricEvolution("tot_ress_formation")}
              unit="€"
              metricKey="tot_ress_formation"
            />
          </Col>
          <Col xs="12" sm="6" md="4">
            <MetricChartCard
              title="Ressources propres liées aux activités de recherche"
              titleAs="h3"
              value={
                data.tot_ress_recherche != null
                  ? `${data.tot_ress_recherche.toLocaleString("fr-FR", {
                    maximumFractionDigits: 0,
                  })} €`
                  : "—"
              }
              detail={
                data.part_ress_recherche != null
                  ? `${data.part_ress_recherche.toFixed(1)} % des ressources propres`
                  : "Part des ressources propres"
              }
              color={getCssColor("section-ressources")}
              evolutionData={useMetricEvolution("tot_ress_recherche")}
              unit="€"
              metricKey="tot_ress_recherche"
            />
          </Col>
          <Col xs="12" md="4">
            <MetricChartCard
              title="Autres ressources propres"
              titleAs="h3"
              value={
                data.tot_ress_autres_recette != null
                  ? `${data.tot_ress_autres_recette.toLocaleString("fr-FR", {
                    maximumFractionDigits: 0,
                  })} €`
                  : "—"
              }
              detail={
                data.part_ress_autres_recette != null
                  ? `${data.part_ress_autres_recette.toFixed(1)} % des ressources propres`
                  : "Part des ressources propres"
              }
              color={getCssColor("section-ressources")}
              evolutionData={useMetricEvolution("tot_ress_autres_recette")}
              unit="€"
              metricKey="tot_ress_autres_recette"
            />
          </Col>
        </Row>
      </div>

      <div className="fr-mb-4w">
        <RessourcesPropresChart
          data={data}
          selectedYear={selectedYear}
          etablissementName={data?.etablissement_lib}
        />
      </div>

      <MetricDefinitionsTable
        metricKeys={[
          "produits_de_fonctionnement_encaissables",
          "recettes_propres",
          "ressources_propres_produits_encaissables",
          // "scsp",
          // "scsp_par_etudiants",
          // "scsp_etudiants",
          // "part_scsp_etudiants_effectif_sans_cpge",
          "tot_ress_formation",
          "tot_ress_recherche",
          "tot_ress_autres_recette",
        ]}
      />
    </section>
  );
}
