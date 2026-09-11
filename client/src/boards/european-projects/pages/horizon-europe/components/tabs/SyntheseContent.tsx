import { useSearchParams } from "react-router-dom";
import { Container, Row, Col, Title } from "@dataesr/dsfr-plus";
import Callout from "../../../../../../components/callout";

import PillarsFunding from "../../../overview/components/pillars-funding";
import ProgramsFunding from "../../../overview/components/programs-funding";
import TopicsFunding from "../../../overview/components/topics-funding";
import DestinationsFunding from "../../../overview/components/destinations-funding";
import PillarsOverview from "../../../overview/components/pillars-overview";
import ProgramsOverview from "../../../overview/components/programs-overview";
import ThematicsOverview from "../../../overview/components/destinations-overview";
import DestinationsOverview from "../../../overview/components/destinations-overview";
import SynthesisFocus from "../../../overview/charts/synthesis-focus";
import PillarsFundingEvo3Years from "../../../overview/charts/pillars-funding-evo-3-years";
import BoardsSuggestComponent from "../../../../../../components/boards-suggest-component";
import ProgramsFundingEvo3Years from "../../../overview/charts/programs-funding-evo-3-years";
import TopicsFundingEvo3Years from "../../../overview/charts/topics-funding-evo-3-years";

import { getI18nLabel } from "../../../../../../utils";

const i18n = {
  "synthesis-title": { fr: "Synthèse", en: "Synthesis" },
  "pillar-comparison-title": { fr: "Comparaison de la répartition des subventions par pilier", en: "Comparison of grant distribution by pillar" },
  "pillar-detail-title": { fr: "Détails du pilier sur les 3 dernières années", en: "Pillar details over the last 3 years" },
  "pillar-detail-callout": {
    fr: "Visualisez l'évolution des subventions demandées et obtenues pour le pilier sélectionné sur les trois dernières années du programme Horizon Europe. Cela vous permet d'analyser les tendances de financement et d'évaluer la performance du pilier au fil du temps. Vous pouvez également ajuster l'affichage pour visualister le total des subventions, le nombre total de coordinations ou le nombre total de participations.",
    en: "Visualize the evolution of requested and obtained grants for the selected pillar over the last three years of the Horizon Europe program. This allows you to analyze funding trends and evaluate the pillar's performance over time. You can also adjust the display to view total grants, total coordinations, or total participations.",
  },
  "pillar-composition": { fr: "Composition du pilier", en: "Pillar composition" },
  "pillar-composition-callout": {
    fr: "Visualisez la répartition des subventions du pilier sélectionné par programme. Cela vous permet d'identifier les programmes les plus financés et de comprendre leur contribution au sein du pilier.",
    en: "Visualize the grant distribution of the selected pillar by program. This allows you to identify the most funded programs and understand their contribution within the pillar.",
  },
  "main-partner-title": { fr: "Qui sont les bénéficiaires ?", en: "Who are the beneficiaries?" },

  "program-detail-title": { fr: "Détails du programme sur les 3 dernières années", en: "Program details over the last 3 years" },
  "program-detail-callout": {
    fr: "Visualisez l'évolution des subventions demandées et obtenues pour le programme sélectionné sur les trois dernières années du programme Horizon Europe. Cela vous permet d'analyser les tendances de financement et d'évaluer la performance du programme au fil du temps. Vous pouvez également ajuster l'affichage pour visualister le total des subventions, le nombre total de coordinations ou le nombre total de participations.",
    en: "Visualize the evolution of requested and obtained grants for the selected program over the last three years of the Horizon Europe program. This allows you to analyze funding trends and evaluate the program's performance over time. You can also adjust the display to view total grants, total coordinations, or total participations.",
  },
  "program-composition": { fr: "Composition du programme", en: "Program composition" },
  "program-composition-callout": {
    fr: "Visualisez la répartition des subventions du programme sélectionné par thématique. Cela vous permet d'identifier les thématiques les plus financées et de comprendre leur contribution au sein du programme.",
    en: "Visualize the grant distribution of the selected program by topic. This allows you to identify the most funded topics and understand their contribution within the program.",
  },
  "thematic-detail-title": { fr: "Détails de ou des thématique(s) sur les 3 dernières années", en: "Thematic details over the last 3 years" },
  "thematic-detail-callout": {
    fr: "Visualisez l'évolution des subventions demandées et obtenues pour la ou les thématique(s) sélectionnée(s) sur les trois dernières années du programme Horizon Europe. Cela vous permet d'analyser les tendances de financement et d'évaluer la performance de la thématique au fil du temps. Vous pouvez également ajuster l'affichage pour visualister le total des subventions, le nombre total de coordinations ou le nombre total de participations.",
    en: "Visualize the evolution of requested and obtained grants for the selected topic over the last three years of the Horizon Europe program. This allows you to analyze funding trends and evaluate the topic's performance over time. You can also adjust the display to view total grants, total coordinations, or total participations.",
  },
  "thematic-composition": { fr: "Composition du ou des thématiques", en: "Thematic composition" },
  "thematic-composition-callout": {
    fr: "Visualisez la répartition des subventions de la ou des thématiques sélectionnée(s) par destination. Cela vous permet d'identifier les destinations les plus financées et de comprendre leur contribution au sein de la ou des thématiques.",
    en: "Visualize the grant distribution of the selected topic(s) by destination. This allows you to identify the most funded destinations and understand their contribution within the topic(s).",
  },
  "no-content": { fr: "Aucun contenu disponible", en: "No content available" },
};

