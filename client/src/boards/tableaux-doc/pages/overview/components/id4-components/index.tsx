import { Row, Col, Title, Badge, Text } from "@dataesr/dsfr-plus";
import Callout from "../../../../../../components/callout";
import CopyButton from "../../../../../../components/copy-button";
import CountrySelector from "../../../../../../components/country-selector/selector";
import FieldsMainCard from "../../../../../../components/cards/fields-main-card";
import GendersCard from "../../../../../../components/cards/genders-card";
import GenericCard from "../../../../../../components/cards/generic-card";
import SectorsCard from "../../../../../../components/cards/sectors-card";
import StudentsCard from "../../../../../../components/cards/students-card";
import StudentsCardWithTrend from "../../../../../../components/cards/students-card-with-trend";
import {
  Summary,
  SummaryItem,
  SummaryWrapper,
} from "../../../../../../components/summary";
import { MetricChartCard } from "../../../../../structures-finance/pages/structures/components/metric-chart-card";

export default function Id4Components() {
  return (
    <Row gutters>
      <Col>
        <div id="id4">
          <Title as="h2" look="h4">
            Liste des composants communs
          </Title>
          <Callout>
            Voici la liste des composants réutilisables disponibles dans la
            bibliothèque de composants Tableaux :
            <ul className="components-list">
              <li id="id4-board-suggest">
                <Badge color="purple-glycine">BoardSuggestComponent</Badge>
                &nbsp;: composant de suggestion de tableaux de bord.
                <code>{`<BoardsSuggestComponent />`}</code>
              </li>
              <li id="id4-breadcrumb">
                <Badge color="purple-glycine">Breadcrumb</Badge>&nbsp;: fil
                d'Ariane personnalisé pour la navigation.
              </li>
              <li id="id4-callout">
                <Badge color="purple-glycine">Callout</Badge>&nbsp;: encadré
                d'information avec style visuel distinct.
                <Callout className="fr-mt-1w" colorFamily="blue-cumulus">
                  Exemple de Callout imbriqué pour démontrer la réutilisabilité
                  du composant Callout à l'intérieur d'un autre Callout.
                </Callout>
                <code>
                  {`<Callout>
  Exemple de Callout imbriqué pour démontrer la réutilisabilité du composant Callout à l'intérieur d'un autre Callout.
</Callout>`}
                </code>
              </li>
              <li id="id4-chart-footer">
                <Badge color="purple-glycine">ChartFooter</Badge>&nbsp;: pied de
                page des graphiques avec informations de source et date.
                <code>
                  {`<ChartFooter
  comment={{ fr: <>Commentaire en français</>, en: <>Commentaire en anglais</> }}
  readingKey={{ fr: <>Clé de lecture en français</>, en: <>Clé de lecture en anglais</> }}
  source=Source des données
  updateDate=Date de mise à jour
/>`}
                </code>
              </li>
              <li id="id4-chart-wrapper">
                <Badge color="purple-glycine">ChartWrapper</Badge>&nbsp;:
                composant d'encapsulation des graphiques avec gestion des
                options, de la légende et du rendu tableau.
                <br />
                <code>
                  {`<ChartWrapper
  config={config}
  options={options(data, currentLang)}
  renderData={() => renderDataTable(data, currentLang)}
/>`}
                </code>
              </li>
              <li id="id4-chart-badge">
                <Badge color="purple-glycine">Chart Badge</Badge>&nbsp;: badge
                visuel à placer sur les graphiques (par exemple "Top 15").
                <br />
                <div
                  className="chart-container chart-container--green-emeraude fr-mt-1w"
                  style={{
                    position: "relative",
                    padding: "1rem",
                    minHeight: "80px",
                  }}
                >
                  <span className="chart-badge">Top 15</span>
                </div>
                <br />
                <code>
                  {`<div className="chart-container chart-container--{color}">
  <span className="chart-badge">Top 15</span>
  <ChartWrapper ... />
</div>`}
                </code>
              </li>
              <li id="id4-cookies">
                <Badge color="purple-glycine">Cookies</Badge>&nbsp;: composant
                de gestion des cookies et consentement.
              </li>
              <li id="id4-copy-button">
                <Badge color="purple-glycine">CopyButton</Badge>&nbsp;: bouton
                de copie dans le presse-papier.
                <br />
                <CopyButton text="Texte à copier" />
                <br />
                <code>{`<CopyButton textToCopy="Texte à copier" />`}</code>
              </li>
              <li id="id4-country-selector">
                <Badge color="purple-glycine">CountrySelector</Badge>&nbsp;:
                sélecteur de pays avec recherche.
                <br />
                <CountrySelector />
                <br />
                <code>{`<CountrySelector />`}</code>
              </li>
              <li id="id4-fields-main-card">
                <Badge color="purple-glycine">FieldsMainCard</Badge>&nbsp;:
                carte d'affichage des filières principales.
                <br />
                <FieldsMainCard
                  descriptionNode={
                    <Badge color="yellow-tournesol">description ...</Badge>
                  }
                  number={12}
                  label="Nombre de filières représentées sur le territoire"
                  to={`/atlas/effectifs-par-filiere}`}
                />
                <br />
                <code>
                  {`<FieldsMainCard
  descriptionNode={<Badge color="yellow-tournesol">description ...</Badge>}
  number={12}
  label="Nombre de filières représentées sur le territoire"
  to={/atlas/effectifs-par-filiere}
/>`}
                </code>
              </li>
              <li id="id4-filieres-list">
                <Badge color="purple-glycine">FilieresList</Badge>&nbsp;: liste
                des filières. Nécessite une annee universitaire dans l'URL
                <br />
                <code>{`<FilieresList />`}</code>
              </li>
              <li id="id4-filters">
                <Badge color="purple-glycine">Filters</Badge>&nbsp;: composant
                de filtrage des données.
              </li>
              <li id="id4-genders-card">
                <Badge color="purple-glycine">GendersCard</Badge>&nbsp;: carte
                d'affichage des statistiques par genre.
                <br />
                <GendersCard
                  currentYear="2025-26"
                  values={{
                    labels: ["Masculin", "Féminin"],
                    values: [30, 70],
                  }}
                />
                <br />
                <code>
                  {`<GendersCard
  currentYear="2025-26"
  values={{
    labels: ["label1", "label2"],
    values: [300, 700],
  }}
/>`}
                </code>
              </li>
              <li id="id4-generic-card">
                <Badge color="purple-glycine">GenericCard</Badge>&nbsp;: carte
                générique réutilisable.
                <br />
                <GenericCard
                  description="Tableau de bord du personnel enseignant"
                  title="Personnel enseignant"
                  to="/personnel-enseignant?datasupr"
                />
                <br />
                <code>
                  {`<GenericCard
  description="Tableau de bord du personnel enseignant"
  title="Personnel enseignant"
  to="/personnel-enseignant?datasupr"
/>`}
                </code>
              </li>
              <li id="id4-map">
                <Badge color="purple-glycine">Map</Badge>&nbsp;: composant de
                carte géographique interactive.
              </li>
              <li id="id4-not-found-page">
                <Badge color="purple-glycine">NotFoundPage</Badge>&nbsp;: page
                404 personnalisée.
              </li>
              <li id="id4-queries-creator">
                <Badge color="purple-glycine">QueriesCreator</Badge>&nbsp;:
                créateur de requêtes personnalisées.
              </li>
              <li id="id4-router-link">
                <Badge color="purple-glycine">RouterLink</Badge>&nbsp;:
                composant de lien de navigation.
              </li>
              <li id="id4-scroll-to-top">
                <Badge color="purple-glycine">ScrollToTop</Badge>&nbsp;:
                composant de remontée automatique en haut de page.
              </li>
              <li id="id4-sectors-card">
                <Badge color="purple-glycine">SectorsCard</Badge>&nbsp;: carte
                d'affichage des statistiques par secteur.
                <br />
                <SectorsCard
                  currentYear="2025-26"
                  values={{
                    labels: ["Public", "Privé"],
                    values: [40, 60],
                  }}
                />
                <br />
                <code>
                  {`<SectorsCard
  currentYear="2025-26"
  values={{
    labels: ["Public", "Privé"],
    values: [40, 60],
  }}
/>`}
                </code>
              </li>
              <li id="id4-students-card">
                <Badge color="purple-glycine">StudentsCard</Badge>&nbsp;: carte
                d'affichage des statistiques étudiantes.
                <br />
                <StudentsCard
                  number="12000"
                  descriptionNode={
                    <Text size="sm">année universitaire 2025-26</Text>
                  }
                />
                <br />
                <code>
                  {`<StudentsCard
  number="12000"
  descriptionNode={<Text size="sm">année universitaire 2025-26</Text>}
/>`}
                </code>
              </li>
              <li id="id4-students-card-with-trend">
                <Badge color="purple-glycine">StudentsCardWithTrend</Badge>
                &nbsp;: carte d'affichage des statistiques étudiantes avec
                tendance.
                <br />
                <StudentsCardWithTrend
                  descriptionNode={
                    <Badge color="yellow-tournesol">2025-26</Badge>
                  }
                  number="1234"
                  label="Effectifs étudiants"
                  trendGraph={<>composant graph ici</>}
                />
                <br />
                <code>
                  {`<StudentsCardWithTrend
  descriptionNode={<Badge color="yellow-tournesol">2025-26</Badge>}
  number="1234"
  label="Effectifs étudiants"
  trendGraph={<>composant graph ici</>}
/>`}
                </code>
              </li>
              <li id="id4-summary">
                <Badge color="purple-glycine">Summary</Badge>&nbsp;: composant
                de sommaire avec navigation par ancres. Utiliser avec{" "}
                <Badge color="purple-glycine">SummaryWrapper</Badge> pour un
                sommaire collapsible sur mobile.
                <br />
                <SummaryWrapper>
                  <Summary title="Exemple de sommaire">
                    <SummaryItem href="#id1" label="Section 1" />
                    <SummaryItem href="#id2" label="Section 2" />
                    <SummaryItem href="#id3" label="Section 3" />
                  </Summary>
                </SummaryWrapper>
                <br />
                <code>
                  {`<SummaryWrapper>
  <Summary title="Sommaire" className="sticky-summary">
    <SummaryItem href="#section-1" label="Section 1" />
    <SummaryItem href="#section-2" label="Section 2" />
    <SummaryItem href="#section-3" label="Section 3" />
  </Summary>
</SummaryWrapper>`}
                </code>
              </li>
              <li id="id4-switch-theme">
                <Badge color="purple-glycine">SwitchTheme</Badge>&nbsp;:
                composant de changement de thème (clair/sombre).
              </li>
              <li id="id4-template">
                <Badge color="purple-glycine">Template</Badge>&nbsp;: composant
                template de base.
              </li>
              <li id="id4-metric-chart-card">
                <Badge color="purple-glycine">MetricChartCard</Badge>&nbsp;:
                carte de métrique avec graphique d'évolution et tendance.
                <br />
                <div style={{ maxWidth: "400px" }}>
                  <MetricChartCard
                    title="Budget total"
                    value="180 M€"
                    detail="Exercice 2024"
                    evolutionData={[
                      { exercice: 2020, value: 150000000 },
                      { exercice: 2021, value: 160000000 },
                      { exercice: 2022, value: 165000000 },
                      { exercice: 2023, value: 175000000 },
                      { exercice: 2024, value: 180000000 },
                    ]}
                    unit="€"
                  />
                </div>
                <br />
                <code>
                  {`<MetricChartCard
  title="Budget total"
  value="180 M€"
  detail="Exercice 2024"
  evolutionData={[
    { exercice: 2020, value: 150000000 },
    { exercice: 2021, value: 160000000 },
    { exercice: 2022, value: 165000000 },
    { exercice: 2023, value: 175000000 },
    { exercice: 2024, value: 180000000 },
  ]}
  unit="€"
/>`}
                </code>
              </li>
            </ul>
          </Callout>
        </div>
      </Col>
    </Row>
  );
}
