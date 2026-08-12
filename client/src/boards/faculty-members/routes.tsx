import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";

import { useTitle } from "../../hooks/usePageTitle.tsx";
import { getI18nLabel } from "../../utils.tsx";
import i18n from "./title-i18n.json";

import "./styles.scss";
import GlobalLayout from "./components/layouts/global-layout.tsx";

const NotFoundPage = lazy(() => import("../../components/not-found-page.tsx"));
const Home = lazy(() => import("./pages/home/index.tsx"));
const DataView = lazy(() => import("./pages/structures/index.tsx"));
const DefinitionsPage = lazy(() => import("./pages/definitions/index.tsx"));

const RouteWithTitle = ({ titleKey, element }) => {
  useTitle(getI18nLabel(i18n, titleKey));
  return element;
};


export default function FacultyMembersRoutes() {
  return (
    <Routes>
      <Route element={<GlobalLayout />}>
        <Route
          path="accueil"
          element={
            <RouteWithTitle
              titleKey="Accueil - Le personnel enseignant de l'enseignement supérieur français"
              element={<Suspense><Home /></Suspense>}
            />
          }
        />
        <Route
          path="etablissements"
          element={
            <RouteWithTitle
              titleKey="Établissements - Personnel enseignant"
              element={<Suspense><DataView viewType="structure" /></Suspense>}
            />
          }
        />
        <Route
          path="disciplines"
          element={
            <RouteWithTitle
              titleKey="Disciplines - Personnel enseignant"
              element={<Suspense><DataView viewType="discipline" /></Suspense>}
            />
          }
        />
        <Route
          path="regions"
          element={
            <RouteWithTitle
              titleKey="Régions - Personnel enseignant"
              element={<Suspense><DataView viewType="region" /></Suspense>}
            />
          }
        />
        <Route
          path="academies"
          element={
            <RouteWithTitle
              titleKey="Académies - Personnel enseignant"
              element={<Suspense><DataView viewType="academie" /></Suspense>}
            />
          }
        />
        {/* <Route
          path="FAQ"
          element={
            <RouteWithTitle
              titleKey="FAQ - Personnel enseignant"
              element={<Suspense><FAQView /></Suspense>}
            />
          }
        /> */}
        <Route
          path="definitions"
          element={
            <RouteWithTitle
              titleKey="Définitions - Personnel enseignant"
              element={<Suspense><DefinitionsPage /></Suspense>}
            />
          }
        />
      </Route>
      <Route path="*" element={<Suspense><NotFoundPage /></Suspense>} />
    </Routes>
  );
}
