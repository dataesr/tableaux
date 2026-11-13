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
  if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette version ?")) {
    return;
  }

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

export const copyVersionToProduction = async (dashboardId: string | undefined, collectionId: string, versionId: string) => {
  if (!window.confirm("Êtes-vous sûr de vouloir copier cette version de Staging en production ?")) {
    return { success: false, message: "Opération annulée" };
  }

  try {
    const response = await fetch(`${VITE_APP_SERVER_URL}/admin/copy-version-to-production`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dashboardId, collectionId, versionId }),
    });

    if (response.ok) {
      invalidateDashboardQueries();
      const data = await response.json();
      return { success: true, message: `${data.documentsCount} documents copiés avec succès` };
    } else {
      const errorData = await response.json();
      return { success: false, message: errorData.error || "Erreur lors de la copie" };
    }
  } catch (error) {
    console.error("Error copying version to production:", error);
    return { success: false, message: "Erreur lors de la copie de la version" };
  }
};
