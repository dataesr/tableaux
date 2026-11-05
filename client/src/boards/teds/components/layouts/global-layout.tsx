import { useEffect } from "react"
import { useLocation, useSearchParams } from "react-router-dom"

import { Layout } from "../../../../layout/layout"
import { getI18nLabel } from "../../../../utils"
import i18n from "./i18n.json"

const BASE = "/teds"

export default function GlobalLayout({ languageSelector = false }) {
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()
  const filtersParams = searchParams.toString()

  useEffect(() => {
    if (!searchParams.get("country_code")) {
      searchParams.set("country_code", "FRA") // default value
      setSearchParams(searchParams)
    }
  }, [searchParams, setSearchParams])

  if (!pathname) return null

  const items = [
    { key: "home", icon: "home-4-line", to: `${BASE}/home` },
    { key: "countries", to: `${BASE}/countries?${filtersParams}` },
    { key: "entities", to: `${BASE}/entities?${filtersParams}` },
  ].map(({ key, icon, to }) => ({
    current: pathname.startsWith(to.split("?")[0]),
    icon,
    key,
    label: getI18nLabel(i18n, key),
    to,
  }))

  return (
    <Layout
      items={items}
      exploreLink
      languageSelector={languageSelector}
      serviceHref={`${BASE}/home`}
      serviceTag={getI18nLabel(i18n, "tagline")}
    />
  )
}
