import { Navigate, Route, Routes } from "react-router-dom";

import NotFoundPage from "../../components/not-found-page.tsx";
import { useTitle } from "../../hooks/usePageTitle.tsx";
import { getI18nLabel } from "../../utils";
import GlobalLayout from "./components/layouts/global-layout.tsx";
import PlusHautDiplomePage from "./pages/plus-haut-diplome/index.tsx";
import i18n from "./title-i18n.json";
import MethodologiePage from "./pages/methodologie/index.tsx";

import "./styles.scss";
import FluxPage from "./pages/flux/index.tsx";
import RepartitionPage from "./pages/repartition/index.tsx";
import ComparaisonProfilsPage from "./pages/comparaison-profils/index.tsx";

const RouteWithTitle = ({ titleKey, element }) => {
  useTitle(getI18nLabel(i18n, titleKey));
  return element;
};

export default function OutcomesRoutes() {
  return (
    <Routes>
      <Route index element={<Navigate to="entrants-en-L1-2019/flux" replace />} />
      <Route path="entrants-en-L1-2019" element={<GlobalLayout />}>
        <Route index element={<Navigate to="flux" replace />} />
        <Route path="flux" element={<RouteWithTitle titleKey="flux" element={<FluxPage />} />} />
        <Route path="repartition" element={<RouteWithTitle titleKey="repartition" element={<RepartitionPage />} />} />
        <Route path="plus-haut-diplome" element={<RouteWithTitle titleKey="plusHautDiplome" element={<PlusHautDiplomePage />} />} />
        <Route path="comparaison-profils" element={<RouteWithTitle titleKey="comparaisonProfils" element={<ComparaisonProfilsPage />} />} />
        <Route path="methodologie" element={<RouteWithTitle titleKey="methodologie" element={<MethodologiePage />} />} />
        <Route path="plan-du-site" element={<Navigate to="/plan-du-site?from=devenir-etudiants" replace />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
