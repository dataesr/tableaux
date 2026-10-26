import { Button, Container, FastAccess, Header, Logo, Service } from "@dataesr/dsfr-plus";
import { useState } from "react";
import { Link, Outlet, useLocation } from "react-router-dom";

import Footer from "../../../../components/footer";
import { getI18nLabel } from "../../../../utils";
import SelectionBar from "../selection";
import i18n from "./i18n.json";

import "./styles.scss";

const BASE = "/suivi-recherche";

const NAV_ITEMS = [
  { key: "accueil", to: `${BASE}/accueil` },
  { key: "bibliometrie", to: `${BASE}/bibliometrie` },
] as const;

// Le header DSFR passe sa navigation dans une modale pilotée par le JS du DSFR, qui n'est pas chargé :
// la navigation vit donc dans une barre à part, ouverte sur mobile par un état React.
export default function GlobalLayout() {
  const { pathname, search } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <div className="fr-skiplinks">
        <nav className="fr-container" aria-label={getI18nLabel(i18n, "skipLinks")}>
          <ul className="fr-skiplinks__list">
            <li><a className="fr-link" href="#main-content">{getI18nLabel(i18n, "skipContent")}</a></li>
            <li><a className="fr-link" href="#sr-main-nav">{getI18nLabel(i18n, "skipMenu")}</a></li>
            <li><a className="fr-link" href="#footer">{getI18nLabel(i18n, "skipFooter")}</a></li>
          </ul>
        </nav>
      </div>
      <Header>
        <Logo text={import.meta.env.VITE_MINISTER_NAME} />
        <Service href={`${BASE}/accueil`} name="#dataESR tableaux de bord" tagline={getI18nLabel(i18n, "tagline")} />
        <FastAccess>
          <Button as="a" href="/" icon="dashboard-3-line" size="sm" variant="text">
            {getI18nLabel(i18n, "explore")}
          </Button>
        </FastAccess>
      </Header>
      <div className="sr-main-menu">
        <Container>
          <button
            aria-controls="sr-main-nav"
            aria-expanded={menuOpen}
            className="sr-menu-toggle fr-btn fr-btn--tertiary fr-btn--icon-left fr-icon-menu-fill"
            onClick={() => setMenuOpen(!menuOpen)}
            type="button"
          >
            {getI18nLabel(i18n, "menu")}
          </button>
          <nav
            aria-label={getI18nLabel(i18n, "mainNavigation")}
            className={`sr-nav ${menuOpen ? "sr-nav--open" : ""}`}
            id="sr-main-nav"
          >
            <ul className="sr-nav__list">
              {NAV_ITEMS.map(({ key, to }) => (
                <li key={key}>
                  <Link
                    aria-current={pathname === to ? "page" : undefined}
                    className="sr-nav__link"
                    onClick={() => setMenuOpen(false)}
                    to={`${to}${search}`}
                  >
                    {getI18nLabel(i18n, key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </Container>
      </div>
      <main id="main-content" tabIndex={-1}>
        {pathname !== `${BASE}/accueil` && <SelectionBar />}
        <Outlet />
      </main>
      <Footer href={`${BASE}/accueil`} title="Accueil - Suivi de la recherche française" />
    </>
  );
}
