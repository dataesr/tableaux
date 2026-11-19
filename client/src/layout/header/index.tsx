import { Button, FastAccess, Header, Link, Logo, Nav, Service } from "@dataesr/dsfr-plus"
import { ReactNode, useEffect } from "react"
import { useSearchParams } from "react-router-dom"

import TranslateButton from "../../components/translate-button"
import { getI18nLabel } from "../../utils"
import i18n from "./i18n.json"

import "./styles.scss"

type HeaderProps = {
  exploreLink?: boolean
  extra?: ReactNode
  items?: { current: boolean; icon?: string; key: string; label: string; to: string }[]
  languageSelector?: boolean
  navExtra?: ReactNode
  serviceHref?: string
  serviceName?: string
  serviceTag?: string
  stickyNav?: boolean
}

export default function SiteHeader({
  exploreLink = false,
  extra,
  items = [],
  languageSelector = false,
  navExtra,
  serviceHref = "/",
  serviceName,
  serviceTag,
  stickyNav = false,
}: HeaderProps) {
  const [searchParams, setSearchParams] = useSearchParams()
  const urlLang = searchParams.get("language")?.toLowerCase()
  const lang = urlLang === "en" ? "en" : "fr"
  const hasNav = items.length > 0 || !!navExtra
  const t = (key: string) => getI18nLabel(i18n, key, lang)
  const name = serviceName ?? t("serviceName")

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(() => {
    if (!languageSelector || urlLang) return
    setSearchParams(
      (params) => {
        params.set("language", "fr")
        return params
      },
      { replace: true },
    )
  }, [languageSelector, urlLang, setSearchParams])

  return (
    <Header className={stickyNav && hasNav ? "header--sticky-nav" : undefined} closeLabel={t("close")} menuLabel={t("menu")}>
      <Logo text={t("ministry")} />
      <Service href={serviceHref} name={name} tagline={serviceTag ?? t("serviceTag")} title={`${t("home")} - ${name}`} />
      <FastAccess>
        {exploreLink && (
          <Button as="a" icon="layout-grid-line" iconPosition="left" href="/">
            {t("explore")}
          </Button>
        )}
        {extra}
        <Button aria-controls="fr-theme-modal" data-fr-opened="false" icon="theme-fill" iconPosition="left" type="button">
          {t("theme")}
        </Button>
        {languageSelector && <TranslateButton />}
      </FastAccess>
      {hasNav && (
        <Nav aria-label={t("mainNavigation")} extra={navExtra} id="main-menu">
          {items.map(({ current, icon, key, label, to }) => (
            <Link aria-current={current ? "page" : undefined} href={to} key={key} target="_self">
              {icon && <span aria-hidden="true" className={`fr-icon-${icon} fr-mr-1w`} />}
              {label}
            </Link>
          ))}
        </Nav>
      )}
    </Header>
  )
}
