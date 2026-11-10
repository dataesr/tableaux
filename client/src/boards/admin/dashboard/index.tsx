import { useEffect, useState } from "react";
import { Breadcrumb, Col, Container, Link, Row } from "@dataesr/dsfr-plus";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";

import Collections from "./components/collections";
import ConstantsTable from "./components/constants-table";
import {
  deleteVersion,
  invalidateDashboardQueries,
  setCurrentVersion,
  showIndexesAside,
  updateConstant,
  updateVersionFromDependentCollection,
} from "./utils";
import type { DashboardConstant, DashboardIndexes } from "./utils";

const { VITE_APP_SERVER_URL, VITE_APP_TICKETOFFICE_URL } = import.meta.env;

export default function Dashboard() {
  const { dashboardId } = useParams();
  const [constants, setConstants] = useState<DashboardConstant[]>([]);
  const [indexes, setIndexes] = useState<DashboardIndexes>({
    collectionId: "",
    versionId: "",
    data: [],
  });

  const { data, isLoading } = useQuery({
    queryKey: ["list-dashboards"],
    queryFn: () =>
      fetch(`${VITE_APP_SERVER_URL}/admin/list-dashboards`).then((response) =>
        response.json()
      ),
  });

  useEffect(() => {
    const board = data?.find((dashboard) => dashboard.id === dashboardId);
    if (board?.constants) {
      setConstants(board.constants);
    }
  }, [data, dashboardId]);

  if (isLoading || !data) {
    return (
      <Container>
        <Row>
          <Col>Chargement des collections du dashboard {dashboardId}</Col>
        </Row>
      </Container>
    );
  }

  const board = data.find((dashboard) => dashboard.id === dashboardId);

  return (
    <Container>
      <Row className="fr-mb-5w">
        <Col>
          <Breadcrumb className="fr-m-0 fr-mt-1w">
            <Link href="/admin">Admin - accueil</Link>
            <Link>
              <strong>Dashboard {dashboardId}</strong>
            </Link>
          </Breadcrumb>
          <Link href={`${VITE_APP_TICKETOFFICE_URL}/tableaux-contact?page=1&query=&searchInMessage=true&sort=DESC&status=choose`} target="_blank">
            Accéder à ticket office
          </Link>
        </Col>
      </Row>
      <ConstantsTable
        constants={constants}
        savedConstants={board.constants}
        setConstants={setConstants}
        updateConstant={(key, value) => updateConstant(dashboardId, key, value)}
      />
      <Collections
        collections={board.data}
        dashboardId={dashboardId}
        indexes={indexes}
        invalidateDashboardQueries={invalidateDashboardQueries}
        setCurrentVersion={(collectionId, versionId) => setCurrentVersion(dashboardId, collectionId, versionId)}
        updateVersionFromDependentCollection={(collectionId) => updateVersionFromDependentCollection(dashboardId, collectionId)}
        showIndexesAside={(collectionId, versionId) => showIndexesAside(collectionId, versionId, setIndexes)}
        deleteVersion={(collectionId, versionId) => deleteVersion(dashboardId, collectionId, versionId)}
      />
    </Container>
  );
}
