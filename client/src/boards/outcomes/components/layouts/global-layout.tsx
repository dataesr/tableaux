import { Logo, Service } from "@dataesr/dsfr-plus";
import { Link, Outlet, useLocation } from "react-router-dom";

import Footer from "../../../../components/footer";
import { getI18nLabel } from "../../../../utils";
import i18n from "./i18n.json";

import "./styles.scss"

import "../../colors.scss";


const BASE = "/devenir-etudiants/entrants-en-L1-2019";

const NAV_ITEMS = [
  { key: "flux", labelKey: "flux", to: `${BASE}/flux` },
  { key: "repartition", labelKey: "repartition", to: `${BASE}/repartition` },
  { key: "plus-haut-diplome", labelKey: "plusHautDiplome", to: `${BASE}/plus-haut-diplome` },
  { key: "croisements", labelKey: "croisements", to: `${BASE}/croisements` },
  { key: "comparaison-profils", labelKey: "comparaisonProfils", to: `${BASE}/comparaison-profils` },
  { key: "methodologie", labelKey: "methodologie", to: `${BASE}/methodologie` },
] as const;

const ALL_BREADCRUMB_PAGES = [
  ...NAV_ITEMS,
  { key: "plan-du-site", labelKey: "planDuSite", to: `${BASE}/plan-du-site` },
] as const;

export default function GlobalLayout() {
  const { pathname, search } = useLocation();

  if (!pathname) return null;

  const currentPage = ALL_BREADCRUMB_PAGES.find(({ to }) => pathname === to || pathname.startsWith(to + "/"));

  return (
    <>
      <header className="fr-header">
        <div className="fr-header__body">
          <div className="fr-container">
            <div className="fr-header__body-row">
              <div className="fr-header__brand fr-enlarge-link">
                <div className="fr-header__brand-top">
                  <Logo text={import.meta.env.VITE_MINISTER_NAME} />
                  <Service
                    href="/"
                    name="#dataESR tableaux de bord"
                    tagline={getI18nLabel(i18n, "tagline")}
                  />
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
            <nav className="fr-nav" aria-label="Menu principal">
              <ul className="fr-nav__list">
                {NAV_ITEMS.map(({ key, labelKey, to }) => (
                  <li key={key} className="fr-nav__item">
                    <Link
                      to={`${to}${search}`}
                      target="_self"
                      {...(pathname === to && { "aria-current": "page" })}
                      className="fr-nav__link"
                      title={getI18nLabel(i18n, labelKey)}
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
          <nav role="navigation" className="fr-breadcrumb" aria-label="vous êtes ici :">
            <button title="Voir le fil d'Ariane" className="fr-breadcrumb__button" aria-expanded="false" aria-controls="breadcrumb-outcomes">
              Voir le fil d'Ariane
            </button>
            <div className="fr-collapse" id="breadcrumb-outcomes">
              <ol className="fr-breadcrumb__list">
                <li>
                  <a title="Accueil" className="fr-breadcrumb__link" href="/">Accueil</a>
                </li>
                <li>
                  <a title="Parcours des néo-bacheliers inscrits en L1 en 2019" className="fr-breadcrumb__link" href={`${BASE}/flux`}>
                    Parcours des néo-bacheliers inscrits en L1 en 2019
                  </a>
                </li>
                {currentPage && (
                  <li>
                    <a title={getI18nLabel(i18n, currentPage.labelKey)} className="fr-breadcrumb__link" aria-current="page">
                      {getI18nLabel(i18n, currentPage.labelKey)}
                    </a>
                  </li>
                )}
              </ol>
            </div>
          </nav>
        </div>
        <Outlet />
      </main>
      <Footer href={`${BASE}/flux`} sitemapHref={`${BASE}/plan-du-site`} title="#dataESR tableaux de bord" />
    </>
  );
}
