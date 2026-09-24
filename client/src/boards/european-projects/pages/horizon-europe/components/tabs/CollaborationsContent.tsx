import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button, Row, Col, Title } from "@dataesr/dsfr-plus";

import BoardsSuggestComponent from "../../../../../../components/boards-suggest-component";
import Callout from "../../../../../../components/callout";
import CountriesCollaborationsBubble from "../../../collaborations/charts/countries-collaborations-bubble";
import CountriesCollaborationsTable from "../../../collaborations/charts/countries-collaborations-table";
import CountryNeighbourgs from "../../../collaborations/charts/country-neighbourgs";
import CountryLanguages from "../../../collaborations/charts/countries-languages";
import EntityVariablePie from "../../../collaborations/charts/entity-variable-pie";
import MapOfEuropeCollaborationsFlow from "../../../collaborations/charts/map-of-europe-collaborations-flow";

import { isAnEuropeanUnionCountry } from "../../../../../../utils/countries";
import { getI18nLabel } from "../../../../../../utils";
import EuropeanMap from "../../../collaborations/charts/european-map";
import EuropeanCards from "../../../collaborations/charts/european-cards";
import CollaborationsByContinent from "../../../collaborations/charts/collaborations-by-continent";

const i18n = {
  "collaboration-title": {
    fr: "Ensemble des collaborations du pays",
    en: "All collaborations of country",
  },
  "collaboration-callout": {
    fr: "Le graphique représente les pays ayant collaboré avec le pays sélectionné. La taille des bulles est proportionnelle au nombre de collaborations réussies entre les pays. Vous pouvez augmenter le nombre de pays affichés en cliquant sur le bouton Afficher plus de pays.",
    en: "english version of callout",
  },
  "collaborations-by-entity-title": {
    fr: "Répartition des collaborations par entité",
    en: "Collaboration distribution by entity",
  },
  "collaborations-by-entity-callout": {
    fr: "Visualisez la répartition des collaborations du pilier/programme/thématique/destination sélectionné(e) par entité. Vous pouvez rechercher une entité spécifique pour voir ses collaborations. Par exemple, si vous recherchez une université, vous verrez la part des collaborations impliquant cette université par rapport au total des collaborations du pilier/programme/thématique/destination. Toujours dans l'écosystème du pays sélectionné. Cela vous permet d'identifier les entités les plus actives et de comprendre leur rôle dans les collaborations au sein du pays. Attention, seules les entités du pays apparaissent dans la recherche.",
    en: "Visualize the collaboration distribution of the selected pillar/program/topic/destination by entity. You can search for a specific entity to see its collaborations. For example, if you search for a university, you will see the share of collaborations involving that university compared to the total collaborations of the pillar/program/topic/destination. Always within the selected country's ecosystem. This allows you to identify the most active entities and understand their role in collaborations within the country. Note that only entities from the country appear in the search.",
  },
  "focus-on-europe-title": {
    fr: "Focus sur les pays européens",
    en: "Focus on European countries",
  },
};

export default function CollaborationsContent() {
  const [nbToShow, setNbToShow] = useState(10); // Default number of countries to show

  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";

  return (
    <>
      <Row gutters className="fr-mt-5w">
        <Col md={6}>
          <Title as="h2" look="h4">
            {getI18nLabel(i18n, "collaboration-title", currentLang)}
          </Title>
        </Col>
        <Col md={6} className="text-right">
          <Button disabled={nbToShow <= 10} onClick={() => setNbToShow((prev) => prev - 5)} size="sm" variant="secondary">
            - 5
          </Button>
          <Button onClick={() => setNbToShow((prev) => prev + 5)} size="sm" variant="secondary">
            + 5
          </Button>
        </Col>
      </Row>
      <Row>
        <Col>
          <Callout className="callout-style">{getI18nLabel(i18n, "collaboration-callout", currentLang)}</Callout>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <MapOfEuropeCollaborationsFlow nbToShow={nbToShow} />
        </Col>
        <Col md={6}>
          <CountriesCollaborationsBubble nbToShow={nbToShow} />
        </Col>
      </Row>
      <Row gutters>
        <Col md={7}>
          <CountriesCollaborationsTable />
        </Col>
        <Col md={5}>
          <CollaborationsByContinent />
        </Col>
      </Row>
      {isAnEuropeanUnionCountry(searchParams.get("country_code") || "") && (
        <>
          <Title as="h2" look="h4" className="fr-mt-5w">
            {getI18nLabel(i18n, "focus-on-europe-title", currentLang)}
          </Title>
          <Row gutters>
            <Col md={7}>
              <EuropeanCards />
            </Col>
            <Col>
              <EuropeanMap />
            </Col>
          </Row>
        </>
      )}
      <Row gutters>
        <Col>
          <CountryNeighbourgs />
        </Col>
        <Col>
          <CountryLanguages />
        </Col>
      </Row>
      <Row className="fr-mt-5w">
        <Col>
          <Title as="h2" look="h4">
            {getI18nLabel(i18n, "collaborations-by-entity-title", currentLang)}
          </Title>
          <Callout className="callout-style">{getI18nLabel(i18n, "collaborations-by-entity-callout", currentLang)}</Callout>
        </Col>
      </Row>
      <Row>
        <Col>
          <EntityVariablePie />
        </Col>
      </Row>
      <Row className="fr-my-5w">
        <Col>
          <BoardsSuggestComponent />
        </Col>
      </Row>
    </>
  );
}
