import { Route, Routes } from "react-router-dom";

import NotFoundPage from "../../components/not-found-page.tsx";
import { Layout } from "../../layout/layout.tsx";
import Dashboard from "./dashboard.tsx";
import Home from "./home.tsx";
import AccessibilityPage from "./accessibility.tsx";


export default function AdminRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/:dashboardId" element={<Dashboard />} />
        <Route path="/accessibility/:dashboardId" element={<AccessibilityPage />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
