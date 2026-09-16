import { Breadcrumb, Col, Container, Link, Row, Title } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import Footer from "../../components/footer/index.tsx";
import BoardSitemapPage, { type BoardSitemapConfig } from "./board-sitemap-page.tsx";

import "./sitemap-styles.scss";

const { VITE_APP_SERVER_URL } = import.meta.env;

type SitemapLink = {
  label: string;
  href: string;
};

type SitemapSection = {
  id: string;
  boardId?: string;
  title: string;
  href?: string;
  links: SitemapLink[];
};

function toSection(id: string, config: BoardSitemapConfig): SitemapSection {
  return {
    id,
    boardId: config.boardId,
    title: config.boardName,
    href: config.boardHomeHref,
    links: config.links,
  };
}

const INFORMATION_SECTION: SitemapSection = {
  id: "informations",
  title: "Informations et aide",
  links: [
    { label: "Accueil", href: "/" },
    { label: "Plan du site", href: "/plan-du-site" },
    { label: "Accessibilité : partiellement conforme", href: "/accessibility" },
    { label: "Contact", href: "/contact" },
    { label: "Gestion des cookies", href: "/cookies" },
  ],
};

function SitemapGroup({
  section,
  headingLevel = "h3",
}: {
  section: SitemapSection;
  headingLevel?: "h2" | "h3";
}) {
  const headingId = `sitemap-heading-${section.id}`;
  const Heading = headingLevel;
  return (
    <nav className="fr-sitemap-group" aria-labelledby={headingId}>
      <Heading className="fr-sitemap-group__title" id={headingId}>
        {section.href ? (
          <Link href={section.href}>{section.title}</Link>
        ) : (
          section.title
        )}
      </Heading>
      <ul className="fr-sitemap-group__list fr-raw-list">
        {section.links.map((link) => (
          <li key={link.href} className="fr-sitemap-group__item">
            <Link href={link.href}>{link.label}</Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default async function SitemapPage() {
  const [searchParams] = useSearchParams();
  const { data: dashboards } = useQuery<{ id: string; homePageVisible?: boolean }[]>({
    queryKey: ["list-dashboards"],
    queryFn: () => fetch(`${VITE_APP_SERVER_URL}/admin/list-dashboards`).then((response) => response.json()),
  });

  const boardConfig = await import(`../../boards/${searchParams.get("from")}/sitemap-config.ts`)

  if (boardConfig?.SITEMAP) {
    return <BoardSitemapPage {...boardConfig.SITEMAP} />
  }

  return (
    <>
      <div className="sitemap-page">
        <section className="sitemap-hero">
          <Container>
            <Breadcrumb className="sitemap-hero__breadcrumb">
              <Link href="/">Accueil</Link>
              <Link>Plan du site</Link>
            </Breadcrumb>
            <p className="sitemap-hero__label">Navigation</p>
            <Title as="h1" look="h1" className="sitemap-hero__title">
              Plan du site
            </Title>
            <p className="sitemap-hero__description">
              Retrouvez l'ensemble des tableaux de bord et des pages de la plateforme
              dataESR, organisés par thématique. Cette page facilite la navigation et
              l'accès direct à chaque contenu.
            </p>
          </Container>
        </section>

        <Container as="main" id="main" className="sitemap-content fr-mt-5w">
          <section className="sitemap-section">
            <h2 className="sitemap-section__title">Tableaux de bord</h2>
            <Row gutters className="fr-mt-2w">
              {dashboards?.filter((dashboard) => dashboard?.homePageVisible).map((dashboard) => toSection(dashboard.id, boardConfig.default)).map((section) => (
                <Col key={section.id} xs="12" md="6" lg="4" className="fr-mb-3w">
                  <SitemapGroup section={section} />
                </Col>
              ))}
            </Row>
          </section>

          <section className="sitemap-section sitemap-section--info">
            <Row gutters className="fr-mt-2w">
              <Col xs="12" md="6" lg="4">
                <SitemapGroup section={INFORMATION_SECTION} headingLevel="h2" />
              </Col>
            </Row>
          </section>
        </Container>
      </div>
      <Footer />
    </>
  );
}
