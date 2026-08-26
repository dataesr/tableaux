import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import GlobalLayout from "./components/layouts/global-layout.tsx";

const NotFoundPage = lazy(() => import("../../components/not-found-page.tsx"));
const AccueilView = lazy(() => import("./pages/accueil/index.tsx"));
const DefinitionsView = lazy(() => import("./pages/definitions/index.tsx"));
const FAQView = lazy(() => import("./pages/faq/index.tsx"));
const NationalView = lazy(() => import("./pages/national/index.tsx"));
const StructuresView = lazy(() => import("./pages/structures/index.tsx"));

import "./styles.scss";
import { useTitle } from "../../hooks/usePageTitle.tsx";

const RouteWithTitle = ({ titleKey, element }) => {
  useTitle(titleKey);
  return element;
};

export default function StructuresFinanceRoutes() {
  return (
    <Routes>
      <Route element={<GlobalLayout />}>
        <Route index element={<Navigate to="accueil" replace />} />
        <Route
          path="accueil"
          element={
            <RouteWithTitle
              titleKey="Accueil - Financement des établissements d'enseignement supérieur français"
              element={<Suspense><AccueilView /></Suspense>}
            />
          }
        />
        <Route
          path="definitions"
          element={
            <RouteWithTitle
              titleKey="Definitions - Financement des établissements d'enseignement supérieur français"
              element={<Suspense><DefinitionsView /></Suspense>}
            />
          }
        />
        <Route
          path="etablissements"
          element={
            <RouteWithTitle
              titleKey="Vue par établissement - Financement des établissements d'enseignement supérieur français
"
              element={<Suspense><StructuresView /></Suspense>}
            />
          }
        />
        <Route
          path="faq"
          element={
            <RouteWithTitle
              titleKey="FAQ - Financement des établissements d'enseignement supérieur français"
              element={<Suspense><FAQView /></Suspense>}
            />
          }
        />
        <Route
          path="national"
          element={
            <RouteWithTitle
              titleKey="Vue nationale - Financement des établissements d'enseignement supérieur français"
              element={<Suspense><NationalView /></Suspense>}
            />
          }
        />
        <Route path="plan-du-site" element={<Navigate to="/plan-du-site?from=structures-finance" replace />} />
      </Route>
      <Route path="*" element={<Suspense><NotFoundPage /></Suspense>} />
    </Routes>
  );
}
