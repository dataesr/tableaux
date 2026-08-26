import { Logo, Service } from "@dataesr/dsfr-plus";
import { Link, Outlet, useLocation, useSearchParams } from "react-router-dom";

import Footer from "../../../../components/footer";
import { getI18nLabel } from "../../../../utils";
import i18n from "./i18n.json";

import "./styles.scss";

const FILTER_PARAMS = ["type", "typologie", "region", "rce", "devimmo"];

export default function GlobalLayout() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();

  const paramsWithoutFilters = new URLSearchParams(searchParams);
  FILTER_PARAMS.forEach((key) => paramsWithoutFilters.delete(key));
  const cleanParams = paramsWithoutFilters.toString();

  if (!pathname) return null;
  const is = (str: string): boolean => pathname?.startsWith(str);

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
                    tagline="Financement des établissements d'enseignement supérieur français "
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
              role="navigation"
              aria-label="Menu principal"
            >
              <ul className="fr-nav__list">
                <li className="fr-nav__item">
                  <Link
                    to="/structures-finance/accueil"
                    target="_self"
                    {...(pathname === "/structures-finance/accueil" && {
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
                    to={`/structures-finance/etablissements?${cleanParams}${cleanParams ? "&" : ""
                      }section=ressources`}
                    target="_self"
                    {...(is("/structures-finance/etablissements") && {
                      "aria-current": "page",
                    })}
                    className="fr-nav__link"
                  >
                    Vue par établissement
                  </Link>
                </li>
                <li className="fr-nav__item">
                  <Link
                    to={`/structures-finance/national${cleanParams ? `?${cleanParams}` : ""}`}
                    target="_self"
                    {...(is("/structures-finance/national") && {
                      "aria-current": "page",
                    })}
                    className="fr-nav__link"
                  >
                    Vue nationale
                  </Link>
                </li>
                {/* <li className="fr-nav__item">
                  <Link
                    to={"/structures-finance/faq"}
                    target="_self"
                    {...(is("/structures-finance/faq") && {
                      "aria-current": "page",
                    })}
                    className="fr-nav__link"
                  >
                    FAQ
                  </Link>
                </li> */}
                <li className="fr-nav__item">
                  <Link
                    to={"/structures-finance/definitions"}
                    target="_self"
                    {...(is("/structures-finance/definitions") && {
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
        href="/structures-finance/accueil"
        title="#dataESR tableaux de bord"
      />
    </>
  );
}
