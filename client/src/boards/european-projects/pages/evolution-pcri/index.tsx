import { Container, Row, Col, Title } from "@dataesr/dsfr-plus";
import { useSearchParams } from "react-router-dom";
import FundingByCountry from "./charts/funding-by-country";
import FundingStackedArea from "./charts/funding-stacked-area";
import CountriesHeatmap from "./charts/countries-heatmap";
import CountriesRanking from "./charts/countries-ranking";
import EfficiencyScatter from "./charts/efficiency-scatter";
import SuccessRateEvolution from "./charts/success-rate-evolution";
import Callout from "../../../../components/callout";

export default function EvolutionPcri() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";

  const title = {
    fr: (
      <>
        Evolution des programmes-cadres pour la recherche et l'innovation : <br />
        de FP6 à Horizon Europe
      </>
    ),
    en: (
      <>
        Evolution of framework programmes for research and innovation: <br />
        from FP6 to Horizon Europe
      </>
    ),
  };

  const calloutContent = {
    fr: (
      <>
        Cette page présente l'évolution des subventions européennes de <strong>FP6</strong> (2002-2006) à <strong>Horizon Europe</strong> (2021-2027).
        Les données sur Horizon Europe étant encore partielles, les analyses comparatives se concentrent principalement sur les frameworks complets :{" "}
        <strong>FP7</strong> (2007-2013) et <strong>Horizon 2020</strong> (2014-2020). Les graphiques permettent d'identifier les tendances par pays,
        les évolutions des taux de succès et les dynamiques de compétition entre pays pour l'obtention de subventions.
      </>
    ),
    en: (
      <>
        This page presents the evolution of European funding from <strong>FP6</strong> (2002-2006) to <strong>Horizon Europe</strong> (2021-2027). As
        data on Horizon Europe is still partial, comparative analyses focus primarily on completed frameworks: <strong>FP7</strong> (2007-2013) and{" "}
        <strong>Horizon 2020</strong> (2014-2020). The charts help identify country trends, success rate developments, and competitive dynamics
        between countries in obtaining funding.
      </>
    ),
  };

  return (
    <Container as="section" className="fr-mt-2w">
      <Row>
        <Col>
          <Title as="h2">{title[currentLang]}</Title>
        </Col>
      </Row>
      <Row>
        <Col>
          <Callout className="callout-style">{calloutContent[currentLang]}</Callout>
        </Col>
      </Row>
      <Row className="fr-my-3w">
        <Col>
          <FundingStackedArea />
        </Col>
      </Row>
      <Row className="fr-my-5w">
        <Col>
          <SuccessRateEvolution />
        </Col>
      </Row>
      <Row className="fr-my-5w">
        <Col>
          <CountriesHeatmap />
        </Col>
      </Row>
      <Row className="fr-my-5w">
        <Col>
          <CountriesRanking />
        </Col>
      </Row>
      <Row className="fr-my-5w">
        <Col>
          <EfficiencyScatter />
        </Col>
      </Row>
      <Row className="fr-my-5w">
        <Col>
          <FundingByCountry />
        </Col>
      </Row>
    </Container>
  );
}
