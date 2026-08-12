import { Logo, Service } from "@dataesr/dsfr-plus";
import { Link, Outlet, useLocation } from "react-router-dom";

import Footer from "../../../../components/footer";
import { getI18nLabel } from "../../../../utils";
import i18n from "./i18n.json";

import "./styles.scss"


export default function GlobalLayout() {
  const { pathname } = useLocation();


  if (!pathname) return null;

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
                    href="/personnel-enseignant/accueil"
                    name="#dataESR tableaux de bord"
                    tagline="Tableau de bord du personnel enseignant des établissements d'enseignement supérieur français"
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
              {getI18nLabel(i18n, "close")}
            </button>
            <div className="fr-header__menu-links"></div>
            <nav
              className="fr-nav"
              aria-label="Menu principal"
            >
              <ul className="fr-nav__list">
                <li className="fr-nav__item">
                  <Link
                    to="/personnel-enseignant/accueil"
                    target="_self"
                    {...(pathname === "/personnel-enseignant/accueil" && {
                      "aria-current": "page",
                    })}
                    className="fr-nav__link"
                  >
                    <span
                      className="fr-icon-home-4-line fr-mr-1w"
                      aria-hidden="true"
                    />
                    {getI18nLabel(i18n, "home")}
                  </Link>
                </li>
                <li className="fr-nav__item">
                  <Link
                    to={`/personnel-enseignant/etablissements`}
                    target="_self"
                    {...(pathname === "/personnel-enseignant/etablissements" && {
                      "aria-current": "page",
                    })}
                    className="fr-nav__link"
                  >
                    Établissements
                  </Link>
                </li>
                <li className="fr-nav__item">
                  <Link
                    to={`/personnel-enseignant/disciplines`}
                    target="_self"
                    {...(pathname === "/personnel-enseignant/disciplines" && {
                      "aria-current": "page",
                    })}
                    className="fr-nav__link"
                  >
                    Disciplines
                  </Link>
                </li>
                <li className="fr-nav__item">
                  <Link
                    to={`/personnel-enseignant/regions`}
                    target="_self"
                    {...(pathname === "/personnel-enseignant/regions" && {
                      "aria-current": "page",
                    })}
                    className="fr-nav__link"
                  >
                    Régions
                  </Link>
                </li>
                <li className="fr-nav__item">
                  <Link
                    to={`/personnel-enseignant/academies`}
                    target="_self"
                    {...(pathname === "/personnel-enseignant/academies" && {
                      "aria-current": "page",
                    })}
                    className="fr-nav__link"
                  >
                    Académies
                  </Link>
                </li>
                {/* <li className="fr-nav__item">
                  <Link
                    to={"/personnel-enseignant/faq"}
                    target="_self"
                    {...(pathname === "/personnel-enseignant/faq" && {
                      "aria-current": "page",
                    })}
                    className="fr-nav__link"
                  >
                    FAQ
                  </Link>
                </li> */}
                <li className="fr-nav__item">
                  <Link
                    to={"/personnel-enseignant/definitions"}
                    target="_self"
                    {...(pathname === "/personnel-enseignant/definitions" && {
                      "aria-current": "page",
                    })}
                    className="fr-nav__link"
                  >
                    Définitions
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>



      <Outlet />
      <Footer
        href="/personnel-enseignant/accueil"
        title="#dataESR tableaux de bord"
      />
    </>
  );
}
