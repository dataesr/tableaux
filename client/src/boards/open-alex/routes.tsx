import { Route, Routes } from "react-router-dom";

import NotFoundPage from "../../pages/not-found/index.tsx";
import { Layout } from "../../layout/layout.tsx";
import Home from "./index.tsx";


export default function OpenAlexRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
      </Route>
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}