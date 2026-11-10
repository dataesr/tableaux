import { queryClient } from "../../../main";

const { VITE_APP_SERVER_URL } = import.meta.env;

export type DashboardConstant = {
  key: string;
  value: string;
  description: string;
};

export type DashboardCollection = {
  id: string;
  dependsOf?: string;
  current: string;
  versions: { id: string; createdAt: string; from?: string }[];
};

export type DashboardIndexes = {
  collectionId: string;
  versionId: string;
  data: unknown[];
};

export const invalidateDashboardQueries = () => {
  queryClient.invalidateQueries({ queryKey: ["list-dashboards"] });
};

export const setCurrentVersion = (dashboardId: string | undefined, collectionId: string, versionId: string) => {
  fetch(`${VITE_APP_SERVER_URL}/admin/set-current-version`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dashboardId, dataId: collectionId, versionId }),
  }).then((response) => {
    if (response.ok) {
      invalidateDashboardQueries();
    } else {
      console.log("Erreur lors de la modification de la version courante");
    }
  });
};

export const updateConstant = (dashboardId: string | undefined, key: string, value: string) => {
  fetch(`${VITE_APP_SERVER_URL}/admin/update-constant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dashboardId, key, value }),
  }).then((response) => {
    if (response.ok) {
      invalidateDashboardQueries();
    } else {
      console.log("Erreur lors de la modification de la constante");
    }
  });
};

export const deleteVersion = (dashboardId: string | undefined, collectionId: string, versionId: string) => {
  fetch(`${VITE_APP_SERVER_URL}/admin/delete-version`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dashboardId, collectionId, versionId }),
  }).then((response) => {
    if (response.ok) {
      invalidateDashboardQueries();
    } else {
      console.log("Erreur lors de la suppression de la version");
    }
  });
};

export const updateVersionFromDependentCollection = (dashboardId: string | undefined, collectionId: string) => {
  fetch(`${VITE_APP_SERVER_URL}/admin/update-version-from-dependent-collection`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dashboardId, collectionId }),
  }).then((response) => {
    if (response.ok) {
      invalidateDashboardQueries();
    } else {
      console.log("Erreur lors de la mise à jour de la version");
    }
  });
};

export const showIndexesAside = (
  collectionId: string,
  versionId: string,
  setIndexes: (indexes: DashboardIndexes) => void
) => {
  fetch(`${VITE_APP_SERVER_URL}/admin/list-indexes?collectionId=${versionId}`)
    .then((response) => response.json())
    .then((data) => {
      setIndexes({ collectionId, versionId, data });
    });
};
