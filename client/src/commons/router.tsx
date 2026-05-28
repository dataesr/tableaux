import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useTitle } from "../hooks/usePageTitle.tsx";
import { isInProduction } from "../utils.tsx";

const AccessibilityLayout = lazy(() => import("../components/accessibility/layouts/global-layout.tsx"));
const AccessibilityPage = lazy(() => import("../components/accessibility/page.tsx"));
const AdminRoutes = lazy(() => import("../boards/admin/routes.tsx"));
const AtlasRoutes = lazy(() => import("../boards/atlas/routes.tsx"));
const ContactLayout = lazy(() => import("../pages/contact/layouts/global-layout.tsx"));
const ContactPage = lazy(() => import("../pages/contact/index.tsx"));
const CookiePolicyPage = lazy(() => import("../components/cookies/cookie-policy-page/index.tsx"));
const DatasuprDocRoutes = lazy(() => import("../boards/datasupr-doc/routes.tsx"));
const EuropeanProjectsRoutes = lazy(() => import("../boards/european-projects/routes.tsx"));
const FacultyMembersRoutes = lazy(() => import("../boards/faculty-members/routes.tsx"));
const FundingsRoutes = lazy(() => import("../boards/financements-par-aap/routes.tsx"));
const GraduatesRoutes = lazy(() => import("../boards/graduates/routes.tsx"));
const HomePage = lazy(() => import("../boards/home-page.tsx"));
const Integration = lazy(() => import("../boards/integration/index.tsx"));
const NotFoundPage = lazy(() => import("../components/not-found-page.tsx"));
const OpenAlexRoutes = lazy(() => import("../boards/open-alex/routes.tsx"));
const OutcomesRoutes = lazy(() => import("../boards/outcomes/routes.tsx"));
const StructuresFinanceRoutes = lazy(() => import("../boards/structures-finance/routes.tsx"));
const TedsRoutes = lazy(() => import("../boards/teds/routes.tsx"));
const TemplateRoutes = lazy(() => import("../boards/template/routes.tsx"));
const ValorisationRechercheInnovationRoutes = lazy(() => import("../boards/valorisation-recherche-innovation/routes.tsx"));

const RouteWithTitle = ({ titleKey, element }) => {
  useTitle(titleKey);
  return element;
};

export default function Router() {
  if (isInProduction()) {
    return (
      <Routes>
        <Route
          path="/"
          element={
            <RouteWithTitle
              titleKey="Accueil - dataEsr"
              element={
                <Suspense>
                  <HomePage />
                </Suspense>
              }
            />
          }
        />
        <Route
          path="/accessibility"
          element={
            <Suspense>
              <AccessibilityPage />
            </Suspense>
          }
        />
        <Route
          path="/cookies"
          element={
            <Suspense>
              <CookiePolicyPage />
            </Suspense>
          }
        />
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
        <Route path="/devenir-etudiants" element={<Navigate to="/devenir-etudiants/flux" replace />} />
        <Route
          path="/devenir-etudiants/*"
          element={
            <Suspense>
              <OutcomesRoutes />
            </Suspense>
          }
        />
        <Route path="/financements-par-aap" element={<Navigate to="/financements-par-aap/accueil" replace />} />
        <Route
          path="/financements-par-aap/*"
          element={
            <Suspense>
              <FundingsRoutes />
            </Suspense>
          }
        />
        <Route path="/structures-finance/accueil" element={<Navigate to="/structures-finance/accueil" replace />} />
        <Route
          path="/structures-finance/*"
          element={
            <Suspense>
              <StructuresFinanceRoutes />
            </Suspense>
          }
        />
        <Route
          path="*"
          element={
            <Suspense>
              <NotFoundPage />
            </Suspense>
          }
        />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route
        path="/"
        element={
          <RouteWithTitle
            titleKey="Accueil - dataEsr"
            element={
              <Suspense>
                <HomePage />
              </Suspense>
            }
          />
        }
      />
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
        path="/admin/*"
        element={
          <Suspense>
            <AdminRoutes />
          </Suspense>
        }
      />
      <Route
        path="/atlas/*"
        element={
          <Suspense>
            <AtlasRoutes />
          </Suspense>
        }
      />
      <Route
        path="/cookies"
        element={
          <Suspense>
            <CookiePolicyPage />
          </Suspense>
        }
      />
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
        path="/datasupr-doc/*"
        element={
          <Suspense>
            <DatasuprDocRoutes />
          </Suspense>
        }
      />
      <Route path="/european-projects" element={<Navigate to="/european-projects/accueil" replace />} />
      <Route
        path="/european-projects/*"
        element={
          <Suspense>
            <EuropeanProjectsRoutes />
          </Suspense>
        }
      />
      <Route path="/financements-par-aap" element={<Navigate to="/financements-par-aap/accueil" replace />} />
      <Route
        path="/financements-par-aap/*"
        element={
          <Suspense>
            <FundingsRoutes />
          </Suspense>
        }
      />
      <Route
        path="/graduates/*"
        element={
          <Suspense>
            <GraduatesRoutes />
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
        path="/open-alex/*"
        element={
          <Suspense>
            <OpenAlexRoutes />
          </Suspense>
        }
      />
      <Route path="/devenir-etudiants" element={<Navigate to="/devenir-etudiants/flux" replace />} />
      <Route
        path="/devenir-etudiants/*"
        element={
          <Suspense>
            <OutcomesRoutes />
          </Suspense>
        }
      />
      <Route path="/personnel-enseignant" element={<Navigate to="/personnel-enseignant/accueil" replace />} />
      <Route
        path="/personnel-enseignant/*"
        element={
          <Suspense>
            <FacultyMembersRoutes />
          </Suspense>
        }
      />
      <Route
        path="/structures-finance/*"
        element={
          <Suspense>
            <StructuresFinanceRoutes />
          </Suspense>
        }
      />
      <Route path="/teds" element={<Navigate to="/teds/home" replace />} />
      <Route
        path="/teds/*"
        element={
          <Suspense>
            <TedsRoutes />
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
      <Route path="/valorisation-recherche-innovation" element={<Navigate to="/valorisation-recherche-innovation/accueil" replace />} />
      <Route
        path="/valorisation-recherche-innovation/*"
        element={
          <Suspense>
            <ValorisationRechercheInnovationRoutes />
          </Suspense>
        }
      />
      <Route
        path="*"
        element={
          <Suspense>
            <NotFoundPage />
          </Suspense>
        }
      />
    </Routes>
  );
}
