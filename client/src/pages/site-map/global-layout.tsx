import { Logo, Service } from "@dataesr/dsfr-plus";
import { useEffect } from "react";
import { Outlet, useSearchParams } from "react-router-dom";

import Footer from "../../components/footer";
import { useTitle } from "../../hooks/usePageTitle";
import { getI18nLabel } from "../../utils";
import i18n from "./i18n.json";

import "./sitemap-page";


export default function GlobalLayout() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";

  useTitle(getI18nLabel(i18n, "pageTitle", currentLang));

  useEffect(() => {
    if (!searchParams.get("language")) {
      searchParams.set("language", "fr");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  return (
    <>
      <header role="banner" className="fr-header">
        <div className="fr-header__body">
          <div className="fr-container">
            <div className="fr-header__body-row">
              <div className="fr-header__brand fr-enlarge-link">
                <div className="fr-header__brand-top">
                  <Logo text={import.meta.env.VITE_MINISTER_NAME} />
                  <Service
                    href="/"
                    name="#dataESR tableaux de bord"
                    tagline={getI18nLabel(i18n, "pageTitle", currentLang)}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          className="fr-header__menu fr-modal"
          id="modal-header"
          aria-labelledby="button-header"
        >
          <div className="fr-container">
            <button
              aria-controls="modal-header"
              title="Fermer"
              type="button"
              id="button-2168"
              className="fr-btn--close fr-btn"
            >
              {getI18nLabel(i18n, "legal-notice", currentLang)}
            </button>
            <div className="fr-header__menu-links"></div>
          </div>
        </div>
      </header>
      <Outlet />
      <Footer />
    </>
  );
}
