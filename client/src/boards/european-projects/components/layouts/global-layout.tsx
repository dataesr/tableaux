import { Container } from "@dataesr/dsfr-plus";
import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useSearchParams } from "react-router-dom";

import CountrySelector from "../../../../components/country-selector/selector";
import Footer from "../../../../components/footer";
import i18n from "./i18n.json";

import "../styles.scss";
import "../../colors.scss";

export default function GlobalLayout() {
  const { pathname } = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const currentLang = searchParams.get("language") || "fr";
  const filtersParams = searchParams.toString();

  useEffect(() => {
    if (!searchParams.get("language")) {
      searchParams.set("language", "fr"); // default value
      setSearchParams(searchParams);
    }
    if (!searchParams.get("country_code")) {
      searchParams.set("country_code", "FRA"); // default value
      setSearchParams(searchParams);
    }
    if (!searchParams.get("range_of_years")) {
      searchParams.set("range_of_years", "2021|2022|2023|2024|2025"); // default value
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  if (!pathname) return null;
  const is = (str: string): boolean => pathname?.startsWith(str);

  function getI18nLabel(key) {
    return i18n[key][currentLang];
  }
  return (
    <div className="ep-styles">
      <header role="banner" className="fr-header">
        <div className="fr-header__body">
          <div className="fr-container">
            <div className="fr-header__body-row">
              <div className="fr-header__brand fr-enlarge-link">
                <div className="fr-header__brand-top">
                  <div className="fr-header__logo">
                    <a href="/" title="Accueil - Nom de l’entité (ministère, secrétariat d‘état, gouvernement)">
                      <p className="fr-logo">
                        Ministère
                        <br />
                        de l'Enseignement
                        <br />
                        supérieur,
                        <br />
                        de la Recherche
                        <br />
                        et de l'Espace
                      </p>
                    </a>
                  </div>
                  <div className="fr-header__navbar">
                    <button
                      data-fr-opened={isMenuOpen ? "true" : "false"}
                      aria-controls="main-navigation"
                      aria-expanded={isMenuOpen}
                      title="Menu"
                      type="button"
                      id="button-header"
                      className="fr-btn--menu fr-btn"
                      onClick={() => setIsMenuOpen((open) => !open)}
                    >
                      Menu
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>
      <nav id="main-navigation" className={`ep-sticky-nav fr-nav${isMenuOpen ? " ep-nav-open" : ""}`} role="navigation" aria-label="Menu principal">
        <Container>
          <ul className="fr-nav__list">
            <li className="fr-nav__item">
              <Link to="/european-projects/accueil" target="_self" {...(pathname === "/european-projects/accueil" && { "aria-current": "page" })} className="fr-nav__link">
                <span className="fr-icon-home-4-line fr-mr-1w" aria-hidden="true" />
                {getI18nLabel("home")}
              </Link>
            </li>
            <li className="fr-nav__item">
              <Link to={`/european-projects/horizon-europe?section=synthesis&${filtersParams}`} target="_self" {...(is("/european-projects/horizon-europe") && { "aria-current": "page" })} className="fr-nav__link">
                {getI18nLabel("he")}
              </Link>
            </li>
            <li className="fr-nav__item">
              <Link to={`/european-projects/msca?${filtersParams}`} target="_self" {...(is("/european-projects/msca") && { "aria-current": "page" })} className="fr-nav__link">
                Focus MSCA
              </Link>
            </li>
            <li className="fr-nav__item">
              <Link to={`/european-projects/erc?${filtersParams}`} target="_self" {...(is("/european-projects/erc") && { "aria-current": "page" })} className="fr-nav__link">
                Focus ERC
              </Link>
            </li>
            <li className="fr-nav__item">
              <Link to="/european-projects/evolution-pcri" target="_self" {...(is("/european-projects/evolution-pcri") && { "aria-current": "page" })} className="fr-nav__link">
                {getI18nLabel("evolutionPcri")}
              </Link>
            </li>
            <li>
              <Link to={`/european-projects/entities?${filtersParams}`} target="_self" {...(is("/european-projects/entities") && { "aria-current": "page" })} className="fr-nav__link">
                {getI18nLabel("entities")}
              </Link>
            </li>
            <li className="fr-nav__item" style={{ marginLeft: "auto" }}>
              <CountrySelector />
            </li>
          </ul>
        </Container>
      </nav>
      <Outlet />
      <Footer />
    </div>
  );
}
