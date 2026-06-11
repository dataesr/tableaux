import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import { Layout } from "./components/layout/layout.tsx";
import { AtlasProvider } from "./context.tsx";
import AtlasHeader from "./index.tsx";

const FieldsRouter = lazy(() => import("./pages/fields/index.tsx"));
const Genders = lazy(() => import("./pages/genders.tsx"));
const General = lazy(() => import("./pages/general.tsx"));
const OtherGeographicalLevels = lazy(() => import("./components/other-geographical-levels.tsx"));
const Sectors = lazy(() => import("./pages/sectors.tsx"));

const Accessibility = lazy(() => import("./pages/static-pages/accessibility.tsx"));
const Contact = lazy(() => import("./pages/static-pages/contact.tsx"));
const CookieManagement = lazy(() => import("./pages/static-pages/cookie-management.tsx"));
const LegalMentions = lazy(() => import("./pages/static-pages/legal-mentions.tsx"));
const Methodology = lazy(() => import("./pages/static-pages/methodology.tsx"));
const NotFoundPage = lazy(() => import("../../components/not-found-page.tsx"));
const SiteMap = lazy(() => import("./pages/static-pages/site-map.tsx"));

export default function AtlasRoutes() {
  return (
    <AtlasProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<AtlasHeader />}>
            <Route
              path="general"
              element={
                <Suspense>
                  <General />
                </Suspense>
              }
            />
            <Route
              path="effectifs-par-filiere/:idFiliere?"
              element={
                <Suspense>
                  <FieldsRouter />
                </Suspense>
              }
            />
            <Route
              path="effectifs-par-secteur"
              element={
                <Suspense>
                  <Sectors />
                </Suspense>
              }
            />
            <Route
              path="effectifs-par-genre"
              element={
                <Suspense>
                  <Genders />
                </Suspense>
              }
            />
            <Route
              path="autres-niveaux-geographiques"
              element={
                <Suspense>
                  <OtherGeographicalLevels />
                </Suspense>
              }
            />
          </Route>
          <Route
            path="plan-du-site"
            element={
              <Suspense>
                <SiteMap />
              </Suspense>
            }
          />
          <Route
            path="methodologie"
            element={
              <Suspense>
                <Methodology />
              </Suspense>
            }
          />
          <Route
            path="accessibilite"
            element={
              <Suspense>
                <Accessibility />
              </Suspense>
            }
          />
          <Route
            path="mentions-legales"
            element={
              <Suspense>
                <LegalMentions />
              </Suspense>
            }
          />
          <Route
            path="gestion-des-cookies"
            element={
              <Suspense>
                <CookieManagement />
              </Suspense>
            }
          />
          <Route
            path="contact"
            element={
              <Suspense>
                <Contact />
              </Suspense>
            }
          />
        </Route>
        <Route
          path="*"
          element={
            <Suspense>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Routes>
    </AtlasProvider>
  );
}
