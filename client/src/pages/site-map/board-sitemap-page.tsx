import { Breadcrumb, Col, Container, Link, Row, Title } from "@dataesr/dsfr-plus";

import { useDashboardVisibility } from "../../hooks/useDashboardVisibility";

import "./sitemap-styles.scss";

export type BoardSitemapLink = {
  label: string;
  href: string;
};

export type BoardSitemapConfig = {
  boardId: string;
  boardName: string;
  boardHomeHref: string;
  description: string;
  links: BoardSitemapLink[];
};

export default function BoardSitemapPage({
  boardId,
  boardName,
  boardHomeHref,
  description,
  links,
}: BoardSitemapConfig) {
  const isHomePageVisible = useDashboardVisibility(boardId);
  const headingId = `sitemap-heading-${boardId}`;

  return (
    <div className="sitemap-page">
      <section className="sitemap-hero">
        <Container>
          <Breadcrumb className="sitemap-hero__breadcrumb">
            {isHomePageVisible && <Link href="/">Accueil</Link>}
            <Link href={boardHomeHref}>{boardName}</Link>
            <Link>Plan du site</Link>
          </Breadcrumb>
          <p className="sitemap-hero__label">{boardName}</p>
          <Title as="h1" look="h1" className="sitemap-hero__title">
            Plan du site
          </Title>
          <p className="sitemap-hero__description">{description}</p>
        </Container>
      </section>

      <Container as="main" id="main" className="sitemap-content fr-mt-5w">
        <section className="sitemap-section">
          <Row gutters className="fr-mt-2w">
            <Col xs="12" md="6" lg="4">
              <nav className="fr-sitemap-group" aria-labelledby={headingId}>
                <h2 className="fr-sitemap-group__title" id={headingId}>
                  <Link href={boardHomeHref}>{boardName}</Link>
                </h2>
                <ul className="fr-sitemap-group__list fr-raw-list">
                  {links.map((link) => (
                    <li key={link.href} className="fr-sitemap-group__item">
                      <Link href={link.href}>{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </Col>
          </Row>
        </section>
      </Container>
    </div>
  );
}
