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
  productionVersion?: string;
  versions: { id: string; createdAt: string; from?: string }[];
};

export type DashboardIndexes = {
  collectionId: string;
  versionId: string;
  data: unknown[];
  isLoading?: boolean;
  error?: string;
};

export const invalidateDashboardQueries = () => {
  queryClient.invalidateQueries({ queryKey: ["list-dashboards"] });
  queryClient.invalidateQueries({ queryKey: ["admin-collection-size"] });
  // La première copie vers la prod crée la fiche de prod, et donc ses constantes.
  queryClient.invalidateQueries({ queryKey: ["admin-production-constants"] });
};

// Renvoie si la modification a réussi, pour que le passage groupé en staging puisse signaler les échecs.
export const setCurrentVersion = (dashboardId: string | undefined, collectionId: string, versionId: string) =>
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
    return response.ok;
  });

export type ConstantsEnvironment = "staging" | "production";

export const updateConstant = (dashboardId: string | undefined, key: string, value: string, environment: ConstantsEnvironment = "staging") => {
  fetch(`${VITE_APP_SERVER_URL}/admin/update-constant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dashboardId, key, value, environment }),
  }).then((response) => {
    if (response.ok) {
      invalidateDashboardQueries();
    } else {
      console.log("Erreur lors de la modification de la constante");
    }
  });
};

export const addConstant = async (dashboardId: string | undefined, constant: DashboardConstant) => {
  try {
    const response = await fetch(`${VITE_APP_SERVER_URL}/admin/add-constant`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dashboardId, ...constant }),
    });
    const data = await response.json();
    if (!response.ok) return { success: false, message: data.error || "Impossible d'ajouter la constante" };
    invalidateDashboardQueries();
    return { success: true, message: `Constante ${data.key} ajoutée en staging` };
  } catch (error) {
    return { success: false, message: `Impossible d'ajouter la constante : ${error instanceof Error ? error.message : String(error)}` };
  }
};

// Constantes de la fiche de prod ; `null` quand le tableau n'a pas encore de fiche en prod.
export const getProductionConstants = async (dashboardId: string | undefined): Promise<DashboardConstant[] | null> => {
  const params = new URLSearchParams({ dashboardId: dashboardId || "", environment: "production" });
  const response = await fetch(`${VITE_APP_SERVER_URL}/admin/get-constants?${params}`);
  if (response.status === 404) return null;
  if (response.status === 503) throw new Error("La base de production n'est pas configurée sur ce serveur");
  if (!response.ok) throw new Error("Impossible de charger les constantes de production");
  return (await response.json()) ?? [];
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
  dashboardId: string | undefined,
  collectionId: string,
  versionId: string,
  setIndexes: (indexes: DashboardIndexes) => void
) => {
  // Vide la fenêtre pendant le chargement, pour ne pas afficher les index de la version consultée avant.
  setIndexes({ collectionId, versionId, data: [], isLoading: true });
  const params = new URLSearchParams({ collectionId: versionId, dashboardId: dashboardId || "" });
  fetch(`${VITE_APP_SERVER_URL}/admin/list-indexes?${params}`)
    .then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de charger les index");
      setIndexes({ collectionId, versionId, data });
    })
    .catch((error: Error) => {
      setIndexes({ collectionId, versionId, data: [], error: error.message });
    });
};

export const copyVersionToProduction = async (dashboardId: string | undefined, collectionId: string, versionId: string) => {
  try {
    const response = await fetch(`${VITE_APP_SERVER_URL}/admin/copy-version-to-production`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dashboardId, collectionId, versionId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, message: errorData.details || errorData.error || "Erreur lors de la copie" };
    }

    // La copie tourne en tâche de fond sur le serveur : on interroge son statut jusqu'à la fin. Avant, on attendait
    // la réponse de la copie elle-même, qu'un proxy coupait sur une grosse collection alors que la copie continuait.
    const params = new URLSearchParams({ dashboardId: dashboardId || "", collectionId });
    while (true) {
      await new Promise((resolve) => window.setTimeout(resolve, 3000));
      const statusResponse = await fetch(`${VITE_APP_SERVER_URL}/admin/copy-version-to-production/status?${params}`);
      if (!statusResponse.ok) {
        return { success: false, message: "Impossible de suivre la copie : elle continue peut-être sur le serveur" };
      }
      const copy = await statusResponse.json();
      if (copy.status === "done") {
        invalidateDashboardQueries();
        return { success: true, message: `${copy.documentsCount} documents copiés avec succès` };
      }
      if (copy.status === "error") {
        return { success: false, message: copy.details || copy.error || "Erreur lors de la copie" };
      }
    }
  } catch (error) {
    console.error("Error copying version to production:", error);
    // La cause réelle (serveur injoignable, réponse qui n'est pas du JSON…) est affichée, sinon l'erreur est inexploitable.
    return { success: false, message: `Erreur lors de la copie de la version : ${error instanceof Error ? error.message : String(error)}` };
  }
};
