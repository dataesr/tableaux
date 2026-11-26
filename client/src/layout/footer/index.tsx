import { Footer, Link } from "@dataesr/dsfr-plus"
import { useLocation, useSearchParams } from "react-router-dom"

import SwitchLanguage from "../../components/switch-language"
import SwitchTheme from "../../components/switch-theme"
import { getI18nLabel, isInProduction } from "../../utils"
import i18n from "./i18n.json"

const { VITE_MINISTER_NAME, VITE_VERSION } = import.meta.env

const BOARD_CONFIGS = import.meta.glob("../../boards/*/sitemap-config.ts")

type FooterProps = {
  href?: string
  sitemapHref?: string
  title?: string
}

export default function FooterWrapper({ href = "/", sitemapHref, title = "Accueil - Tableaux" }: FooterProps) {
  const { pathname } = useLocation()
  const [searchParams] = useSearchParams()
  const lang = searchParams.get("language")?.toLowerCase() === "en" ? "en" : "fr"
  const t = (key: string) => getI18nLabel(i18n, key, lang)

  const isBoard = (id?: string | null): id is string =>
    !!id && `../../boards/${id}/sitemap-config.ts` in BOARD_CONFIGS
  const from = searchParams.get("from")
  const pathBoard = pathname.split("/").filter(Boolean)[0]
  const dashboard = isBoard(from) ? from : isBoard(pathBoard) ? pathBoard : "general"

  return (
    <>
      <Footer
        brand={VITE_MINISTER_NAME}
        homeHref={href}
        homeTitle={title}
        id="footer"
        license={
          <>
            {t("license")}{" "}
            <Link href="https://github.com/etalab/licence-ouverte/blob/master/LO.md" rel="noopener external" target="_blank" title={`${t("licenseName")} - ${t("newWindow")}`}>
              {t("licenseName")}
            </Link>
          </>
        }
        newWindowLabel={t("newWindow")}
      >
        <Link href={sitemapHref ?? `/plan-du-site?from=${dashboard}`}>{t("sitemap")}</Link>
        {!isInProduction() && <Link href="/mentions-legales">{t("legalNotice")}</Link>}
        {!isInProduction() && <Link href="/donnees-personnelles">{t("personalData")}</Link>}
        {!isInProduction() && <Link href="/cgu">{t("cgu")}</Link>}
        <Link href="/cookies">{t("cookies")}</Link>
        <Link href={`/accessibility?from=${dashboard}`}>{t("accessibility")}</Link>
        <Link href={`/contact?from=${dashboard}`}>{t("contact")}</Link>
        <Link href="https://github.com/dataesr/tableaux" icon="github-fill" rel="noopener external" target="_blank" title={`Github dataESR - ${t("newWindow")}`}>
          Github
        </Link>
        <Link href={`https://github.com/dataesr/tableaux/releases/tag/v${VITE_VERSION}`} rel="noopener external" target="_blank" title={`v${VITE_VERSION} - ${t("newWindow")}`}>
          {`v${VITE_VERSION}`}
        </Link>
        <button type="button" className="fr-fi-theme-fill fr-link--icon-left" aria-controls="fr-theme-modal" data-fr-opened="false">
          Paramètres d'affichage
        </button>
        {searchParams.has("language") && (
          <button type="button" className="fr-icon-translate-2 fr-link--icon-left" aria-controls="fr-translate-modal" data-fr-opened="false">
            {lang === "en" ? "English" : "Français"}
          </button>
        )}
      </Footer>
      <SwitchTheme />
      <SwitchLanguage />
    </>
  )
}
