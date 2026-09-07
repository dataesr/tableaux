import { Logo, Service } from "@dataesr/dsfr-plus";
import { Outlet } from "react-router-dom";
import i18n from "./i18n.json";

import Footer from "../../components/footer";
import { useTitle } from "../../hooks/usePageTitle";
import { getI18nLabel } from "../../utils";
import TranslateButton from "../../components/translate-button";

export default function GlobalLayout() {

  useTitle("Nous contacter");


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
                    tagline="Contact"
                  />
                </div>
              </div>
              <TranslateButton />
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
              {getI18nLabel(i18n, "heroLabel")}
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
