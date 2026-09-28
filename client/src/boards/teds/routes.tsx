import { Navigate, Route, Routes } from "react-router-dom";

import NotFoundPage from "../../pages/not-found/index.tsx";
import { useTitle } from "../../hooks/usePageTitle.tsx";
import { getI18nLabel } from "../../utils";
import GlobalLayout from "./components/layouts/global-layout.tsx";
import Home from "./index.tsx";
import Countries from "./pages/countries/index.tsx";
import Entities from "./pages/entities/index.tsx";
import i18n from "./title-i18n.json";


const RouteWithTitle = ({ titleKey, element }) => {
  useTitle(getI18nLabel(i18n, titleKey))
  return element;
};

export default function TedsRoutes() {
  return (
    <Routes>
      <Route element={<GlobalLayout languageSelector />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="" element={<Navigate to="home" replace />} />
        <Route path="home" element={<RouteWithTitle titleKey="home" element={<Home />} />} />
        <Route path="countries" element={<RouteWithTitle titleKey="countries" element={<Countries />} />} />
        <Route path="entities" element={<RouteWithTitle titleKey="entities" element={<Entities />} />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
