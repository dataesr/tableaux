import React, { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"

import { useTitle } from "./hooks/usePageTitle.tsx"
import { isInProduction } from "./utils.tsx"

const AccessibilityLayout = lazy(() => import("./components/accessibility/layouts/global-layout.tsx"))
const AccessibilityPage = lazy(() => import("./components/accessibility/page.tsx"))
const AdminRoutes = lazy(() => import("./boards/admin/routes.tsx"))
const AtlasRoutes = lazy(() => import("./boards/atlas/routes.tsx"))
const CGULayout = lazy(() => import("./pages/cgu/global-layout.tsx"))
const CGUPage = lazy(() => import("./pages/cgu/index.tsx"))
const ContactLayout = lazy(() => import("./pages/contact/global-layout.tsx"))
const ContactPage = lazy(() => import("./pages/contact/index.tsx"))
const CookiePolicyPage = lazy(() => import("./components/cookies/cookie-policy-page/index.tsx"))
const DevenirEtudiantsRoutes = lazy(() => import("./boards/devenir-etudiants/routes.tsx"))
const EuropeanProjectsRoutes = lazy(() => import("./boards/european-projects/routes.tsx"))
const FundingsRoutes = lazy(() => import("./boards/financements-par-aap/routes.tsx"))
const GraduatesRoutes = lazy(() => import("./boards/graduates/routes.tsx"))
const HomePage = lazy(() => import("./boards/home-page.tsx"))
const Integration = lazy(() => import("./boards/integration/index.tsx"))
const LegalNoticeLayout = lazy(() => import("./pages/legal-notice/global-layout.tsx"))
const LegalNoticePage = lazy(() => import("./pages/legal-notice/index.tsx"))
const NotFoundPage = lazy(() => import("./components/not-found-page.tsx"))
const OpenAlexRoutes = lazy(() => import("./boards/open-alex/routes.tsx"))
const PersonalDataLayout = lazy(() => import("./pages/personal-data/global-layout.tsx"))
const PersonalDataPage = lazy(() => import("./pages/personal-data/index.tsx"))
const PersonnelEnseignantRoutes = lazy(() => import("./boards/personnel-enseignant/routes.tsx"))
const SitemapLayout = lazy(() => import("./pages/site-map/global-layout.tsx"))
const SitemapPage = lazy(() => import("./pages/site-map/sitemap-page.tsx"))
const StructuresFinanceRoutes = lazy(() => import("./boards/structures-finance/routes.tsx"))
const TableauxDocRoutes = lazy(() => import("./boards/tableaux-doc/routes.tsx"))
const TedsRoutes = lazy(() => import("./boards/teds/routes.tsx"))
const TemplateRoutes = lazy(() => import("./boards/template/routes.tsx"))
const ValorisationRechercheInnovationRoutes = lazy(() => import("./boards/valorisation-recherche-innovation/routes.tsx"))

const RouteWithTitle = ({ titleKey, element }) => {
  useTitle(titleKey)
  return element
}

export default function Router() {
  const BOARDS = [
    { id: "devenir-etudiants", routes: DevenirEtudiantsRoutes, to: "/devenir-etudiants/entrants-en-L1-2019/flux" },
    { id: "european-projects", routes: EuropeanProjectsRoutes, to: "/european-projects/accueil" },
    { id: "financements-par-aap", routes: FundingsRoutes, to: "/financements-par-aap/accueil" },
    { id: "structures-finance", routes: StructuresFinanceRoutes, to: "/structures-finance/accueil" },
  ]

  const BOARDS_STAGING = [
    { id: "admin", routes: AdminRoutes },
    { id: "atlas", routes: AtlasRoutes, to: "/atlas/general" },
    { id: "graduates", routes: GraduatesRoutes },
    { id: "integration", page: Integration },
    { id: "open-alex", routes: OpenAlexRoutes },
    { id: "personnel-enseignant", routes: PersonnelEnseignantRoutes, to: "/personnel-enseignant/accueil" },
    { id: "tableaux-doc", routes: TableauxDocRoutes },
    { id: "teds", routes: TedsRoutes, to: "/teds/home" },
    { id: "template", routes: TemplateRoutes },
    { id: "valorisation-recherche-innovation", routes: ValorisationRechercheInnovationRoutes, to: "/valorisation-recherche-innovation/accueil" },
  ]

  return (
    <Routes>
      <Route
        path="/"
        element={
          <RouteWithTitle
            titleKey="Accueil - Tableaux"
            element={
              <Suspense>
                <HomePage />
              </Suspense>
            }
          />
        }
      />
      {/* Cold pages */}
      <Route
        path="/accessibility"
        element={
          <Suspense>
            <AccessibilityLayout />
          </Suspense>
        }
      >
        <Route
          index
          element={
            <Suspense>
              <AccessibilityPage />
            </Suspense>
          }
        />
      </Route>
      <Route
        path="/cgu"
        element={
          <Suspense>
            <CGULayout />
          </Suspense>
        }
      >
        <Route
          index
          element={
            <Suspense>
              <CGUPage />
            </Suspense>
          }
        />
      </Route>
      <Route
        path="/contact"
        element={
          <Suspense>
            <ContactLayout />
          </Suspense>
        }
      >
        <Route
          index
          element={
            <Suspense>
              <ContactPage />
            </Suspense>
          }
        />
      </Route>
      <Route
        path="/cookies"
        element={
          <Suspense>
            <CookiePolicyPage />
          </Suspense>
        }
      />
      <Route
        path="/donnees-personnelles"
        element={
          <Suspense>
            <PersonalDataLayout />
          </Suspense>
        }
      >
        <Route
          index
          element={
            <Suspense>
              <PersonalDataPage />
            </Suspense>
          }
        />
      </Route>
      <Route
        path="/mentions-legales"
        element={
          <Suspense>
            <LegalNoticeLayout />
          </Suspense>
        }
      >
        <Route
          index
          element={
            <Suspense>
              <LegalNoticePage />
            </Suspense>
          }
        />
      </Route>
      <Route
        path="/plan-du-site"
        element={
          <Suspense>
            <SitemapLayout />
          </Suspense>
        }
      >
        <Route
          index
          element={
            <Suspense>
              <SitemapPage />
            </Suspense>
          }
        />
      </Route>
      {/* Boards */}
      {BOARDS.map((board) => (
        <>
          <Route path={`/${board.id}`} element={<Navigate to={board.to} replace />} />
          <Route
            path={`/${board.id}/*`}
            element={
              <Suspense fallback={<div>Loading...</div>}>
                {React.createElement(board.routes)}
              </Suspense>
            }
          />
        </>
      ))}

      {!isInProduction() && (
        <>
          {/* Board available in staging only */}
          {BOARDS_STAGING.map((board) => {
            return (<>
              {board?.to && <Route path={`/${board.id}`} element={<Navigate to={board?.to ?? ""} replace />} />}
              {board?.routes && <Route
                path={`/${board.id}/*`}
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    {React.createElement(board?.routes ?? "")}
                  </Suspense>
                }
              />}
              {board?.page && <Route
                path={`/${board.id}`}
                element={
                  <Suspense fallback={<div>Loading...</div>}>
                    {React.createElement(board?.page ?? "")}
                  </Suspense>
                }
              />}
            </>)
          })}
        </>
      )}
      {/* Fallback */}
      <Route
        path="*"
        element={
          <Suspense>
            <NotFoundPage />
          </Suspense>
        }
      />
    </Routes>
  )
}
