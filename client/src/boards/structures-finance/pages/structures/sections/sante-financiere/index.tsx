import { Row, Col, Title, Text } from "@dataesr/dsfr-plus";
import { MetricChartCard } from "../../components/metric-chart-card";
import StatusIndicator from "../../../../components/status-indicator";
import { parseMarkdown } from "../../../../../../utils/format";
import "../styles.scss";
import MetricDefinitionsTable from "../../../../components/metric-definitions/metric-definitions-table";
import { useBudgetInfo } from "../../../../components/budget-warning";
import { getCssColor } from "../../../../../../utils/colors";
import { useMetricEvolution } from "../../api";
import SectionYearSelect from "../../../../../../components/section-year-select";

type FinanceStatus = "alerte" | "vigilance" | "normal";

const euro = (n?: number) =>
  n != null
    ? n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €"
    : "—";

const pct = (n?: number) => (n != null ? `${n.toFixed(1)} %` : "—");

const jours = (n?: number) => {
  if (n == null) return "—";
  const val = n.toFixed(1);
  return `${val} jour${Math.abs(n) > 1 ? "s" : ""}`;
};

const ValueWithStatus = ({
  value,
  status,
  indicateur,
}: {
  value: string;
  status?: string;
  indicateur: string;
}) => (
  <>
    {value}{" "}
    {status && (
      <StatusIndicator
        status={status as FinanceStatus}
        indicateur={indicateur}
      />
    )}
  </>
);

interface SanteFinancierSectionProps {
  data: any;
}

