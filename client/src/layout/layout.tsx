import { Button, FastAccess, Header, Logo, Service } from "@dataesr/dsfr-plus";
import { useEffect } from "react";
import { Outlet, useSearchParams } from "react-router-dom";

import CookieConsent from "../components/cookies/cookie-consent/index";
import Footer from "../components/footer";
import SwitchTheme from "../components/switch-theme";
import { getI18nLabel } from "../utils";
import i18n from "./i18n.json";

export function Layout({ languageSelector = false }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";

  useEffect(() => {
    if (!searchParams.get("language") && languageSelector) {
      searchParams.set("language", "FR"); // default value
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams, languageSelector]);

  return (
    <>
      <Header>
        <Logo text={import.meta.env.VITE_MINISTER_NAME} />
        <Service name="dataSupR" tagline={getI18nLabel(i18n, "tagline")} />
        <FastAccess>
          <Button as="a" href="/" icon="github-fill" size="sm" variant="text">
            {getI18nLabel(i18n, "explore")}
          </Button>
          <Button
            as="a"
            href="https://data.enseignementsup-recherche.gouv.fr/explore/dataset/fr-esr-atlas_regional-effectifs-d-etudiants-inscrits/table/?disjunctive.rgp_formations_ou_etablissements&sort=-rentree"
            icon="code-s-slash-line"
            rel="noreferer noopener"
            size="sm"
            target="_blank"
            variant="text"
          >
            {getI18nLabel(i18n, "datasets")}
          </Button>
          <Button aria-controls="fr-theme-modal" className="fr-btn fr-icon-theme-fill" data-fr-opened="false">
            {getI18nLabel(i18n, "themes")}
          </Button>
          {languageSelector && (
            <nav role="navigation" className="fr-translate fr-nav">
              <div className="fr-nav__item">
                <button
                  aria-controls="translate-1177"
                  aria-expanded="false"
                  className="fr-translate__btn fr-btn fr-btn--tertiary"
                  title={getI18nLabel(i18n, "languagesSelector")}
                >
                  {currentLang === "fr" ? (
                    <>
                      FR<span className="fr-hidden-lg"> - Français</span>
                    </>
                  ) : (
                    <>
                      EN<span className="fr-hidden-lg"> - English</span>
                    </>
                  )}
                </button>
                <div className="fr-collapse fr-translate__menu fr-menu" id="translate-1177">
                  <ul className="fr-menu__list">
                    <li>
                      <Button
                        aria-current={searchParams.get("language") === "fr"}
                        className="fr-translate__language fr-nav__link"
                        onClick={() => {
                          searchParams.set("language", "fr");
                          setSearchParams(searchParams);
                        }}
                      >
                        FR - Français
                      </Button>
                    </li>
                    <li>
                      <Button
                        aria-current={searchParams.get("language") === "en"}
                        className="fr-translate__language fr-nav__link"
                        onClick={() => {
                          searchParams.set("language", "en");
                          setSearchParams(searchParams);
                        }}
                      >
                        EN - English
                      </Button>
                    </li>
                  </ul>
                </div>
              </div>
            </nav>
          )}
        </FastAccess>
      </Header>
      <main id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      <SwitchTheme />
      <CookieConsent />
    </>
  );
}
