import { Navigate, Route, Routes } from "react-router-dom";

import { useTitle } from "../../hooks/usePageTitle.tsx";
import NotFoundPage from "../../pages/not-found/index.tsx";
import { getI18nLabel } from "../../utils";
import GlobalLayout from "./components/layouts/global-layout.tsx";
import AccueilPage from "./pages/accueil/index.tsx";
import BibliometriePage from "./pages/bibliometrie/index.tsx";
import FinancementsPage from "./pages/financements/index.tsx";
import i18n from "./title-i18n.json";

import "./styles.scss";

const RouteWithTitle = ({ titleKey, element }) => {
  useTitle(getI18nLabel(i18n, titleKey));
  return element;
};

export default function SuiviRechercheRoutes() {
  return (
    <Routes>
      <Route element={<GlobalLayout />}>
        <Route index element={<Navigate to="accueil" replace />} />
        <Route path="accueil" element={<RouteWithTitle titleKey="accueil" element={<AccueilPage />} />} />
        {/* Onglets dans le paramètre `section` (titre de l'onglet fixé par la page) */}
        <Route path="bibliometrie" element={<BibliometriePage />} />
        <Route path="financements" element={<RouteWithTitle titleKey="financements" element={<FinancementsPage />} />} />
        <Route path="plan-du-site" element={<Navigate to="/plan-du-site?from=suivi-recherche" replace />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