export function SanteFinancierSection({ data }: SanteFinancierSectionProps) {
  const showResultatHorsSie =
    data?.resultat_net_comptable != null &&
    data?.resultat_net_comptable_hors_sie != null &&
    data.resultat_net_comptable !== data.resultat_net_comptable_hors_sie;

  const { hasBudgetData, budgetYears } = useBudgetInfo([
    "resultat_net_comptable",
    "resultat_net_comptable_hors_sie",
    "capacite_d_autofinancement",
    "caf_produits_encaissables",
    "fonds_de_roulement_net_global",
    "besoin_en_fonds_de_roulement",
    "tresorerie",
    "fonds_de_roulement_en_jours_de_fonctionnement",
    "tresorerie_en_jours_de_fonctionnement",
  ]);

  const Metric = ({
    detail,
    format = euro,
    id,
    title,
    titleAs,
    unit,
  }: {
    colSize?: string;
    detail?: string;
    format?: (n?: number) => string;
    id: string;
    title: string;
    titleAs?: "h2" | "h3" | "h4" | "h5" | "h6";
    unit: string;
  }) => (
    <Col xs="12" sm="6" md="4">
      <MetricChartCard
        color={getCssColor("section-sante-financiere")}
        detail={detail}
        evolutionData={useMetricEvolution(id)}
        metricKey={id}
        title={title}
        titleAs={titleAs}
        unit={unit}
        value={
          data[`${id}_etat`] ? (
            <ValueWithStatus
              indicateur={id}
              status={data[`${id}_etat`]}
              value={format(data[id])}
            />
          ) : (
            format(data[id])
          )
        }
      />
    </Col>
  );

  return (
    <section
      id="section-sante-financier"
      aria-labelledby="section-sante-financier-title"
      className="section-container"
    >
      <div className="section-header section-header--year fr-mb-4w">
        <Title
          as="h2"
          look="h5"
          id="section-sante-financier-title"
          className="section-header__title"
        >
          Equilibre financier
        </Title>
        <SectionYearSelect />
      </div>

      {(hasBudgetData || data?.is_rce || data?.contexte_etab) && (
        <div className="fr-callout fr-mb-4w">
          <Title look="h3" as="h3" className="fr-callout__title">
            {[hasBudgetData, data?.is_rce, data?.contexte_etab].filter(Boolean)
              .length > 1
              ? "Points d'attention"
              : "Point d'attention"}
          </Title>

          {data?.contexte_etab && (
            <Text className="fr-callout__text fr-text--sm fr-mb-2w">
              <strong>Contexte établissement</strong>
              <br />
              {data.contexte_etab}
            </Text>
          )}

          {hasBudgetData && (
            <Text className="fr-callout__text fr-text--sm fr-mb-2w">
              <strong>Données budgétaires</strong>
              <br />
              Certaines données de{" "}
              {budgetYears.length === 1 ? "l'année" : "des années"}{" "}
              <strong>{budgetYears.join(", ")}</strong> présentées sur cette
              page sont des données budgétaires qui correspondent à des
              prévisions ou des objectifs financiers établis par
              l'établissement. Elles ne reflètent pas nécessairement les
              réalisations effectives.
            </Text>
          )}

          {data?.is_rce && (
            <>
              <Text className="fr-callout__text fr-text--sm fr-mb-2w">
                <strong>Seuils de vigilance et d'alerte</strong>
                <br />
                Pour les établissements qui bénéficient des responsabilités et
                compétences élargies (RCE), un ou deux niveaux d'alerte ont été
                définis pour chaque indicateur :
              </Text>
              <ul className="fr-callout__text fr-text--sm fr-ml-2w">
                <li>
                  <strong style={{ color: "var(--text-default-warning)" }}>
                    Orange
                  </strong>{" "}
                  : seuil à partir duquel une vigilance particulière doit être
                  accordée sur la santé financière de l'établissement, situation
                  à surveiller.
                </li>
                <li>
                  <strong style={{ color: "var(--text-default-error)" }}>
                    Rouge
                  </strong>{" "}
                  : seuil qui révèle un risque quant à la santé financière de
                  l'établissement. Alerte.
                </li>
              </ul>
              <p className="fr-callout__text fr-text--sm fr-mb-0">
                Ces seuils d'alerte doivent être interprétés au regard de
                l'activité de l'établissement, du groupe disciplinaire auquel il
                appartient et des évènements significatifs intervenus au cours
                de l'exercice. L'appréciation du niveau de risque résulte
                également de l'interprétation d'un ensemble d'indicateurs mis en
                relation les uns avec les autres. Ces alertes doivent toujours
                être contextualisées.
              </p>
            </>
          )}
        </div>
      )}

      {data?.analyse_financiere && (
        <section className="fr-accordion fr-mb-4w">
          <Title as="h3" className="fr-accordion__title">
            <button
              className="fr-accordion__btn"
              aria-expanded="false"
              aria-controls="accordion-synthese"
            >
              Synthèse de l'analyse financière
            </button>
          </Title>
          <div className="fr-collapse" id="accordion-synthese">
            <div
              className="fr-mb-2w"
              dangerouslySetInnerHTML={{
                __html: parseMarkdown(data.analyse_financiere),
              }}
            />
            <Text
              className="fr-text--sm fr-mb-0"
              style={{
                fontStyle: "italic",
                color: "var(--text-mention-grey)",
              }}
            >
              Cette analyse a été générée à l'aide d'un algorithme d'analyse
              financière automatisée, développé pour traiter et interpréter des
              données structurées. L'algorithme utilise les indicateurs
              financiers clés, les états (alerte/vigilance), ainsi que les
              évolutions interannuelles pour produire une synthèse
              contextualisée. Les interprétations sont basées sur des règles
              prédéfinies, et sont adaptées aux spécificités de chaque
              établissement et exercice. Cette approche permet une analyse
              objective, reproductible et exhaustive des données financières.
            </Text>
          </div>
        </section>
      )}

      <div className="fr-mb-4w">
        <Row gutters>
          <Metric
            colSize={showResultatHorsSie ? "6" : "4"}
            detail="Le résultat net comptable mesure les ressources nettes restant à l'établissement à l'issue de l'exercice. Indique la performance financière globale de l'établissement."
            id="resultat_net_comptable"
            title="Résultat net comptable"
            titleAs="h3"
            unit="€"
          />
          {showResultatHorsSie && (
            <Metric
              colSize="6"
              detail="Le résultat net comptable hors services inter-établissements mesure les ressources nettes restant à l'établissement à l'issue de l'exercice sans prendre en compte les services communs à plusieurs établissements (service de documentation par exemple). Indique la performance financière globale de l'établissement."
              id="resultat_net_comptable_hors_sie"
              title="Résultat net comptable hors SIE"
              titleAs="h3"
              unit="€"
            />
          )}
          <Metric
            colSize={showResultatHorsSie ? "6" : "4"}
            detail="Épargne dégagée pendant l'exercice qui permettra d'assurer tout ou partie de l'investissement de l'année et d'augmenter le fonds de roulement."
            id="capacite_d_autofinancement"
            title="Capacité d'autofinancement"
            titleAs="h3"
            unit="€"
          />
          <Metric
            colSize={showResultatHorsSie ? "6" : "4"}
            format={pct}
            id="caf_produits_encaissables"
            title="CAF / Produits encaissables"
            titleAs="h3"
            unit="%"
          />
        </Row>
      </div>

      <div className="fr-mb-4w">
        <Title as="h2" look="h5" className="fr-mb-3w">
          Cycle d'exploitation
        </Title>
        <Row gutters>
          <Metric
            detail="Ressource durable ou structurelle mise à disposition de l'établissement pour financer des emplois (investissements) liés au cycle d'exploitation. Il constitue une marge de sécurité financière destinée à financer une partie de l'actif circulant."
            id="fonds_de_roulement_net_global"
            title="Fonds de roulement net global"
            titleAs="h3"
            unit="€"
          />
          <Metric
            detail="Le besoin en fonds de roulement mesure le décalage entre les encaissements et les décaissements du cycle d'activité."
            id="besoin_en_fonds_de_roulement"
            title="Besoin en fonds de roulement"
            titleAs="h3"
            unit="€"
          />
          <Metric
            detail="Liquidités immédiatement disponibles (caisse, banque, VMP)."
            id="tresorerie"
            title="Trésorerie"
            titleAs="h3"
            unit="€"
          />
          <Metric
            detail={`Expression du fonds de roulement en nombre de jours de fonctionnement. Un fonds de roulement net global de ${Math.ceil(data.fonds_de_roulement_en_jours_de_fonctionnement)} jours signifie que l'établissement peut couvrir ${Math.ceil(data.fonds_de_roulement_en_jours_de_fonctionnement)} jours de dépenses courantes.`}
            format={jours}
            id="fonds_de_roulement_en_jours_de_fonctionnement"
            title="Fonds de roulement en jours de fonctionnement"
            titleAs="h3"
            unit="jours"
          />
          <Metric
            detail="Expression de la trésorerie en nombre de jours de fonctionnement. Indique la durée pendant laquelle l'établissement peut fonctionner sans nouvel encaissement."
            format={jours}
            id="tresorerie_en_jours_de_fonctionnement"
            title="Trésorerie en jours de fonctionnement"
            titleAs="h3"
            unit="jours"
          />
        </Row>
      </div>

      <div className="fr-mb-4w">
        <Title as="h2" look="h5" className="fr-mb-3w">
          Financement de l'activité
        </Title>
        <Row gutters>
          <Metric
            colSize="3"
            detail="Ratio mesurant l'équilibre entre les dépenses réelles (décaissables) et les recettes réelles (encaissables)."
            format={pct}
            id="charges_decaissables_produits_encaissables"
            title="Charges décaissables / Produits encaissables"
            titleAs="h3"
            unit="%"
          />

          {data?.is_rce && (
            <Metric
              colSize="3"
              detail="Indique la part des recettes consacrée à la rémunération du personnel titulaire."
              format={pct}
              id="taux_de_remuneration_des_permanents"
              title="Taux de rémunération des permanents"
              titleAs="h3"
              unit="%"
            />
          )}
          <Metric
            colSize="3"
            detail="Part des ressources propres (hors subventions pour charges de service public) dans les produits totaux. Mesure l'autonomie financière."
            format={pct}
            id="ressources_propres_produits_encaissables"
            title="Ressources propres / Produits encaissables"
            titleAs="h3"
            unit="%"
          />
          <Metric
            colSize="3"
            detail="Ratio entre la masse salariale et les produits. Évalue le poids des coûts salariaux."
            format={pct}
            id="charges_de_personnel_produits_encaissables"
            title="Charges de personnel / Produits encaissables"
            titleAs="h3"
            unit="%"
          />
        </Row>
      </div>

      <div className="fr-mb-4w">
        <Row gutters>
          <Metric
            colSize="6"
            detail="Ratio entre la CAF et les investissements en immobilisations. Indique si l'activité génère suffisamment de ressources pour financer les investissements."
            format={pct}
            id="caf_acquisitions_d_immobilisations"
            title="CAF / Acquisitions d'immobilisations"
            titleAs="h3"
            unit="%"
          />
          <Metric
            colSize="6"
            detail="Le solde budgétaire est un solde intermédiaire de trésorerie, reflétant le flux de trésorerie généré par l'activité de l'organisme au cours d'un exercice."
            id="solde_budgetaire"
            title="Solde budgétaire"
            titleAs="h3"
            unit="€"
          />
        </Row>
      </div>

      <MetricDefinitionsTable
        metricKeys={[
          "resultat_net_comptable",
          "resultat_net_comptable_hors_sie",
          "capacite_d_autofinancement",
          "caf_produits_encaissables",
          "fonds_de_roulement_net_global",
          "besoin_en_fonds_de_roulement",
          "tresorerie",
          "fonds_de_roulement_en_jours_de_fonctionnement",
          "tresorerie_en_jours_de_fonctionnement",
          "charges_decaissables_produits_encaissables",
          "taux_de_remuneration_des_permanents",
          "ressources_propres_produits_encaissables",
          "charges_de_personnel_produits_encaissables",
          "caf_acquisitions_d_immobilisations",
          "solde_budgetaire",
        ]}
      />
    </section>
  );
}
