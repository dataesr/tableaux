import { Breadcrumb, Col, Container, Link, Row } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import Footer from "../components/footer";
import HeaderTableaux from "../layout/header.tsx";
import { isInProduction } from "../utils.tsx";
import { ATLAS_SITEMAP } from "./atlas/sitemap-config";
import BoardSitemapPage, { type BoardSitemapConfig } from "./board-sitemap-page";
import { EUROPEAN_PROJECTS_SITEMAP } from "./european-projects/sitemap-config";
import { FACULTY_MEMBERS_SITEMAP } from "./faculty-members/sitemap-config";
import { FINANCEMENTS_PAR_AAP_SITEMAP } from "./financements-par-aap/sitemap-config";
import { GRADUATES_SITEMAP } from "./graduates/sitemap-config";
import { OPEN_ALEX_SITEMAP } from "./open-alex/sitemap-config";
import { OUTCOMES_SITEMAP } from "./outcomes/sitemap-config";
import { STRUCTURES_FINANCE_SITEMAP } from "./structures-finance/sitemap-config";
import { TEDS_SITEMAP } from "./teds/sitemap-config";
import { VALORISATION_RECHERCHE_INNOVATION_SITEMAP } from "./valorisation-recherche-innovation/sitemap-config";

import "./sitemap-styles.scss";

const { VITE_APP_SERVER_URL } = import.meta.env;

const BOARD_SITEMAP_CONFIGS: Record<string, BoardSitemapConfig> = {
  "devenir-etudiants": OUTCOMES_SITEMAP,
  "personnel-enseignant": FACULTY_MEMBERS_SITEMAP,
  "structures-finance": STRUCTURES_FINANCE_SITEMAP,
  "financements-par-aap": FINANCEMENTS_PAR_AAP_SITEMAP,
  "european-projects": EUROPEAN_PROJECTS_SITEMAP,
  "valorisation-recherche-innovation": VALORISATION_RECHERCHE_INNOVATION_SITEMAP,
  teds: TEDS_SITEMAP,
  graduates: GRADUATES_SITEMAP,
  "open-alex": OPEN_ALEX_SITEMAP,
};

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

const PRODUCTION_SECTIONS: SitemapSection[] = [
  toSection("devenir-etudiants", OUTCOMES_SITEMAP),
  toSection("financements-par-aap", FINANCEMENTS_PAR_AAP_SITEMAP),
  toSection("structures-finance", STRUCTURES_FINANCE_SITEMAP),
];

const NON_PRODUCTION_SECTIONS: SitemapSection[] = [
  toSection("european-projects", EUROPEAN_PROJECTS_SITEMAP),
  toSection("personnel-enseignant", FACULTY_MEMBERS_SITEMAP),
  toSection("valorisation-recherche-innovation", VALORISATION_RECHERCHE_INNOVATION_SITEMAP),
  toSection("teds", TEDS_SITEMAP),
  toSection("atlas", ATLAS_SITEMAP),
  toSection("graduates", GRADUATES_SITEMAP),
  toSection("open-alex", OPEN_ALEX_SITEMAP),
];

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

export default function SitemapPage() {
  const [searchParams] = useSearchParams();
  const { data: boards } = useQuery<{ id: string; homePageVisible?: boolean }[]>({
    queryKey: ["list-dashboards"],
    queryFn: () => fetch(`${VITE_APP_SERVER_URL}/admin/list-dashboards`).then((response) => response.json()),
  });

  const isSectionVisible = (section: SitemapSection) => {
    const board = boards?.find((b) => b.id === (section.boardId ?? section.id));
    return board ? board.homePageVisible !== false : true;
  };

  const dashboardSections = (
    isInProduction()
      ? PRODUCTION_SECTIONS
      : [...PRODUCTION_SECTIONS, ...NON_PRODUCTION_SECTIONS]
  ).filter(isSectionVisible);

  const boardConfig = BOARD_SITEMAP_CONFIGS[searchParams.get("from") ?? ""];

  if (boardConfig) {
    return (
      <>
        <HeaderTableaux />
        <BoardSitemapPage {...boardConfig} />
        <Footer />
      </>
    );
  }

  return (
    <>
      <HeaderTableaux />
      <main id="contenu" role="main" className="sitemap-page">
        <section className="sitemap-hero">
          <Container>
            <Row>
              <Col xs="12" lg="8">
                <Breadcrumb className="sitemap-hero__breadcrumb fr-mb-2w">
                  <Link href="/">Accueil</Link>
                  <Link>Plan du site</Link>
                </Breadcrumb>
                <h1 className="sitemap-hero__title">Plan du site</h1>
                <p className="sitemap-hero__description">
                  Retrouvez l'ensemble des tableaux de bord et des pages de la plateforme
                  dataESR, organisés par thématique. Cette page facilite la navigation et
                  l'accès direct à chaque contenu.
                </p>
              </Col>
            </Row>
          </Container>
        </section>

        <section className="sitemap-section">
          <Container>
            <Row>
              <Col xs="12">
                <h2 className="sitemap-section__title">Tableaux de bord</h2>
              </Col>
            </Row>
            <Row gutters className="fr-mt-2w">
              {dashboardSections.map((section) => (
                <Col key={section.id} xs="12" md="6" lg="4" className="fr-mb-3w">
                  <SitemapGroup section={section} />
                </Col>
              ))}
            </Row>
          </Container>
        </section>

        <section className="sitemap-section sitemap-section--info">
          <Container>
            <Row gutters className="fr-mt-2w">
              <Col xs="12" md="6" lg="4">
                <SitemapGroup section={INFORMATION_SECTION} headingLevel="h2" />
              </Col>
            </Row>
          </Container>
        </section>
      </main>
      <Footer />
    </>
  );
}
