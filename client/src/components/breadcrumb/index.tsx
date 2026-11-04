import { Link, useLocation, useSearchParams } from "react-router-dom";
import { useDashboardVisibility } from "../../hooks/useDashboardVisibility"

type NavConfig = { label?: Record<string, string>; link?: string; sections?: Record<string, NavConfig> }

type BreadcrumbItem = {
  key: string
  label: string
  to?: string
}

type BreadcrumbProps = {
  // navigation config
  config: Record<string, NavConfig>
  // override default board id (first pathname)
  boardId?: string
  // override default root url ("/")
  root?: string
  // override default current page (last pathname segment)
  current?: Partial<NavConfig>
  // optional child label of the current page
  section?: string
}

export default function Breadcrumb({ config, boardId, root, current, section }: BreadcrumbProps) {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const pathSegments = location.pathname.split("/").filter(Boolean)

  const isDashboardVisible = useDashboardVisibility(boardId ?? pathSegments[0] ?? "")

  const currentLang = searchParams.get("language") || "fr"
  const currentSection = searchParams.get("section")

  const getLabel = (item?: NavConfig) => item?.label?.[currentLang] ?? item?.label?.fr ?? ""
  const getLink = (item?: NavConfig) => item?.link // not sure we need to pass searchParams..

  const showRoot = root !== undefined || isDashboardVisible
  const rootItem: BreadcrumbItem = {
    key: "root",
    label: currentLang === "fr" ? "Tableaux" : "Dashboards",
    to: root ?? "/",
  }

  const ancestorsKeys = pathSegments.slice(0, -1)
  const ancestorsItems: BreadcrumbItem[] = ancestorsKeys.flatMap((segment, index) => {
    const segmentConfig = config[segment]
    if (!segmentConfig) return []
    return [{ key: `${index}-${segment}`, label: getLabel(segmentConfig), to: getLink(segmentConfig) }]
  })

  const currentKey = pathSegments[pathSegments.length - 1] ?? ""
  const currentConfig = { ...config[currentKey], ...current } // override current config
  const currentItem: BreadcrumbItem | undefined = getLabel(currentConfig)
    ? { key: "current", label: getLabel(currentConfig), to: getLink(currentConfig) }
    : undefined // display current only if it has a label

  const sectionKey = section ?? currentSection
  const sectionConfig =
    (section && currentConfig?.sections?.[section]) ??
    (currentSection && currentConfig?.sections?.[currentSection]) ??
    (section && { label: { fr: section } }) // manual section get priority and is displayed without config
  const sectionItem = sectionConfig
    ? ({ key: `section-${sectionKey}`, label: getLabel(sectionConfig), to: getLink(sectionConfig) } as BreadcrumbItem)
    : undefined

  const crumbs = [
    ...(showRoot ? [rootItem] : []),
    ...ancestorsItems,
    ...(currentItem ? [currentItem] : []),
    ...(sectionItem ? [sectionItem] : []),
  ]

  return (
    <nav role="navigation" className="fr-breadcrumb fr-mb-2w" aria-label="vous êtes ici :">
      <button type="button" className="fr-breadcrumb__button" aria-expanded="false" aria-controls="breadcrumb-1">
        {currentLang === "fr" ? "Voir le fil d’Ariane" : "Show the breadcrumb"}
      </button>
      <div className="fr-collapse" id="breadcrumb-1">
        <ol className="fr-breadcrumb__list">
          {crumbs.map((crumb, index) => {
            const isCurrent = index === crumbs.length - 1

            return (
              <li key={crumb.key}>
                {isCurrent || !crumb.to ? (
                  <span className="fr-breadcrumb__link" aria-current={isCurrent ? "page" : undefined}>
                    {crumb.label}
                  </span>
                ) : (
                  <Link className="fr-breadcrumb__link" to={crumb.to}>
                    {crumb.label}
                  </Link>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