export default function SyntheseContent() {
  const [searchParams] = useSearchParams();

  const pillarId = searchParams.get("pillarId");
  const programId = searchParams.get("programId");
  const thematicIds = searchParams.get("thematicIds");
  const destinationIds = searchParams.get("destinationIds");
  const currentLang = searchParams.get("language") || "fr";

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
        <section className="fr-pb-3w">
          <Title as="h1" look="h2">
            {getI18nLabel(i18n, "synthesis-title", currentLang)}
          </Title>
          <SynthesisFocus />
          <Title as="h2" className="fr-mt-5w">
            {getI18nLabel(i18n, "pillar-comparison-title", currentLang)}
          </Title>
          <PillarsFunding />
        </section>
      );

    case "pillar-detail":
      return (
        <Container fluid className="fr-pb-3w">
          <Row>
            <Col>
              <SynthesisFocus />
            </Col>
          </Row>
          <Row className="fr-mb-3w">
            <Col>
              <PillarsOverview />
            </Col>
          </Row>

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
          <BoardsSuggestComponent />
        </Container>
      );

    case "program-detail":
      return (
        <Container fluid className="fr-pb-3w">
          <Row>
            <Col>
              <SynthesisFocus />
            </Col>
          </Row>
          <Row className="fr-mb-3w">
            <Col>
              <ProgramsOverview />
            </Col>
          </Row>
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
          <BoardsSuggestComponent />
        </Container>
      );

    case "thematic-detail":
      return (
        <Container fluid className="fr-pb-3w">
          <Row>
            <Col>
              <SynthesisFocus />
            </Col>
          </Row>
          <Row className="fr-mb-3w">
            <Col>
              <ThematicsOverview />
            </Col>
          </Row>


          <Title as="h2" className="fr-mt-5w">
            {getI18nLabel(i18n, "thematic-detail-title", currentLang)}
          </Title>
          <Callout className="callout-style">{getI18nLabel(i18n, "thematic-detail-callout", currentLang)}</Callout>
          <TopicsFundingEvo3Years />

          <Title as="h2" className="fr-mt-5w">
            {getI18nLabel(i18n, "thematic-composition", currentLang)}
          </Title>
          <Callout className="callout-style">{getI18nLabel(i18n, "thematic-composition-callout", currentLang)}</Callout>
          <DestinationsFunding />

          <BoardsSuggestComponent />
        </Container>
      );

    case "destination-detail":
      return (
        <Container fluid className="fr-pb-3w">
          <SynthesisFocus />
          <DestinationsOverview />

          <BoardsSuggestComponent />
        </Container>
      );

    default:
      return <div>{getI18nLabel(i18n, "no-content", currentLang)}</div>;
  }
}
