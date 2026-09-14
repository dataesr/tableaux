import { Navigate, Route, Routes } from "react-router-dom";

import NotFoundPage from "../../components/not-found-page.tsx";
import { useTitle } from "../../hooks/usePageTitle.tsx";
import { getI18nLabel } from "../../utils.tsx";
import GlobalLayout from "./components/layouts/global-layout.tsx";
import SidemenuLayout from "./components/layouts/sidemenu-layout.tsx";
import Home from "./pages/home/index.tsx";
import Overview from "./pages/overview/index.tsx";
import i18n from "./title-i18n.json";

import "./styles.scss";

const RouteWithTitle = ({ titleKey, element }) => {
  useTitle(getI18nLabel(i18n, titleKey));
  return element;
};


export default function DatasuprDocRoutes() {
  return (
    <Routes>
      <Route element={<GlobalLayout languageSelector />}>
        <Route index element={<Navigate to="home" replace />} />
        <Route path="home" element={<RouteWithTitle titleKey="home" element={<Home />} />} />
        <Route element={<SidemenuLayout />}>
          <Route path="overview" element={<RouteWithTitle titleKey="overview" element={<Overview />} />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
