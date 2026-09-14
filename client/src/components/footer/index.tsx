import { Logo } from "@dataesr/dsfr-plus";
import { useLocation, useSearchParams } from "react-router-dom";

import { getI18nLabel, isInProduction } from "../../utils";
import SwitchLanguage from "../switch-language";
import SwitchTheme from "../switch-theme";
import i18n from "./i18n.json";

const { VITE_MINISTER_NAME, VITE_VERSION } = import.meta.env;

const LANGUAGE_LABELS: Record<string, string> = {
  fr: "Français",
  en: "English",
};

const isProd = isInProduction();


export default function Footer({ href = "/", sitemapHref, title = "Accueil - Tableaux" }: { href?: string; sitemapHref?: string; title?: string }) {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";

  const pathParts = location.pathname.split("/").filter(Boolean);
  const dashboard = pathParts.length > 0 ? pathParts[0] : "general";
  const contactUrl = `/contact?from=${dashboard}`;
  const accessibilityUrl = `/accessibility?from=${dashboard}`;
  const sitemapUrl = sitemapHref ?? `/plan-du-site?from=${dashboard}`;
  return (
    <footer className="fr-footer" role="contentinfo" id="footer">
      <div className="fr-container">
        <div className="fr-footer__body">
          <div className="fr-footer__brand fr-enlarge-link">
            <a href={href} title={title}>
              <Logo text={VITE_MINISTER_NAME} />
            </a>
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
              <li className="fr-footer__content-item">
                <a className="fr-footer__content-link fr-icon-github-fill fr-link--icon-left" target="_blank" rel="noopener external" title="Github dataESR - nouvelle fenêtre" href="https://github.com/dataesr/tableaux">
                  Github
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="fr-footer__bottom">
          <ul className="fr-footer__bottom-list">
            <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href={sitemapUrl} title={getI18nLabel(i18n, "sitemap")}>
                {getI18nLabel(i18n, "sitemap")}
              </a>
            </li>
            {!isProd && <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href="/mentions-legales" title={getI18nLabel(i18n, "legalNotice")}>
                {getI18nLabel(i18n, "legalNotice")}
              </a>
            </li>}
            {!isProd && <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href="/donnees-personnelles" title={getI18nLabel(i18n, "personalData")}>
                {getI18nLabel(i18n, "personalData")}
              </a>
            </li>}
            {!isProd && <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href="/cgu" title={getI18nLabel(i18n, "cgu")}>
                {getI18nLabel(i18n, "cgu")}
              </a>
            </li>}
            <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href="/cookies" title={getI18nLabel(i18n, "cookies")}>
                {getI18nLabel(i18n, "cookies")}
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href={accessibilityUrl} title={getI18nLabel(i18n, "accessibility")}>
                {getI18nLabel(i18n, "accessibility")}
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href={contactUrl} title={getI18nLabel(i18n, "contact")}>
                {getI18nLabel(i18n, "contact")}
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <a className="fr-footer__bottom-link" href={`https://github.com/dataesr/tableaux/releases/tag/v${VITE_VERSION}`} title={`v${VITE_VERSION} - nouvelle fenêtre`} rel="noreferrer noopener external" target="_blank">
                {`v${VITE_VERSION}`}
              </a>
            </li>
            <li className="fr-footer__bottom-item">
              <button type="button" title="Paramètres d'affichage" className="fr-footer__bottom-link fr-fi-theme-fill fr-link--icon-left" aria-controls="fr-theme-modal" data-fr-opened="false">
                Paramètres d'affichage
              </button>
            </li>
            {searchParams.has("language") && (
              <li className="fr-footer__bottom-item">
                <button type="button" title={LANGUAGE_LABELS[currentLang] || LANGUAGE_LABELS.fr} className="fr-footer__bottom-link fr-icon-translate-2 fr-link--icon-left" aria-controls="fr-translate-modal" data-fr-opened="false">
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
