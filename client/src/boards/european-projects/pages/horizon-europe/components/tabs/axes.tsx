import { useSearchParams } from "react-router-dom";
import { Container, Title } from "@dataesr/dsfr-plus";
import Callout from "../../../../../../components/callout";

import DestinationsFunding from "../../../overview/components/destinations-funding";
import DestinationsOverview from "../../../overview/components/destinations-overview";
import PillarsFunding from "../../../overview/components/pillars-funding";
import PillarsFundingEvo3Years from "../../../overview/charts/pillars-funding-evo-3-years";
import ProgramsFunding from "../../../overview/components/programs-funding";
import ProgramsFundingEvo3Years from "../../../overview/charts/programs-funding-evo-3-years";
import TopicsFunding from "../../../overview/components/topics-funding";
import FundingEvo from "../../../overview/charts/funding-evo";

import { getI18nLabel } from "../../../../../../utils";
import FundingValuesPrograms from "../../../overview/charts/funding-programs";

const i18n = {
  "synthesis-title": { fr: "Synthèse", en: "Synthesis" },
  "pillar-comparison-title": { fr: "Vue par pilier", en: "Pillar overview" },
  "pillar-detail-title": { fr: "Evolution du pilier", en: "Pillar details evolution" },
  "pillar-detail-callout": {
    fr: "Visualisez l'évolution des financements demandés et obtenus pour le pilier sélectionné sur les différentes années du programme Horizon Europe. Cela vous permet d'analyser les tendances de financement et d'évaluer la performance du pilier au fil du temps. Vous pouvez également ajuster l'affichage pour visualister le total des subventions, le nombre total de coordinations ou le nombre total de participations.",
    en: "Visualize the evolution of requested and obtained grants for the selected pillar over the years of the Horizon Europe program. This allows you to analyze funding trends and evaluate the pillar's performance over time. You can also adjust the display to view total grants, total coordinations, or total participations.",
  },
  "pillar-composition": { fr: "Composition du pilier", en: "Pillar composition" },
  "pillar-composition-callout": {
    fr: "Visualisez la répartition des subventions du pilier sélectionné par programme. Cela vous permet d'identifier les programmes les plus financés et de comprendre leur contribution au sein du pilier.",
    en: "Visualize the grant distribution of the selected pillar by program. This allows you to identify the most funded programs and understand their contribution within the pillar.",
  },
  "pillar-programs-title": {
    fr: "Composition des piliers",
    en: "Pillar breakdown",
  },
  "main-partner-title": { fr: "Qui sont les bénéficiaires ?", en: "Who are the beneficiaries?" },

  "program-composition": { fr: "Composition du programme", en: "Program composition" },
  "program-composition-callout": {
    fr: "Visualisez la répartition des subventions du programme sélectionné par thématique. Cela vous permet d'identifier les thématiques les plus financées et de comprendre leur contribution au sein du programme.",
    en: "Visualize the grant distribution of the selected program by topic. This allows you to identify the most funded topics and understand their contribution within the program.",
  },
  "program-detail-title": { fr: "Evolution du programme", en: "Program evolution" },
  "program-detail-callout": {
    fr: "Visualisez l'évolution des financements demandés et obtenus pour le programme sélectionné sur les différentes années du programme Horizon Europe. Cela vous permet d'analyser les tendances de financement et d'évaluer la performance du programme au fil du temps. Vous pouvez également ajuster l'affichage pour visualister le total des subventions, le nombre total de coordinations ou le nombre total de participations.",
    en: "Visualize the evolution of requested and obtained grants for the selected program over the years of the Horizon Europe program. This allows you to analyze funding trends and evaluate the program's performance over time. You can also adjust the display to view total grants, total coordinations, or total participations.",
  },

  "thematic-composition": { fr: "Composition du ou des thématiques", en: "Thematic composition" },
  "thematic-composition-callout": {
    fr: "Visualisez la répartition des subventions de la ou des thématiques sélectionnée(s) par destination. Cela vous permet d'identifier les destinations les plus financées et de comprendre leur contribution au sein de la ou des thématiques.",
    en: "Visualize the grant distribution of the selected topic(s) by destination. This allows you to identify the most funded destinations and understand their contribution within the topic(s).",
  },
  "thematic-detail-title": { fr: "Evolution de la thématique", en: "Thematic evolution" },
  "thematic-detail-callout": {
    fr: "Visualisez l'évolution des financements demandés et obtenus pour la ou les thématique(s) sélectionnée(s) sur les différentes années du programme Horizon Europe. Cela vous permet d'analyser les tendances de financement et d'évaluer la performance de la thématique au fil du temps. Vous pouvez également ajuster l'affichage pour visualister le total des subventions, le nombre total de coordinations ou le nombre total de participations.",
    en: "Visualize the evolution of requested and obtained grants for the selected topic over the years of the Horizon Europe program. This allows you to analyze funding trends and evaluate the topic's performance over time. You can also adjust the display to view total grants, total coordinations, or total participations.",
  },

  "destination-detail-title": { fr: "Evolution de la destination", en: "Destination evolution" },
  "destination-detail-callout": {
    fr: "Visualisez l'évolution des financements demandés et obtenus pour la ou les destination(s) sélectionnée(s) sur les différentes années du programme Horizon Europe. Cela vous permet d'analyser les tendances de financement et d'évaluer la performance de la thématique au fil du temps. Vous pouvez également ajuster l'affichage pour visualister le total des subventions, le nombre total de coordinations ou le nombre total de participations.",
    en: "Visualize the evolution of requested and obtained grants for the selected topic over the years of the Horizon Europe program. This allows you to analyze funding trends and evaluate the topic's performance over time. You can also adjust the display to view total grants, total coordinations, or total participations.",
  },

  "no-content": { fr: "Aucun contenu disponible", en: "No content available" },
};

