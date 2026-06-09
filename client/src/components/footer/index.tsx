import { Logo } from "@dataesr/dsfr-plus";
import { useLocation, useSearchParams } from "react-router-dom";

import { getI18nLabel } from "../../utils";
import SwitchLanguage from "../switch-language";
import SwitchTheme from "../switch-theme";
import i18n from "./i18n.json";

import "./styles.scss";

const { VITE_MINISTER_NAME, VITE_VERSION } = import.meta.env;

const LANGUAGE_LABELS: Record<string, string> = {
  fr: "Français",
  en: "English",
};

export default function Footer({ href = "/", sitemapHref, title = "Accueil - DataSupR" }: { href?: string; sitemapHref?: string; title?: string }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";

  const pathParts = location.pathname.split("/").filter(Boolean);
  const dashboard = pathParts.length > 0 ? pathParts[0] : "general";
  const contactUrl = `/contact?from=${dashboard}`;
  const accessibilityUrl = `/accessibility?from=${dashboard}`;
  return (
    <footer className="fr-footer" role="contentinfo" id="footer">
      <div className="fr-container">
        <div className="fr-footer__body">
          <div className="fr-footer__brand fr-enlarge-link">
            <a href={href} title={title}>
              <Logo text={VITE_MINISTER_NAME} />
            </a>
          </div>
          <div>
            <svg aria-hidden="true" viewBox="0 0 1167.77 752.85" width="100%">
              <use className="sies-logo" href="/logos/sies_logo_signature.svg#sies-logo-text" />
              <use href="/logos/sies_logo_signature.svg#sies-logo-artwork" />
            </svg>
          </div>
          <div className="fr-footer__content">
            <ul className="fr-footer__content-list">
              <li className="fr-footer__content-item">
                <a className="fr-footer__content-link" target="_blank" rel="noopener external" title="Legifrance - nouvelle fenêtre" href="https://legifrance.gouv.fr">
                  legifrance.gouv.fr
                </a>
              </li>
              <li className="fr-footer__content-item">
                <a className="fr-footer__content-link" target="_blank" rel="noopener external" title="Gouvernement français - nouvelle fenêtre" href="https://gouvernement.fr">
                  gouvernement.fr
                </a>
              </li>
              <li className="fr-footer__content-item">
                <a className="fr-footer__content-link" target="_blank" rel="noopener external" title="Service public - nouvelle fenêtre" href="https://service-public.fr">
                  service-public.fr
                </a>
              </li>
              <li className="fr-footer__content-item">
                <a className="fr-footer__content-link" target="_blank" rel="noopener external" title="DataGouv - nouvelle fenêtre" href="https://data.gouv.fr">
                  data.gouv.fr
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="fr-footer__bottom">
          <ul className="fr-footer__bottom-list">
            <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href={sitemapHref ?? "#"}>
                {getI18nLabel(i18n, "sitemap")}
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href="#">
                {getI18nLabel(i18n, "accessibility")}
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href="#">
                {getI18nLabel(i18n, "legalNotice")}
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href="#">
                {getI18nLabel(i18n, "personalData")}
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href="/cookies">
                {getI18nLabel(i18n, "cookies")}
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href={accessibilityUrl}>
                {getI18nLabel(i18n, "accessibility")}
              </a>
            </li>{" "}
            <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href={contactUrl}>
                {getI18nLabel(i18n, "contact")}
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href={`https://github.com/dataesr/datasupr/releases/tag/v${VITE_VERSION}`} rel="noreferer noopenner" target="_blank">
                {`v${VITE_VERSION}`}
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <button className="fr-footer__bottom-link fr-fi-theme-fill fr-link--icon-left" aria-controls="fr-theme-modal" data-fr-opened="false">
                Paramètres d'affichage
              </button>
            </li>
            {searchParams.has("language") && (
              <li className="fr-footer__bottom-item">
                <button className="fr-footer__bottom-link fr-icon-translate-2 fr-link--icon-left" aria-controls="fr-translate-modal" data-fr-opened="false">
                  {LANGUAGE_LABELS[currentLang] || LANGUAGE_LABELS.fr}
                </button>
              </li>
            )}
          </ul>
          <div className="fr-footer__bottom-copy">
            <p
              dangerouslySetInnerHTML={{
                __html: getI18nLabel(i18n, "rightsReserved"),
              }}
            />
          </div>
        </div>
      </div>
      <SwitchTheme />
      <SwitchLanguage />
    </footer>
  );
}
