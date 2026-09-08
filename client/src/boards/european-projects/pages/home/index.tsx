import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import { Col, Container, Row, Title, Link } from "@dataesr/dsfr-plus";
import PillarCard from "../../components/cards/pillars";
import ErcCard from "../../components/cards/erc";
import MscaCard from "../../components/cards/msca";
import Timeline from "./components/Timeline";
import { getFiltersValues } from "../../api";

import i18n from "./i18n.json";

import "./styles.scss";

export default function Home() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";

  const { data: dataPillars } = useQuery({
    queryKey: ["ep/get-filters-values", "pillars"],
    queryFn: () => getFiltersValues("pillars"),
  });

  function getI18nLabel(key) {
    return i18n[key][currentLang];
  }

  return (
    <div className="ep-home">
      <section className="ep-home__hero">
        <Container>
          <Row gutters>
            <Col md={8}>
              <p className="ep-home__hero-badge">TABLEAU DE BORD</p>
              <Title as="h1" look="h2" className="ep-home__hero-title">
                {getI18nLabel("title1")}
              </Title>
              <p className="ep-home__hero-description" dangerouslySetInnerHTML={{ __html: getI18nLabel("bloc1") }} />
            </Col>
            <Col className="ep-home__hero-logo-col">
              <Link href="https://ec.europa.eu/programmes/horizon2020/" target="_blank">
                <img src="https://commission.europa.eu/themes/contrib/oe_theme/dist/ec/images/logo/positive/logo-ec--fr.svg" alt="Lien vers la page officielle du programme Horizon Europe" className="ep-home__hero-logo" />
              </Link>
            </Col>
          </Row>
          <Row gutters className="fr-mt-3w">
            <Col>
              <div className="ep-home__stats">
                <Link href="/european-projects/horizon-europe?section=synthesis" className="ep-home__stat-item ep-home__stat-item--blue">
                  <span className="ep-home__stat-number">4</span>
                  <span className="ep-home__stat-label">Piliers Horizon Europe</span>
                </Link>
                <Link href="/european-projects/msca" className="ep-home__stat-item ep-home__stat-item--teal">
                  <span className="ep-home__stat-number">MSCA</span>
                  <span className="ep-home__stat-label">Actions Marie Skłodowska-Curie</span>
                </Link>
                <Link href="/european-projects/erc" className="ep-home__stat-item ep-home__stat-item--purple">
                  <span className="ep-home__stat-number">ERC</span>
                  <span className="ep-home__stat-label">Conseil Européen de la Recherche</span>
                </Link>
                <Link href="/european-projects/evolution-pcri" className="ep-home__stat-item ep-home__stat-item--orange">
                  <span className="ep-home__stat-number">FP6→HE</span>
                  <span className="ep-home__stat-label">Évolution des programmes-cadres</span>
                </Link>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      <section className="ep-home__section">
        <Container>
          <Title as="h2" look="h4" className="ep-home__section-title">
            Les 4 piliers d'Horizon Europe
          </Title>
          <Row gutters>
            {dataPillars &&
              dataPillars.map((pillar) => (
                <Col md={6} key={pillar.id}>
                  <PillarCard description={getI18nLabel(`${pillar.id}-description`)} title={pillar[`label_${currentLang}`]} subtitle={pillar.id} to={`/european-projects/horizon-europe?section=synthesis&pillarId=${pillar.id}`} titleAs="h3" />
                </Col>
              ))}
          </Row>
        </Container>
      </section>

      <section className="ep-home__section ep-home__section--alt">
        <Container>
          <Title as="h2" look="h4" className="ep-home__section-title">
            Focus
          </Title>
          <Row gutters>
            <Col md={6}>
              <MscaCard
                title="MSCA"
                subtitle="Actions Marie Sklodowska-Curie"
                description="Le programme européen « Actions Marie Skłodowska-Curie » (MSCA) est le programme de référence de l'Union européenne pour la mobilité, la formation et le développement de la carrière des chercheurs. Au sein du programme-cadre « Horizon Europe », il est intégré au pilier 1 dédié à la science d'excellence."
                to="/european-projects/msca"
                titleAs="h3"
              />
            </Col>
            <Col md={6}>
              <ErcCard
                title="ERC"
                subtitle="Le Conseil Européen de la Recherche"
                description="L'ERC (European Research Council) finance des projets de recherche exploratoire, aux frontières de la connaissance, dans tous les domaines de la science et de la technologie. Le seul critère de sélection est celui de l'excellence scientifique."
                to="/european-projects/erc"
                titleAs="h3"
              />
            </Col>
          </Row>
        </Container>
      </section>

      <section className="ep-home__section">
        <Container>
          <Row gutters>
            <Col md={12}>
              <Timeline />
            </Col>
            <Col md={12} className="text-center">
              <Link href="/european-projects/evolution-pcri" className="fr-link fr-link--icon-right">
                Visualisez et analysez l'évolution des programmes européens de recherche
                <span className="fr-fi-arrow-right-line fr-link__icon fr-link__icon--right" />
              </Link>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
}