export default function AxesContent() {
  const [searchParams] = useSearchParams();

  const pillarId = searchParams.get("pillarId");
  const programId = searchParams.get("programId");
  const thematicIds = searchParams.get("thematicIds");
  const destinationIds = searchParams.get("destinationIds");
  const currentLang = searchParams.get("language") || "fr";

  // Surcharge du titre si plusieurs thématiques
  if ((thematicIds?.split(/[|,]/).length ?? 0) > 1) {
    i18n["thematic-detail-title"] = { fr: "Evolution des thématiques", en: "Thematics evolution" };
  }
  // Surcharge du titre si plusieurs destinations
  if ((destinationIds?.split(/[|,]/).length ?? 0) > 1) {
    i18n["destination-detail-title"] = { fr: "Evolution des destinations", en: "Destinations evolution" };
  }

  let contentType = "pillar-comparison";
  if (pillarId && programId && thematicIds && destinationIds) {
    contentType = "destination-detail";
  } else if (pillarId && programId && thematicIds) {
    contentType = "thematic-detail";
  } else if (pillarId && programId) {
    contentType = "program-detail";
  } else if (pillarId) {
    contentType = "pillar-detail";
  }

  switch (contentType) {
    case "pillar-comparison":
      return (
        <Container fluid className="fr-pb-3w" as="section">
          <Title as="h2" className="fr-mt-5w">
            {getI18nLabel(i18n, "pillar-comparison-title", currentLang)}
          </Title>
          <PillarsFunding />

          <Title as="h2" className="fr-mt-5w">
            {getI18nLabel(i18n, "pillar-programs-title", currentLang)}
          </Title>
          <FundingValuesPrograms />
        </Container>
      );

    case "pillar-detail":
      return (
        <Container fluid className="fr-pb-3w" as="section">
          <Title as="h2" className="fr-mt-5w">
            {getI18nLabel(i18n, "pillar-detail-title", currentLang)}
          </Title>
          <Callout className="callout-style">{getI18nLabel(i18n, "pillar-detail-callout", currentLang)}</Callout>
          <PillarsFundingEvo3Years />

          <Title as="h2" className="fr-mt-5w">
            {getI18nLabel(i18n, "pillar-composition", currentLang)}
          </Title>
          <Callout className="callout-style">{getI18nLabel(i18n, "pillar-composition-callout", currentLang)}</Callout>
          <ProgramsFunding />
        </Container>
      );

    case "program-detail":
      return (
        <Container fluid className="fr-pb-3w" as="section">
          <Title as="h2" className="fr-mt-5w">
            {getI18nLabel(i18n, "program-detail-title", currentLang)}
          </Title>
          <Callout className="callout-style">{getI18nLabel(i18n, "program-detail-callout", currentLang)}</Callout>
          <ProgramsFundingEvo3Years />
          <Title as="h2" className="fr-mt-5w">
            {getI18nLabel(i18n, "program-composition", currentLang)}
          </Title>
          <Callout className="callout-style">{getI18nLabel(i18n, "program-composition-callout", currentLang)}</Callout>
          <TopicsFunding />
        </Container>
      );

    case "thematic-detail":
      return (
        <Container fluid className="fr-pb-3w" as="section">
          <Title as="h2" className="fr-mt-5w">
            {getI18nLabel(i18n, "thematic-detail-title", currentLang)}
          </Title>
          <Callout className="callout-style">{getI18nLabel(i18n, "thematic-detail-callout", currentLang)}</Callout>
          <FundingEvo />
          <Title as="h2" className="fr-mt-5w">
            {getI18nLabel(i18n, "thematic-composition", currentLang)}
          </Title>
          <Callout className="callout-style">{getI18nLabel(i18n, "thematic-composition-callout", currentLang)}</Callout>
          <DestinationsFunding />
        </Container>
      );

    case "destination-detail":
      return (
        <Container fluid className="fr-pb-3w" as="section">
          <DestinationsOverview />
          <Title as="h2" className="fr-mt-5w">
            {getI18nLabel(i18n, "destination-detail-title", currentLang)}
          </Title>
          <Callout className="callout-style">{getI18nLabel(i18n, "destination-detail-callout", currentLang)}</Callout>
          <FundingEvo />
        </Container>
      );

    default:
      return <div>{getI18nLabel(i18n, "no-content", currentLang)}</div>;
  }
}
