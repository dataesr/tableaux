import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";

const Beneficiaries = lazy(() => import("./pages/beneficiaries/index.tsx"));
const Collaborations = lazy(() => import("./pages/collaborations/index.tsx"));
const CollaborationsEntity = lazy(() => import("./pages/collaborations/index-entity.tsx"));
const Entities = lazy(() => import("./pages/entities/index.tsx"));
const ERC = lazy(() => import("./pages/erc/index.tsx"));
const MSCA = lazy(() => import("./pages/msca/index.tsx"));
const EvolutionPcri = lazy(() => import("./pages/evolution-pcri/index.tsx"));
const GlobalLayout = lazy(() => import("./components/layouts/global-layout.tsx"));
const Home = lazy(() => import("./pages/home/index.tsx"));
const HorizonEurope = lazy(() => import("./pages/horizon-europe/index.tsx"));
const Methodology = lazy(() => import("./pages/metodology/index.tsx"));
const NotFoundPage = lazy(() => import("../../components/not-found-page.tsx"));
const Overview = lazy(() => import("./pages/overview/index.tsx"));
const Positioning = lazy(() => import("./pages/positioning/index.tsx"));
const ProjectsTypes = lazy(() => import("./pages/projects-types/index.tsx"));
const Search = lazy(() => import("./pages/search/index.tsx"));
const SidemenuLayout = lazy(() => import("./components/layouts/sidemenu-layout.tsx"));
const TypeOfBeneficiaries = lazy(() => import("./pages/type-of-beneficiaries/index.tsx"));

import { useTitle } from "../../hooks/usePageTitle.tsx";
import { getI18nLabel } from "../../utils";

import i18n from "./title-i18n.json";

import "./styles.scss";

const RouteWithTitle = ({ titleKey, element }) => {
  useTitle(getI18nLabel(i18n, titleKey));
  return element;
};

const EntityWrapper = () => {
  const { entityId } = useParams();
  return <CollaborationsEntity entityId={entityId} />;
};

export default function EuropeanProjectsRoutes() {
  return (
    <Routes>
      <Route
        element={
          <Suspense>
            <GlobalLayout />
          </Suspense>
        }
      >
        <Route index element={<Navigate to="accueil" replace />} />
        <Route path="" element={<Navigate to="accueil" replace />} />
        <Route
          path="accueil"
          element={
            <RouteWithTitle
              titleKey="accueil"
              element={
                <Suspense>
                  <Home />
                </Suspense>
              }
            />
          }
        />
        <Route
          path="search"
          element={
            <RouteWithTitle
              titleKey="search"
              element={
                <Suspense>
                  <Search />
                </Suspense>
              }
            />
          }
        />
        <Route
          path="horizon-europe"
          element={
            <RouteWithTitle
              titleKey="horizon-europe"
              element={
                <Suspense>
                  <HorizonEurope />
                </Suspense>
              }
            />
          }
        />
        <Route element={<SidemenuLayout />}>
          <Route
            path="synthese"
            element={
              <RouteWithTitle
                titleKey="synthese"
                element={
                  <Suspense>
                    <Overview />
                  </Suspense>
                }
              />
            }
          />
          <Route
            path="positionnement"
            element={
              <RouteWithTitle
                titleKey="positionnement"
                element={
                  <Suspense>
                    <Positioning />
                  </Suspense>
                }
              />
            }
          />
          <Route
            path="collaborations"
            element={
              <RouteWithTitle
                titleKey="collaborations"
                element={
                  <Suspense>
                    <Collaborations />
                  </Suspense>
                }
              />
            }
          />
          <Route
            path="collaborations/:entityId"
            element={
              <RouteWithTitle
                titleKey="collaborations"
                element={
                  <Suspense>
                    <EntityWrapper />
                  </Suspense>
                }
              />
            }
          />
          <Route
            path="beneficiaires"
            element={
              <RouteWithTitle
                titleKey="beneficiaires"
                element={
                  <Suspense>
                    <Beneficiaries />
                  </Suspense>
                }
              />
            }
          />
          <Route
            path="beneficiaires-types"
            element={
              <RouteWithTitle
                titleKey="beneficiaires-types"
                element={
                  <Suspense>
                    <TypeOfBeneficiaries />
                  </Suspense>
                }
              />
            }
          />
        </Route>
        <Route
          path="msca"
          element={
            <RouteWithTitle
              titleKey="msca"
              element={
                <Suspense>
                  <MSCA />
                </Suspense>
              }
            />
          }
        />
        <Route
          path="erc"
          element={
            <RouteWithTitle
              titleKey="erc"
              element={
                <Suspense>
                  <ERC />
                </Suspense>
              }
            />
          }
        />
        <Route
          path="entities"
          element={
            <RouteWithTitle
              titleKey="entities"
              element={
                <Suspense>
                  <Entities />
                </Suspense>
              }
            />
          }
        />
        <Route
          path="objectifs-types-projets"
          element={
            <RouteWithTitle
              titleKey="objectifs-types-projets"
              element={
                <Suspense>
                  <ProjectsTypes />
                </Suspense>
              }
            />
          }
        />
        <Route path="programme-mires" element={<RouteWithTitle titleKey="programme-mires" element={<div>Programme MIRES</div>} />} />
        <Route path="appel-a-projets" element={<RouteWithTitle titleKey="appel-a-projets" element={<div>Appel à projets</div>} />} />
        <Route path="donnees-reference" element={<RouteWithTitle titleKey="donnees-reference" element={<div>Données de référence</div>} />} />
        <Route
          path="methodology"
          element={
            <RouteWithTitle
              titleKey="methodology"
              element={
                <Suspense>
                  <Methodology />
                </Suspense>
              }
            />
          }
        />
        <Route
          path="evolution-pcri"
          element={
            <RouteWithTitle
              titleKey="evolution-pcri"
              element={
                <Suspense>
                  <EvolutionPcri />
                </Suspense>
              }
            />
          }
        />
      </Route>
      <Route
        path="*"
        element={
          <Suspense>
            <NotFoundPage />
          </Suspense>
        }
      />
    </Routes>
  );
}
