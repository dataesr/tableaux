import { Logo } from "@dataesr/dsfr-plus"
import { ReactNode, useEffect } from "react"
import { Link, useSearchParams } from "react-router-dom"

import { getI18nLabel } from "../../utils"
import i18n from "./i18n.json"

import "./styles.scss"

export type HeaderNavItem = {
  current: boolean
  // Nom de l'icône DSFR sans préfixe ("home-4-line" pour `fr-icon-home-4-line`)
  icon?: string
  key: string
  label: string
  to: string
}

type HeaderProps = {
  // Contenu additionnel dans les outils de l'en-tête (ex. sélecteur de pays)
  extra?: ReactNode
  items?: HeaderNavItem[]
  // Lien « Explorer d'autres tableaux de bord » (false par défaut)
  exploreLink?: boolean
  // Sélecteur de langue (false par défaut)
  languageSelector?: boolean
  // Bouton « Paramètres d'affichage » (true par défaut)
  themeSwitch?: boolean
  // Contenu additionnel aligné à droite dans la barre de menu (ex. sélecteur de pays)
  navExtra?: ReactNode
  serviceHref?: string
  serviceName?: string // Titre du service (ex. « Enseignement supérieur, recherche et espace »)
  serviceTag?: string // Slogan du service (ex. « Ensemble de tableaux de bord de l'enseignement supérieur, de la recherche et de l'espace »)
}

const MENU_MODAL_ID = "header-menu-modal"
const MENU_BUTTON_ID = "header-menu-button"
const LANGUAGES = [
  { code: "fr", label: "FR - Français" },
  { code: "en", label: "EN - English" },
]

type DsfrApi = (element: Element | null) => { modal?: { conceal: () => void } } | undefined

// Le JS du DSFR (chargé par DSFRConfig) gère les modales et menus ; on lui demande de refermer après une navigation.
function concealModal(id: string) {
  try {
    ;(window as unknown as { dsfr?: DsfrApi }).dsfr?.(document.getElementById(id))?.modal?.conceal()
  } catch {
    // Le menu reste ouvert : sans conséquence
  }
}

// Unique en-tête de l'application (DSFR), avec les liens d'évitement. Toujours utilisé via un layout.
export default function Header({
  extra,
  items = [],
  exploreLink = false,
  languageSelector = false,
  themeSwitch = true,
  navExtra,
  serviceHref = "/",
  serviceName,
  serviceTag,
}: HeaderProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlLang = searchParams.get("language")?.toLowerCase()
  const lang = urlLang === "en" ? "en" : "fr"
  const hasNav = items.length > 0 || !!navExtra
  const t = (key: string) => getI18nLabel(i18n, key, lang)

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    if (languageSelector && !urlLang) {
      setSearchParams(
        (params) => {
          params.set("language", "fr")
          return params
        },
        { replace: true },
      )
    }
  }, [languageSelector, urlLang, setSearchParams])

  const changeLanguage = (code: string) => {
    setSearchParams((params) => {
      params.set("language", code)
      return params
    })
  }

  const name = serviceName ?? t("serviceName")
  const tag = serviceTag ?? t("serviceTag")

  return (
    <>
      <div className="fr-skiplinks">
        <nav aria-label={t("skipLinks")} className="fr-container" role="navigation">
          <ul className="fr-skiplinks__list">
            <li>
              <a className="fr-link" href="#main-content">
                {t("skipContent")}
              </a>
            </li>
            {hasNav && (
              <li>
                <a className="fr-link" href="#main-menu">
                  {t("skipMenu")}
                </a>
              </li>
            )}
            <li>
              <a className="fr-link" href="#footer">
                {t("skipFooter")}
              </a>
            </li>
          </ul>
        </nav>
      </div>
      <header className="fr-header" role="banner">
        <div className="fr-header__body">
          <div className="fr-container">
            <div className="fr-header__body-row">
              <div className="fr-header__brand fr-enlarge-link">
                <div className="fr-header__brand-top">
                  <Logo text={import.meta.env.VITE_MINISTER_NAME} />
                  <div className="fr-header__navbar">
                    <button
                      aria-controls={MENU_MODAL_ID}
                      aria-haspopup="menu"
                      className="fr-btn--menu fr-btn"
                      data-fr-opened="false"
                      id={MENU_BUTTON_ID}
                      title={t("menu")}
                      type="button"
                    >
                      {t("menu")}
                    </button>
                  </div>
                </div>
                <div className="fr-header__service">
                  <Link title={name} to={serviceHref}>
                    <p className="fr-header__service-title">{name}</p>
                  </Link>
                  {tag && <p className="fr-header__service-tagline">{tag}</p>}
                </div>
              </div>
              <div className="fr-header__tools">
                <div className="fr-header__tools-links">
                  <ul className="fr-btns-group">
                    {exploreLink && (
                      <li>
                        <a className="fr-btn fr-icon-layout-grid-line fr-btn--icon-left" href="/">
                          {t("explore")}
                        </a>
                      </li>
                    )}
                    {extra && <li>{extra}</li>}
                    {languageSelector && (
                      <li>
                        <nav aria-label={t("languagesSelector")} className="fr-translate fr-nav" role="navigation">
                          <div className="fr-nav__item">
                            <button
                              aria-controls="header-translate-menu"
                              aria-expanded="false"
                              className="fr-translate__btn fr-btn"
                              title={t("languagesSelector")}
                              type="button"
                            >
                              {lang.toUpperCase()}
                              <span className="fr-hidden-lg"> - {lang === "fr" ? "Français" : "English"}</span>
                            </button>
                            <div className="fr-collapse fr-translate__menu fr-menu" id="header-translate-menu">
                              <ul className="fr-menu__list">
                                {LANGUAGES.map(({ code, label }) => (
                                  <li key={code}>
                                    <button
                                      aria-current={lang === code ? "true" : undefined}
                                      className="fr-translate__language fr-nav__link"
                                      lang={code}
                                      onClick={() => changeLanguage(code)}
                                      type="button"
                                    >
                                      {label}
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </nav>
                      </li>
                    )}
                    {themeSwitch && (
                      <li>
                        <button
                          aria-controls="fr-theme-modal"
                          className="fr-btn fr-icon-theme-fill fr-btn--icon-left"
                          data-fr-opened="false"
                          type="button"
                        >
                          {t("theme")}
                        </button>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div aria-labelledby={MENU_BUTTON_ID} className="fr-header__menu fr-modal" id={MENU_MODAL_ID}>
          <div className="fr-container">
            <button aria-controls={MENU_MODAL_ID} className="fr-btn--close fr-btn" title={t("close")} type="button">
              {t("close")}
            </button>
            <div className="fr-header__menu-links" />
            {hasNav && (
              <nav aria-label={t("mainNavigation")} className="fr-nav" id="main-menu" role="navigation">
                <ul className="fr-nav__list">
                  {items.map(({ current, icon, key, label, to }) => (
                    <li className="fr-nav__item" key={key}>
                      <Link
                        aria-current={current ? "page" : undefined}
                        className="fr-nav__link"
                        onClick={() => concealModal(MENU_MODAL_ID)}
                        target="_self"
                        to={to}
                      >
                        {icon && <span aria-hidden="true" className={`fr-icon-${icon} fr-mr-1w`} />}
                        {label}
                      </Link>
                    </li>
                  ))}
                  {navExtra && <li className="fr-nav__item header-nav-extra">{navExtra}</li>}
                </ul>
              </nav>
            )}
          </div>
        </div>
      </header>
    </>
  )
}
