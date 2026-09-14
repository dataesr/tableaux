import { SubSummary, Summary, SummaryItem, SummaryWrapper } from "../../../../components/summary";

import "./styles.scss";

export default function CustomSideMenu() {
  return (
    <SummaryWrapper className="sticky-summary">
      <Summary title="Sommaire" className="sticky-summary">
        <SummaryItem href="#id1" label="Gestion des URLs" />
        <SummaryItem href="#id2" label="Liste des ids" />
        <SummaryItem href="#id3" label="Ajout d'un graphique" />
        <SummaryItem href="#id4" label="Liste des composants" />
        <SubSummary>
          <SummaryItem href="#id4-board-suggest" label="BoardSuggestComponent" />
          <SummaryItem href="#id4-breadcrumb" label="Breadcrumb" />
          <SummaryItem href="#id4-callout" label="Callout" />
          <SummaryItem href="#id4-chart-footer" label="ChartFooter" />
          <SummaryItem href="#id4-chart-wrapper" label="ChartWrapper" />
          <SummaryItem href="#id4-chart-badge" label="Chart Badge" />
          <SummaryItem href="#id4-cookies" label="Cookies" />
          <SummaryItem href="#id4-copy-button" label="CopyButton" />
          <SummaryItem href="#id4-country-selector" label="CountrySelector" />
          <SummaryItem href="#id4-fields-main-card" label="FieldsMainCard" />
          <SummaryItem href="#id4-filieres-list" label="FilieresList" />
          <SummaryItem href="#id4-filters" label="Filters" />
          <SummaryItem href="#id4-genders-card" label="GendersCard" />
          <SummaryItem href="#id4-generic-card" label="GenericCard" />
          <SummaryItem href="#id4-map" label="Map" />
          <SummaryItem href="#id4-not-found-page" label="NotFoundPage" />
          <SummaryItem href="#id4-queries-creator" label="QueriesCreator" />
          <SummaryItem href="#id4-router-link" label="RouterLink" />
          <SummaryItem href="#id4-scroll-to-top" label="ScrollToTop" />
          <SummaryItem href="#id4-sectors-card" label="SectorsCard" />
          <SummaryItem href="#id4-students-card" label="StudentsCard" />
          <SummaryItem href="#id4-students-card-with-trend" label="StudentsCardWithTrend" />
          <SummaryItem href="#id4-summary" label="Summary" />
          <SummaryItem href="#id4-switch-theme" label="SwitchTheme" />
          <SummaryItem href="#id4-template" label="Template" />
        </SubSummary>
        <SummaryItem href="#id5" label="Serveur" />
        <SummaryItem href="#id6" label="Gestion des CSS" />
      </Summary>
    </SummaryWrapper>
  );
}
