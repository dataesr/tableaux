import { Col, Container, Link, Row, Title } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { FormattedMessage, IntlProvider } from "react-intl";
import { useSearchParams } from "react-router-dom";

import DefaultSkeleton from "../../../../components/charts-skeletons/default";
import { getI18nLabel } from "../../../../utils";
import { getFiltersValues } from "../../api";
import ErcCard from "../../components/cards/erc";
import MscaCard from "../../components/cards/msca";
import PillarCard from "../../components/cards/pillars";
import Glossary from "../../components/glossary";
import Timeline from "./components/Timeline";
import i18n from "./i18n.json";

import "./styles.scss";


export default function Home() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const filtersParams = searchParams.toString();

  const { data: dataPillars, isLoading: isLoadinPillars } = useQuery({
    queryKey: ["ep/get-filters-values", "pillars"],
    queryFn: () => getFiltersValues("pillars"),
  });

  const messages = {}
  Object.keys(i18n).forEach((key) => {
    messages[key] = i18n[key][currentLang]
  })

  return (
    <IntlProvider locale={currentLang} messages={messages}>
      <div className="ep-home">
        <section className="ep-home__hero">
          <Container>
            <Row gutters>
              <Col xs={12} md={8}>
                <p className="ep-home__hero-badge">{getI18nLabel(i18n, "dashboard-badge", currentLang)}</p>
                <Title as="h1" look="h2" className="ep-home__hero-title">
                  {getI18nLabel(i18n, "title1", currentLang)}
                </Title>
                <p className="ep-home__hero-description">
                  <FormattedMessage
                    id="bloc1"
                    values={{
                      b: (chunks) => <b>{chunks}</b>,
                      glossary: (chunks) => <Glossary id={chunks?.[0]?.toLocaleString("fr-FR") ?? ""} />,
                    }}
                  />
                </p>
              </Col>
              <Col className="ep-home__hero-logo-col">
                <Link href="https://ec.europa.eu/programmes/horizon2020/" target="_blank">
                  <img src="https://commission.europa.eu/themes/contrib/oe_theme/dist/ec/images/logo/positive/logo-ec--fr.svg" alt={getI18nLabel(i18n, "logo-alt", currentLang)} className="ep-home__hero-logo" />
                </Link>
              </Col>
            </Row>
            <Row gutters className="fr-mt-3w">
              <Col>
                <div className="ep-home__stats">
                  <Link href={`/european-projects/horizon-europe?section=synthesis&${filtersParams}`} className="ep-home__stat-item ep-home__stat-item--blue">
                    <span className="ep-home__stat-number">4</span>
                    <span className="ep-home__stat-label">{getI18nLabel(i18n, "stat-pillars", currentLang)}</span>
                  </Link>
                  <Link href="/european-projects/msca" className="ep-home__stat-item ep-home__stat-item--teal">
                    <span className="ep-home__stat-number">MSCA</span>
                    <span className="ep-home__stat-label">{getI18nLabel(i18n, "stat-msca", currentLang)}</span>
                  </Link>
                  <Link href="/european-projects/erc" className="ep-home__stat-item ep-home__stat-item--purple">
                    <span className="ep-home__stat-number">ERC</span>
                    <span className="ep-home__stat-label">{getI18nLabel(i18n, "stat-erc", currentLang)}</span>
                  </Link>
                  <Link href="/european-projects/evolution-pcri" className="ep-home__stat-item ep-home__stat-item--orange">
                    <span className="ep-home__stat-number">FP6→HE</span>
                    <span className="ep-home__stat-label">{getI18nLabel(i18n, "stat-programme-evolution", currentLang)}</span>
                  </Link>
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        <section className="ep-home__section">
          <Container>
            <Title as="h2" look="h4" className="ep-home__section-title">
              {getI18nLabel(i18n, "pillars-title", currentLang)}
            </Title>
            <Row gutters>
              {isLoadinPillars && (
                <>
                  <Col md={12}>
                    <DefaultSkeleton col={2} />
                  </Col>
                  <Col md={12}>
                    <DefaultSkeleton col={2} />
                  </Col>
                </>
              )}
              {dataPillars &&
                dataPillars.map((pillar) => (
                  <Col xs={12} md={6} key={pillar.id}>
                    <PillarCard description={getI18nLabel(i18n, `${pillar.id.replace(".", "-")}-description`, currentLang)} title={pillar[`label_${currentLang}`]} subtitle={pillar.id} to={`/european-projects/horizon-europe?section=synthesis&pillarId=${pillar.id}`} titleAs="h3" />
                  </Col>
                ))}
            </Row>
          </Container>
        </section>

        <section className="ep-home__section ep-home__section--alt">
          <Container>
            <Title as="h2" look="h4" className="ep-home__section-title">
              {getI18nLabel(i18n, "focus-title", currentLang)}
            </Title>
            <Row gutters>
              <Col xs={12} md={6}>
                <MscaCard
                  title="MSCA"
                  subtitle={getI18nLabel(i18n, "msca-subtitle", currentLang)}
                  description={getI18nLabel(i18n, "msca-description", currentLang)}
                  to="/european-projects/msca"
                  titleAs="h3"
                />
              </Col>
              <Col xs={12} md={6}>
                <ErcCard
                  title="ERC"
                  subtitle={getI18nLabel(i18n, "erc-subtitle", currentLang)}
                  description={getI18nLabel(i18n, "erc-description", currentLang)}
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
              <Col xs={12}>
                <Timeline />
              </Col>
              <Col xs={12} className="ep-home__section-link">
                <Link href="/european-projects/evolution-pcri" className="fr-link fr-link--icon-right">
                  {getI18nLabel(i18n, "timeline-link", currentLang)}
                  <span className="fr-fi-arrow-right-line fr-link__icon fr-link__icon--right" />
                </Link>
              </Col>
            </Row>
          </Container>
        </section>
      </div>
    </IntlProvider>
  );
}
