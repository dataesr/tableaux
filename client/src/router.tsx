import { useQuery } from "@tanstack/react-query"
import React, { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"

import { useTitle } from "./hooks/usePageTitle.tsx"
import { isInProduction } from "./utils.tsx"
import LoadingPage from "./pages/loading"

const AccessibilityLayout = lazy(() => import("./components/accessibility/layouts/global-layout.tsx"))
const AccessibilityPage = lazy(() => import("./components/accessibility/page.tsx"))
const AdminRoutes = lazy(() => import("./boards/admin/routes.tsx"))
const CGULayout = lazy(() => import("./pages/cgu/global-layout.tsx"))
const CGUPage = lazy(() => import("./pages/cgu/index.tsx"))
const ContactLayout = lazy(() => import("./pages/contact/global-layout.tsx"))
const ContactPage = lazy(() => import("./pages/contact/index.tsx"))
const CookiePolicyPage = lazy(() => import("./components/cookies/cookie-policy-page/index.tsx"))
const HomePage = lazy(() => import("./boards/home-page.tsx"))
const Integration = lazy(() => import("./boards/integration/index.tsx"))
const LegalNoticeLayout = lazy(() => import("./pages/legal-notice/global-layout.tsx"))
const LegalNoticePage = lazy(() => import("./pages/legal-notice/index.tsx"))
const NotFoundPage = lazy(() => import("./components/not-found-page.tsx"))
const PersonalDataLayout = lazy(() => import("./pages/personal-data/global-layout.tsx"))
const PersonalDataPage = lazy(() => import("./pages/personal-data/index.tsx"))
const SitemapLayout = lazy(() => import("./pages/site-map/global-layout.tsx"))
const SitemapPage = lazy(() => import("./pages/site-map/sitemap-page.tsx"))
const TemplateRoutes = lazy(() => import("./boards/template/routes.tsx"))

const { VITE_APP_SERVER_URL } = import.meta.env

const RouteWithTitle = ({ titleKey, element }) => {
  useTitle(titleKey)
  return element
}

export default function Router() {
  const { data: dashboards, isLoading } = useQuery({
    queryKey: ["list-dashboards"],
    queryFn: async () => {
      const response = await fetch(`${VITE_APP_SERVER_URL}/admin/list-dashboards`)
      const allDashboards = await response.json()
      // Asynchronously load each media to display on the dashboard tile on the home page
      const allResponses = await Promise.all(allDashboards.map((dashboard) => import(`./boards/${dashboard.id}/routes.tsx`).catch(() => { })))
      return allDashboards.map((dashboard, index) => {
        const routes = allResponses[index]?.default ?? ""
        return { ...dashboard, routes }
      })
    },
  })

  if (isLoading || !dashboards) {
    return (
      <Routes>
        <Route
          path="*"
          element={<LoadingPage />}
        />
      </Routes>
    )
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <RouteWithTitle
            titleKey="Accueil - Tableaux"
            element={
              <Suspense fallback={<div>Loading...</div>}>
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
      {dashboards.map((board) => {
        return (<>
          {/* No idea why but "board?.url !== `/${board.id}`" is needed */}
          {(board?.url && board?.url !== `/${board.id}`) && <Route path={`/${board.id}`} element={<Navigate to={board?.url ?? ""} replace />} />}
          {board?.routes && <Route
            path={`/${board.id}/*`}
            element={
              <Suspense fallback={<div>Loading...</div>}>
                {React.createElement(board?.routes ?? "")}
              </Suspense>
            }
          />}
        </>)
      })}
      {!isInProduction() && (
        <>
          <Route
            path="/admin/*"
            element={
              <Suspense>
                <AdminRoutes />
              </Suspense>
            }
          />
          <Route
            path="/integration"
            element={
              <Suspense>
                <Integration />
              </Suspense>
            }
          />
          <Route
            path="/template/*"
            element={
              <Suspense>
                <TemplateRoutes />
              </Suspense>
            }
          />
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
