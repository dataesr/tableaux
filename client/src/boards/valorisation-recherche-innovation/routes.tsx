import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import { useTitle } from "../../hooks/usePageTitle.tsx";
import { getI18nLabel } from "../../utils";
import i18n from "./i18n.json";

import "./styles.scss";

const GlobalLayout = lazy(() => import('./components/layouts/global-layout.tsx'));
const Home = lazy(() => import('./pages/home'));
const NotFoundPage = lazy(() => import('../../pages/not-found/index.tsx'));
const Structures = lazy(() => import('./pages/structures'));

const RouteWithTitle = ({ titleKey, element }) => {
  useTitle(getI18nLabel(i18n, titleKey));
  return element;
};


export default function ValorisationRechercheInnovationRoutes() {
  return (
    <Routes>
      <Route element={<Suspense><GlobalLayout /></Suspense>}>
        <Route index element={<Navigate to="accueil" replace />} />
        <Route path="" element={<Navigate to="accueil" replace />} />
        <Route path="accueil" element={<RouteWithTitle titleKey="accueil" element={<Suspense><Home /></Suspense>} />} />
        <Route path="etablissement" element={<RouteWithTitle titleKey="etablissement" element={<Suspense><Structures /></Suspense>} />} />
      </Route>
      <Route path="*" element={<Suspense><NotFoundPage /></Suspense>} />
    </Routes>
  );
}
