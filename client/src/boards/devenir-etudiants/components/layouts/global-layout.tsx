import { Logo, Service } from "@dataesr/dsfr-plus";
import { Link, Outlet, useLocation } from "react-router-dom";

import Breadcrumb from "../../../../components/breadcrumb";
import Footer from "../../../../components/footer";
import { useDashboardVisibility } from "../../../../hooks/useDashboardVisibility";
import { getI18nLabel } from "../../../../utils";
import i18n from "./i18n.json";
import navigationConfig from "./navigation-config.json";

import "../../colors.scss";


const BASE = "/devenir-etudiants/entrants-en-L1-2019";

const NAV_ITEMS = [
  { key: "flux", labelKey: "flux", to: `${BASE}/flux` },
  { key: "repartition", labelKey: "repartition", to: `${BASE}/repartition` },
  { key: "plus-haut-diplome", labelKey: "plusHautDiplome", to: `${BASE}/plus-haut-diplome` },
  { key: "comparaison-profils", labelKey: "comparaisonProfils", to: `${BASE}/comparaison-profils` },
  { key: "methodologie", labelKey: "methodologie", to: `${BASE}/methodologie` },
] as const;

export default function GlobalLayout() {
  const { pathname, search } = useLocation();
  const isHomePageVisible = useDashboardVisibility("devenir-etudiants");

  if (!pathname) return null;

  return (
    <>
      <div className="fr-skiplinks">
        <nav className="fr-container" role="navigation" aria-label="Accès rapide">
          <ul className="fr-skiplinks__list">
            <li>
              <a className="fr-link" href="#main-content">Contenu principal</a>
            </li>
            <li>
              <a className="fr-link" href="#header-navigation">Menu</a>
            </li>
            <li>
              <a className="fr-link" href="#footer">Pied de page</a>
            </li>
          </ul>
        </nav>
      </div>
      <header className="fr-header">
        <div className="fr-header__body">
          <div className="fr-container">
            <div className="fr-header__body-row">
              <div className="fr-header__brand fr-enlarge-link">
                <div className="fr-header__brand-top">
                  <Logo text={import.meta.env.VITE_MINISTER_NAME} />
                  <div className="fr-header__navbar">
                    <button
                      data-fr-opened="false"
                      aria-controls="modal-header"
                      title="Menu"
                      type="button"
                      id="button-header"
                      className="fr-btn--menu fr-btn"
                    >
                      Menu
                    </button>
                  </div>
                </div>
                <Service
                  href="/"
                  name="#dataESR tableaux de bord"
                  tagline={getI18nLabel(i18n, "tagline")}
                />
              </div>
            </div>
          </div>
        </div>
        <div className="fr-header__menu fr-modal" id="modal-header" aria-labelledby="button-header">
          <div className="fr-container">
            <button
              aria-controls="modal-header"
              title="Fermer"
              type="button"
              id="button-close-header"
              className="fr-btn--close fr-btn"
            >
              {getI18nLabel(i18n, "close")}
            </button>
            <div className="fr-header__menu-links"></div>
            <nav className="fr-nav" id="header-navigation" aria-label="Menu principal">
              <ul className="fr-nav__list">
                {NAV_ITEMS.map(({ key, labelKey, to }) => (
                  <li key={key} className="fr-nav__item">
                    <Link
                      to={`${to}${search}`}
                      {...(pathname === to && { "aria-current": "page" })}
                      className="fr-nav__link"
                    >
                      {getI18nLabel(i18n, labelKey)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </div>
      </header>
      <main id="main-content" tabIndex={-1}>
        <div className="fr-container fr-pt-2w fr-pb-0">
          {NAV_ITEMS.some(({ to }) => pathname === to) && (
            <Breadcrumb config={navigationConfig} homeHref={isHomePageVisible ? "/" : undefined} />
          )}
        </div>
        <Outlet />
      </main>
      <Footer href={`${BASE}/flux`} title="Accueil - Parcours des néo-bacheliers inscrits en L1 en 2019 - Ministère de l'enseignement supérieur, de la recherche et de l'espace" />
    </>
  );
}
