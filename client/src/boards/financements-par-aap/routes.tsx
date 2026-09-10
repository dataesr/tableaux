import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"

import { useTitle } from "../../hooks/usePageTitle.tsx"
import { getI18nLabel } from "../../utils"
import i18n from "./i18n.json"

import "./styles.scss"

const Comparison = lazy(() => import('./pages/comparison/index.tsx'))
const Region = lazy(() => import('./pages/region/index.tsx'))
const GlobalLayout = lazy(() => import('./components/layouts/global-layout.tsx'))
const Home = lazy(() => import('./pages/home/index.tsx'))
const NotFoundPage = lazy(() => import('../../components/not-found-page.tsx'))
const Structures = lazy(() => import('./pages/structures/index.tsx'))

const RouteWithTitle = ({ titleKey, element }) => {
  useTitle(getI18nLabel(i18n, titleKey))
  return element
}


export default function FundingsRoutes() {
  return (
    <Routes>
      <Route element={<Suspense><GlobalLayout /></Suspense>}>
        <Route index element={<Navigate to="accueil" replace />} />
        <Route path="" element={<Navigate to="accueil" replace />} />
        <Route path="accueil" element={<RouteWithTitle titleKey="accueil" element={<Suspense><Home /></Suspense>} />} />
        <Route path="comparaison" element={<RouteWithTitle titleKey="comparaison" element={<Suspense><Comparison /></Suspense>} />} />
        <Route path="region" element={<RouteWithTitle titleKey="region" element={<Suspense><Region /></Suspense>} />} />
        <Route path="etablissement" element={<RouteWithTitle titleKey="etablissement" element={<Suspense><Structures /></Suspense>} />} />
      </Route>
      <Route path="*" element={<Suspense><NotFoundPage /></Suspense>} />
    </Routes>
  )
}
