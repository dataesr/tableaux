import { Button, Link, Logo } from "@dataesr/dsfr-plus"
import { ReactNode, useEffect } from "react"
import { useSearchParams } from "react-router-dom"
import TranslateButton from "../../components/translate-button"
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
  // La barre de navigation reste fixe
  stickyNav?: boolean
  // Contenu additionnel aligné à droite dans la barre de menu (ex. sélecteur de pays)
  navExtra?: ReactNode
  serviceHref?: string // Lien du service ("/" par défaut)
  serviceName?: string // Titre du service (ex. « Enseignement supérieur, recherche et espace »)
  serviceTag?: string // Slogan du service (ex. « Ensemble de tableaux de bord de l'enseignement supérieur, de la recherche et de l'espace »)
}

export default function Header({
  extra,
  items = [],
  exploreLink = false,
  languageSelector = false,
  themeSwitch = true,
  stickyNav = false,
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

  const name = serviceName ?? t("serviceName")
  const tag = serviceTag ?? t("serviceTag")

  return (
    <>
      <div className="fr-skiplinks">
        <nav aria-label={t("skipLinks")} className="fr-container" role="navigation">
          <ul className="fr-skiplinks__list">
            <li>
              <Link href="#main-content" isSimple>
                {t("skipContent")}
              </Link>
            </li>
            {hasNav && (
              <li>
                <Link href="#main-menu" isSimple>
                  {t("skipMenu")}
                </Link>
              </li>
            )}
            <li>
              <Link href="#footer" isSimple>
                {t("skipFooter")}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <header className={`fr-header${stickyNav && hasNav ? " header--sticky-nav" : ""}`} role="banner">
        <div className="fr-header__body">
          <div className="fr-container">
            <div className="fr-header__body-row">
              <div className="fr-header__brand fr-enlarge-link">
                <div className="fr-header__brand-top">
                  <Logo text={t("ministry")} />
                  <div className="fr-header__navbar">
                    <Button
                      aria-controls="header-menu-modal"
                      className="fr-btn--menu"
                      data-fr-opened="false"
                      id="header-menu-button"
                      title={t("menu")}
                    >
                      {t("menu")}
                    </Button>
                  </div>
                </div>
                <div className="fr-header__service">
                  <Link title={name} href={serviceHref}>
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
                        <Button as="a" icon="layout-grid-line" iconPosition="left" href="/">
                          {t("explore")}
                        </Button>
                      </li>
                    )}
                    {extra && <li>{extra}</li>}
                    {languageSelector && (
                      <li>
                        <TranslateButton />
                      </li>
                    )}
                    {themeSwitch && (
                      <li>
                        <Button
                          aria-controls="fr-theme-modal"
                          data-fr-opened="false"
                          icon="theme-fill"
                          iconPosition="left"
                          type="button"
                        >
                          {t("theme")}
                        </Button>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div aria-labelledby="header-menu-button" className="fr-header__menu fr-modal" id="header-menu-modal">
          <div className="fr-container">
            <Button aria-controls="header-menu-modal" className="fr-btn--close" title={t("close")}>
              {t("close")}
            </Button>
            <div className="fr-header__menu-links" />
            {hasNav && (
              <nav aria-label={t("mainNavigation")} className="fr-nav" id="main-menu" role="navigation">
                <ul className="fr-nav__list">
                  {items.map(({ current, icon, key, label, to }) => (
                    <li className="fr-nav__item" key={key}>
                      <Link aria-current={current ? "page" : undefined} className="fr-nav__link" target="_self" href={to}>
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
