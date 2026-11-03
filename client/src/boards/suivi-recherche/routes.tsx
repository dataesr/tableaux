import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { useTitle } from "../../hooks/usePageTitle.tsx";
import NotFoundPage from "../../pages/not-found/index.tsx";
import { getI18nLabel } from "../../utils";
import GlobalLayout from "./components/layouts/global-layout.tsx";
import AccueilPage from "./pages/accueil/index.tsx";
import BibliometrieLayout from "./pages/bibliometrie/index.tsx";
import EtablissementsPage from "./pages/bibliometrie/etablissements/index.tsx";
import InternationalPage from "./pages/bibliometrie/international/index.tsx";
import ProfilPage from "./pages/bibliometrie/profil/index.tsx";
import FinancementsPage from "./pages/financements/index.tsx";
import i18n from "./title-i18n.json";

import "./styles.scss";

const RouteWithTitle = ({ titleKey, element }) => {
  useTitle(getI18nLabel(i18n, titleKey));
  return element;
};

// Redirection qui conserve la sélection (paramètres d'URL), pour les anciens liens vers /bibliometrie
const RedirectWithSearch = ({ to }: { to: string }) => {
  const { search } = useLocation();
  return <Navigate to={{ pathname: to, search }} replace />;
};

export default function SuiviRechercheRoutes() {
  return (
    <Routes>
      <Route element={<GlobalLayout />}>
        <Route index element={<Navigate to="accueil" replace />} />
        <Route path="accueil" element={<RouteWithTitle titleKey="accueil" element={<AccueilPage />} />} />
        <Route path="bibliometrie" element={<BibliometrieLayout />}>
          <Route index element={<RedirectWithSearch to="profil" />} />
          <Route path="profil" element={<RouteWithTitle titleKey="bibliometrie-profil" element={<ProfilPage />} />} />
          <Route path="etablissements" element={<RouteWithTitle titleKey="bibliometrie-etablissements" element={<EtablissementsPage />} />} />
          <Route path="international" element={<RouteWithTitle titleKey="bibliometrie-international" element={<InternationalPage />} />} />
        </Route>
        <Route path="financements" element={<RouteWithTitle titleKey="financements" element={<FinancementsPage />} />} />
        <Route path="plan-du-site" element={<Navigate to="/plan-du-site?from=suivi-recherche" replace />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
