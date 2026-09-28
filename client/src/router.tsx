import { useQuery } from "@tanstack/react-query"
import React, { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"

import { useTitle } from "./hooks/usePageTitle.tsx"
import { isInProduction } from "./utils.tsx"
import LoadingPage from "./pages/loading"

const AccessibilityLayout = lazy(() => import("./components/accessibility/layouts/global-layout.tsx"))
const AccessibilityPage = lazy(() => import("./pages/accessibility/index.tsx"))
const AdminRoutes = lazy(() => import("./boards/admin/routes.tsx"))
const CGULayout = lazy(() => import("./pages/cgu/global-layout.tsx"))
const CGUPage = lazy(() => import("./pages/cgu/index.tsx"))
const ContactLayout = lazy(() => import("./pages/contact/global-layout.tsx"))
const ContactPage = lazy(() => import("./pages/contact/index.tsx"))
const CookiePolicyPage = lazy(() => import("./pages/cookies/index.tsx"))
const HomePage = lazy(() => import("./boards/home-page.tsx"))
const Integration = lazy(() => import("./boards/integration/index.tsx"))
const LegalNoticeLayout = lazy(() => import("./pages/legal-notice/global-layout.tsx"))
const LegalNoticePage = lazy(() => import("./pages/legal-notice/index.tsx"))
const NotFoundPage = lazy(() => import("./pages/not-found/index.tsx"))
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
      const allResponses = await Promise.all(allDashboards.map((dashboard) => lazy(() => import(`./boards/${dashboard.id}/routes.tsx`).catch(() => { }))))
      return allDashboards.map((dashboard, index) => {
        const routes = allResponses[index] ?? ""
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
              <Suspense fallback={<LoadingPage />}>
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
          <Suspense fallback={<LoadingPage />}>
            <AccessibilityLayout />
          </Suspense>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<LoadingPage />}>
              <AccessibilityPage />
            </Suspense>
          }
        />
      </Route>
      <Route
        path="/cgu"
        element={
          <Suspense fallback={<LoadingPage />}>
            <CGULayout />
          </Suspense>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<LoadingPage />}>
              <CGUPage />
            </Suspense>
          }
        />
      </Route>
      <Route
        path="/contact"
        element={
          <Suspense fallback={<LoadingPage />}>
            <ContactLayout />
          </Suspense>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<LoadingPage />}>
              <ContactPage />
            </Suspense>
          }
        />
      </Route>
      <Route
        path="/cookies"
        element={
          <Suspense fallback={<LoadingPage />}>
            <CookiePolicyPage />
          </Suspense>
        }
      />
      <Route
        path="/donnees-personnelles"
        element={
          <Suspense fallback={<LoadingPage />}>
            <PersonalDataLayout />
          </Suspense>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<LoadingPage />}>
              <PersonalDataPage />
            </Suspense>
          }
        />
      </Route>
      <Route
        path="/mentions-legales"
        element={
          <Suspense fallback={<LoadingPage />}>
            <LegalNoticeLayout />
          </Suspense>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<LoadingPage />}>
              <LegalNoticePage />
            </Suspense>
          }
        />
      </Route>
      <Route
        path="/plan-du-site"
        element={
          <Suspense fallback={<LoadingPage />}>
            <SitemapLayout />
          </Suspense>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<LoadingPage />}>
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
              <Suspense fallback={<LoadingPage />}>
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
              <Suspense fallback={<LoadingPage />}>
                <AdminRoutes />
              </Suspense>
            }
          />
          <Route
            path="/integration"
            element={
              <Suspense fallback={<LoadingPage />}>
                <Integration />
              </Suspense>
            }
          />
          <Route
            path="/template/*"
            element={
              <Suspense fallback={<LoadingPage />}>
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
          <Suspense fallback={<LoadingPage />}>
            <NotFoundPage />
          </Suspense>
        }
      />
    </Routes>
  )
}
