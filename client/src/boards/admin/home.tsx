import {
  Badge,
  Breadcrumb,
  Button,
  Col,
  Container,
  Link,
  Modal,
  ModalContent,
  ModalTitle,
  Row,
  Text,
  TextInput,
  Title,
} from "@dataesr/dsfr-plus";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Fragment } from "react";

import { useMemo, useState } from "react";
import { queryClient } from "../../main";
import Callout from "../atlas/components/callout";

import "./styles.scss";

const { VITE_APP_SERVER_URL } = import.meta.env;

const formatCreationDate = (timestamp: number | null) => {
  if (!timestamp) return null;

  return new Date(timestamp * 1000).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};


export default function Home() {
  const [successMessages, setSuccessMessages] = useState<Map<string, string>>(new Map());
  const [copyingCollections, setCopyingCollections] = useState<Set<string>>(new Set());
  const [selectedDashboard, setSelectedDashboard] = useState<string>("");
  const [selectedCollection, setSelectedCollection] = useState<string>("");
  const [selectedField, setSelectedField] = useState<string>("");
  const [associatedRoute, setAssociatedRoute] = useState<string>("");
  const [manualFieldName, setManualFieldName] = useState<string>("");
  const [manualFieldValue, setManualFieldValue] = useState<string>("");
  const [manualRoute, setManualRoute] = useState<string>("");
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [characterizationMode, setCharacterizationMode] = useState<"collection" | "manual">("collection");
  const [selectedCharacterization, setSelectedCharacterization] = useState<{
    boardId: string;
    collectionId: string;
    field: string;
    associatedRoute: string;
    count: number;
    values?: string[];
  } | null>(null);
  const [searchValue, setSearchValue] = useState<string>("");
  const [newDashboard, setNewDashboard] = useState({
    name_fr: "",
    name_en: "",
    id: "",
    description_fr: "",
    description_en: "",
    url: "",
    api_url: "",
    isMultilingual: false,
    homePageVisible: true,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["list-dashboards"],
    queryFn: () => fetch(`${VITE_APP_SERVER_URL}/admin/list-dashboards`).then((response) => response.json()),
  });

  const { data: allCollections, isLoading: isLoadingAllCollections } = useQuery({
    queryKey: ["list-all-collections"],
    queryFn: () => fetch(`${VITE_APP_SERVER_URL}/admin/list-all-collections`).then((response) => response.json()),
  });

  const { data: collectionFields, isLoading: isLoadingCollectionFields } = useQuery({
    queryKey: ["list-collection-fields", selectedDashboard, selectedCollection],
    queryFn: () =>
      fetch(`${VITE_APP_SERVER_URL}/admin/list-collection-fields?collectionName=${selectedDashboard}_${selectedCollection}_staging`).then(
        (response) => response.json()
      ),
    enabled: !!selectedDashboard && !!selectedCollection,
  });

  const { data: characterizations, isLoading: isLoadingCharacterizations } = useQuery({
    queryKey: ["list-characterizations"],
    queryFn: () => fetch(`${VITE_APP_SERVER_URL}/admin/list-characterizations`).then((response) => response.json()),
  });

  // Filtrer les valeurs en fonction de la recherche
  const filteredValues = useMemo(() => {
    if (!selectedCharacterization?.values) return [];
    if (!searchValue.trim()) return selectedCharacterization.values;

    return selectedCharacterization.values.filter((value: string) => value.toLowerCase().includes(searchValue.toLowerCase()));
  }, [selectedCharacterization, searchValue]);

  const handleOpenModal = (char: typeof selectedCharacterization) => {
    setSelectedCharacterization(char);
    setSearchValue("");
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setSelectedCharacterization(null);
    setSearchValue("");
  };

  const addDashboardMutation = useMutation({
    mutationFn: async (dashboard: typeof newDashboard) => {
      const response = await fetch(`${VITE_APP_SERVER_URL}/admin/add-dashboard`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dashboard),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'ajout du tableau de bord");
      }

      return response.json();
    },
    onSuccess: async (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["list-dashboards"] });

      const shouldInitializeStructure = window.confirm(
        `Tableau de bord ajouté avec succès !\n\nVoulez-vous initialiser l'arborescence de fichiers pour ce dashboard ?\n\nCela créera automatiquement tous les fichiers nécessaires à partir du template.`
      );

      if (shouldInitializeStructure) {
        try {
          const structureResponse = await fetch(`${VITE_APP_SERVER_URL}/admin/initialize-dashboard-structure`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ dashboardId: variables.id }),
          });

          if (!structureResponse.ok) {
            const error = await structureResponse.json();
            throw new Error(error.error || "Erreur lors de l'initialisation de la structure");
          }

          const structureData = await structureResponse.json();
          alert(
            `Structure du dashboard initialisée avec succès !\n\nRépertoire client : ${structureData.clientDir}\nRépertoire serveur : ${structureData.serverDir}\n\nN'oubliez pas de redémarrer le serveur de développement.`
          );
        } catch (structureError) {
          alert(`Erreur lors de l'initialisation de la structure : ${(structureError as Error).message}`);
        }
      } else {
        alert("Tableau de bord ajouté avec succès (sans initialisation de la structure)");
      }

      setNewDashboard({
        name_fr: "",
        name_en: "",
        id: "",
        description_fr: "",
        description_en: "",
        url: "",
        api_url: "",
        isMultilingual: false,
        homePageVisible: true,
      });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const characterizeFieldMutation = useMutation({
    mutationFn: async (params: { boardId: string; collectionId: string; field: string; associatedRoute: string }) => {
      const response = await fetch(`${VITE_APP_SERVER_URL}/admin/characterize-field`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la caractérisation du champ");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["list-characterizations"] });
      alert(`Champ caractérisé avec succès: ${data.count} valeurs distinctes trouvées`);
      // Réinitialiser les sélections
      setSelectedField("");
      setAssociatedRoute("");
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const addManualCharacterizationMutation = useMutation({
    mutationFn: async (params: { boardId: string; field: string; value: string; associatedRoute: string }) => {
      const response = await fetch(`${VITE_APP_SERVER_URL}/admin/add-manual-characterization`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de l'ajout de la caractérisation manuelle");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-characterizations"] });
      alert("Caractérisation manuelle ajoutée avec succès");
      // Réinitialiser les champs
      setManualFieldName("");
      setManualFieldValue("");
      setManualRoute("");
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const refreshCharacterizationMutation = useMutation({
    mutationFn: async (params: { boardId: string; collectionId: string; field: string; associatedRoute: string }) => {
      const response = await fetch(`${VITE_APP_SERVER_URL}/admin/refresh-characterization`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors du rafraîchissement de la caractérisation");
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["list-characterizations"] });
      alert(`Caractérisation rafraîchie avec succès: ${data.count} valeurs distinctes trouvées`);
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const updateHomePageVisibleMutation = useMutation({
    mutationFn: async (params: { dashboardId: string; homePageVisible: boolean }) => {
      const response = await fetch(`${VITE_APP_SERVER_URL}/admin/update-dashboard-visibility`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erreur lors de la mise à jour de la visibilité");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["list-dashboards"] });
    },
    onError: (error: Error) => {
      alert(error.message);
    },
  });

  const groupedBoards: Record<string, Record<string, Record<string, string>>> = allCollections?.reduce((acc, board) => {
    if (!acc[board.boardName]) {
      acc[board.boardName] = {};
    }
    if (!acc[board.boardName][board.collectionName]) {
      acc[board.boardName][board.collectionName] = {
        staging: "",
        "staging-previous": "",
        prod: "",
        "prod-previous": "",
      };
    }
    acc[board.boardName][board.collectionName][board.version] = board.version;
    return acc;
  }, {} as Record<string, Record<string, Record<string, string>>>);

  // Filtrer les collections du dashboard sélectionné
  const availableCollections = selectedDashboard && groupedBoards?.[selectedDashboard] ? Object.keys(groupedBoards[selectedDashboard]).sort() : [];

  if (isLoading || !data) return <>Loading ...</>;

  const stagingToProd = async (collectionName, prodTimestamp) => {
    setCopyingCollections((prev) => new Set(prev).add(collectionName));
    setSuccessMessages((prev) => {
      const next = new Map(prev);
      next.delete(collectionName);
      return next;
    });

    try {
      const copyCollection = async (overwrite = false) => {
        const response = await fetch(`${VITE_APP_SERVER_URL}/admin/copy-collection`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sourceName: `${collectionName}_staging`,
            targetName: `${collectionName}_prod`,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          if (response.status === 409 && !overwrite) {
            const shouldOverwrite = window.confirm("Une collection existe déjà en production. Voulez-vous la remplacer ?");
            if (!shouldOverwrite) {
              return false;
            }

            // If user confirms, copy prod collection to prod-previous after deleting it
            const deletePreviousResponse = await fetch(`${VITE_APP_SERVER_URL}/admin/delete-collection`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                collectionName: `${collectionName}_prod-previous`,
              }),
            });
            if (!deletePreviousResponse.ok) {
              throw new Error("Erreur lors de la suppression de la collection prod-previous");
            }

            const previousResponse = await fetch(`${VITE_APP_SERVER_URL}/admin/copy-collection`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                sourceName: `${collectionName}_prod`,
                targetName: `${collectionName}_prod-previous`,
                timestamp: prodTimestamp,
              }),
            });
            const previousData = await previousResponse.json();
            if (!previousResponse.ok) {
              throw new Error(previousData.error || "Erreur lors de la copie de la collection vers prod-previous");
            }

            const deleteResponse = await fetch(`${VITE_APP_SERVER_URL}/admin/delete-collection`, {
              method: "DELETE",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                collectionName: `${collectionName}_prod`,
              }),
            });
            if (!deleteResponse.ok) {
              throw new Error("Erreur lors de la suppression de la collection");
            }

            return copyCollection(true);
          }
          throw new Error(data.error || "Erreur lors de la copie de la collection");
        }

        return true;
      };

      const success = await copyCollection();

      if (success) {
        queryClient.invalidateQueries({ queryKey: ["list-boards"] });
        setSuccessMessages((prev) => {
          const next = new Map(prev);
          next.set(collectionName, "Mise en production effectuée");
          return next;
        });
        setTimeout(() => {
          setSuccessMessages((prev) => {
            const next = new Map(prev);
            next.delete(collectionName);
            return next;
          });
        }, 3000);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Une erreur est survenue lors de la copie de la collection");
    } finally {
      setCopyingCollections((prev) => {
        const next = new Set(prev);
        next.delete(collectionName);
        return next;
      });
    }
  };

  const add_dashboard = () => {
    // Vérifier que tous les champs sont remplis
    if (
      !newDashboard.name_fr ||
      !newDashboard.name_en ||
      !newDashboard.id ||
      !newDashboard.description_fr ||
      !newDashboard.description_en ||
      !newDashboard.url ||
      !newDashboard.api_url
    ) {
      alert("Tous les champs sont obligatoires");
      return;
    }

    addDashboardMutation.mutate(newDashboard);
  };

  const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  return (
    <Container fluid className="fr-mx-10w admin-home">
      <Row className="fr-mb-5w">
        <Col>
          <Breadcrumb className="fr-m-0 fr-mt-1w">
            <Link href="/">Accueil</Link>
            <Link>
              <strong>Administration de dataSupR</strong>
            </Link>
          </Breadcrumb>
        </Col>
      </Row>
      <h2 className="fr-mb-2w">Gestion des tableaux de bord</h2>
      {isLocalhost && (
        <div className="form-section">
          <h3 className="fr-mb-2w">〉Ajout des tableaux de bord</h3>
          <Row gutters className="form-row">
            <Col>
              <input type="text" className="fr-input fr-mb-2w" placeholder="Identifiant du tableau de bord" value={newDashboard.id} onChange={(e) => setNewDashboard({ ...newDashboard, id: e.target.value })} />
            </Col>
            <Col>
              <input type="text" className="fr-input fr-mb-2w" placeholder="Nom du tableau de bord (FR)" value={newDashboard.name_fr} onChange={(e) => setNewDashboard({ ...newDashboard, name_fr: e.target.value })} />
            </Col>
            <Col>
              <input type="text" className="fr-input fr-mb-2w" placeholder="Nom du tableau de bord (EN)" value={newDashboard.name_en} onChange={(e) => setNewDashboard({ ...newDashboard, name_en: e.target.value })} />
            </Col>
            <Col>
              <div className="fr-checkbox-group">
                <input type="checkbox" id="isMultilingual" checked={newDashboard.isMultilingual} onChange={(e) => setNewDashboard({ ...newDashboard, isMultilingual: e.target.checked })} />
                <label className="fr-label" htmlFor="isMultilingual">
                  Multilingue
                </label>
              </div>
            </Col>
            <Col>
              <div className="fr-checkbox-group">
                <input type="checkbox" id="homePageVisible" checked={newDashboard.homePageVisible} onChange={(e) => setNewDashboard({ ...newDashboard, homePageVisible: e.target.checked })} />
                <label className="fr-label" htmlFor="homePageVisible">
                  Visible sur la page d'accueil
                </label>
              </div>
            </Col>
          </Row>
          <Row gutters className="form-row">
            <Col>
              <input type="text" className="fr-input fr-mb-2w" placeholder="Description du tableau de bord (FR)" value={newDashboard.description_fr} onChange={(e) => setNewDashboard({ ...newDashboard, description_fr: e.target.value })} />
            </Col>
            <Col>
              <input type="text" className="fr-input fr-mb-2w" placeholder="Description du tableau de bord (EN)" value={newDashboard.description_en} onChange={(e) => setNewDashboard({ ...newDashboard, description_en: e.target.value })} />
            </Col>
            <Col>
              <input type="text" className="fr-input fr-mb-2w" placeholder="URL du tableau" value={newDashboard.url} onChange={(e) => setNewDashboard({ ...newDashboard, url: e.target.value })} />
            </Col>
            <Col>
              <input type="text" className="fr-input fr-mb-2w" placeholder="URL de l'API" value={newDashboard.api_url} onChange={(e) => setNewDashboard({ ...newDashboard, api_url: e.target.value })} />
            </Col>
            <Col md={1} className="text-right">
              <Button color="blue-cumulus" onClick={() => add_dashboard()} disabled={addDashboardMutation.isPending}>
                {addDashboardMutation.isPending ? "..." : "Ajouter"}
              </Button>
            </Col>
          </Row>
        </div>
      )}
      <Row>
        <Col>
          <div className="fr-table fr-table--layout-fixed">
            <table>
              <thead>
                <tr>
                  <th>Identifiant</th>
                  <th>Nom (FR)</th>
                  <th>Nom (EN)</th>
                  <th>Description (FR)</th>
                  <th>Description (EN)</th>
                  <th>URL du tableau</th>
                  <th>URL de l'API</th>
                  <th>Multilingue</th>
                  <th>Visible page d'accueil</th>
                </tr>
              </thead>
              <tbody>
                {data.map((dashboard) => (
                  <tr key={dashboard.id}>
                    <td>
                      <Link href={dashboard.url} target="_blank" rel="noopener noreferrer">
                        {dashboard.id}
                      </Link>
                      {"  "}
                      <Link href={`./accessibility/${dashboard.id}`} target="_blank" rel="noopener noreferrer">
                        A
                      </Link>
                    </td>
                    <td>{dashboard.name_fr}</td>
                    <td>{dashboard.name_en}</td>
                    <td>{dashboard.description_fr}</td>
                    <td>{dashboard.description_en}</td>
                    <td>{dashboard.url}</td>
                    <td>{dashboard.api_url}</td>
                    <td>
                      <Badge color={dashboard.isMultilingual ? "success" : "error"}>{dashboard.isMultilingual ? "Oui" : "Non"}</Badge>
                    </td>
                    <td>
                      <div className="fr-toggle">
                        <input
                          type="checkbox"
                          id={`homePageVisible-${dashboard.id}`}
                          checked={dashboard.homePageVisible !== false}
                          onChange={(e) => {
                            updateHomePageVisibleMutation.mutate({
                              dashboardId: dashboard.id,
                              homePageVisible: e.target.checked,
                            });
                          }}
                          disabled={updateHomePageVisibleMutation.isPending}
                        />
                        <label className="fr-toggle__label" htmlFor={`homePageVisible-${dashboard.id}`}>
                          {dashboard.homePageVisible !== false ? "Visible" : "Masqué"}
                        </label>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Col>
      </Row>

      <h3 className="fr-mb-2w">〉Ajout des collections</h3>
      <Callout>
        Pour ajouter une nouvelle collection à un tableau de bord, il suffit de créer la collection dans MongoDB avec le nom suivant : nom-du-tableau_nom-de-la-collection_version.
        <br />
        Exemple : ep_collaborations_staging
      </Callout>

      <h3 className="fr-my-2w">〉Caractérisation d'un tableau de bord</h3>
      <div className="characterization-section">
        <Callout>
          Afin de caractériser un tableau de bord, il est nécessaire de definir toutes les clés de chaque collection et leur route associée. Cela a pour but de mettre en base toutes les valeurs qui pourront être utilisées comme filtres.
        </Callout>

        <Row className="fr-mt-1w">
          <Col>
            <div className="fr-form-group">
              <fieldset className="fr-fieldset">
                <legend className="fr-fieldset__legend">Mode de caractérisation</legend>
                <div className="fr-fieldset__content">
                  <div className="fr-grid-row fr-grid-row--gutters">
                    <div className="fr-col-12 fr-col-md-6">
                      <div className="fr-radio-group fr-radio-rich">
                        <input type="radio" id="mode-collection" name="characterization-mode" value="collection" checked={characterizationMode === "collection"} onChange={(e) => setCharacterizationMode(e.target.value as "collection" | "manual")} />
                        <label className="fr-label" htmlFor="mode-collection">
                          Caractériser depuis une collection
                          <span className="fr-hint-text">Sélectionner un champ existant dans une collection</span>
                        </label>
                      </div>
                    </div>
                    <div className="fr-col-12 fr-col-md-6">
                      <div className="fr-radio-group fr-radio-rich">
                        <input type="radio" id="mode-manual" name="characterization-mode" value="manual" checked={characterizationMode === "manual"} onChange={(e) => setCharacterizationMode(e.target.value as "collection" | "manual")} />
                        <label className="fr-label" htmlFor="mode-manual">
                          Caractériser depuis un champ libre
                          <span className="fr-hint-text">Ajouter manuellement un champ et sa valeur</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </fieldset>
            </div>
          </Col>
        </Row>

        {characterizationMode === "collection" && (
          <Row gutters className="form-row">
            <Col>
              <select name="dashboard-select" id="dashboard-select" className="fr-mb-2w fr-select" value={selectedDashboard} onChange={(e) => setSelectedDashboard(e.target.value)}>
                <option value="">Sélectionner un tableau de bord</option>
                {data.map((dashboard) => (
                  <option key={`dashboard-select-${dashboard.id}`} value={dashboard.id}>
                    {dashboard.name_fr}
                  </option>
                ))}
              </select>
            </Col>
            <Col>
              <select name="collection-select" id="collection-select" className="fr-mb-2w fr-select" disabled={!selectedDashboard} value={selectedCollection} onChange={(e) => setSelectedCollection(e.target.value)}>
                <option value="">Sélectionner une collection</option>
                {availableCollections.map((collectionName) => (
                  <option key={`collection-select-${collectionName}`} value={collectionName}>
                    {collectionName}
                  </option>
                ))}
              </select>
            </Col>
            <Col>
              <select name="field-select" id="field-select" className="fr-mb-2w fr-select" disabled={!selectedCollection || isLoadingCollectionFields} value={selectedField} onChange={(e) => setSelectedField(e.target.value)}>
                <option value="">Sélectionner un champ</option>
                {collectionFields?.fields?.map((field) => (
                  <option key={`field-select-${field.name}`} value={field.name}>
                    {field.name} ({field.types.join(", ")})
                  </option>
                ))}
              </select>
            </Col>
            <Col>
              <input type="text" className="fr-input fr-mb-2w" placeholder="Route du tableau" value={associatedRoute} onChange={(e) => setAssociatedRoute(e.target.value)} disabled={!selectedField} />
            </Col>
            <Col md={1} className="text-right">
              <Button
                color="blue-cumulus"
                onClick={() => {
                  if (!selectedDashboard || !selectedCollection || !selectedField || !associatedRoute) {
                    alert("Tous les champs sont obligatoires");
                    return;
                  }
                  characterizeFieldMutation.mutate({
                    boardId: selectedDashboard,
                    collectionId: selectedCollection,
                    field: selectedField,
                    associatedRoute: associatedRoute,
                  });
                }}
                disabled={!selectedDashboard || !selectedCollection || !selectedField || !associatedRoute || characterizeFieldMutation.isPending}
              >
                {characterizeFieldMutation.isPending ? "..." : "Caractériser"}
              </Button>
            </Col>
          </Row>
        )}

        {characterizationMode === "manual" && (
          <Row gutters className="form-row">
            <Col>
              <select name="dashboard-select-manual" id="dashboard-select-manual" className="fr-mb-2w fr-select" value={selectedDashboard} onChange={(e) => setSelectedDashboard(e.target.value)}>
                <option value="">Sélectionner un tableau de bord</option>
                {data.map((dashboard) => (
                  <option key={`dashboard-select-manual-${dashboard.id}`} value={dashboard.id}>
                    {dashboard.name_fr}
                  </option>
                ))}
              </select>
            </Col>
            <Col>
              <input type="text" className="fr-input fr-mb-2w" placeholder="Nom du champ libre" value={manualFieldName} onChange={(e) => setManualFieldName(e.target.value)} disabled={!selectedDashboard} />
            </Col>
            <Col>
              <input type="text" className="fr-input fr-mb-2w" placeholder="Valeur de comparaison" value={manualFieldValue} onChange={(e) => setManualFieldValue(e.target.value)} disabled={!selectedDashboard} />
            </Col>
            <Col>
              <input type="text" className="fr-input fr-mb-2w" placeholder="Route du tableau" value={manualRoute} onChange={(e) => setManualRoute(e.target.value)} disabled={!selectedDashboard} />
            </Col>
            <Col md={1} className="text-right">
              <Button
                color="blue-cumulus"
                onClick={() => {
                  if (!selectedDashboard || !manualFieldName || !manualFieldValue || !manualRoute) {
                    alert("Tous les champs sont obligatoires");
                    return;
                  }
                  addManualCharacterizationMutation.mutate({
                    boardId: selectedDashboard,
                    field: manualFieldName,
                    value: manualFieldValue,
                    associatedRoute: manualRoute,
                  });
                }}
                disabled={!selectedDashboard || !manualFieldName || !manualFieldValue || !manualRoute || addManualCharacterizationMutation.isPending}
              >
                {addManualCharacterizationMutation.isPending ? "..." : "Caractériser"}
              </Button>
            </Col>
          </Row>
        )}
      </div>
      <Row>
        <Col>
          <div className="fr-table fr-table--layout-fixed">
            <table>
              <thead>
                <tr>
                  <th>Tableau de bord (ID)</th>
                  <th>Collection</th>
                  <th>Champ</th>
                  <th>Route</th>
                  <th>Nb de valeurs</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoadingCharacterizations ? (
                  <tr>
                    <td colSpan={6}>Chargement...</td>
                  </tr>
                ) : characterizations && characterizations.length > 0 ? (
                  characterizations.map((char, index) => (
                    <tr key={`${char.boardId}-${char.collectionId}-${char.field}-${index}`}>
                      <td>{char.boardId}</td>
                      <td>{char.collectionId}</td>
                      <td>{char.field}</td>
                      <td>{char.associatedRoute}</td>
                      <td>
                        <Badge color="blue-cumulus" style={{ cursor: "pointer" }} onClick={() => handleOpenModal(char)}>
                          {char.count}
                        </Badge>
                      </td>
                      <td>
                        {char.collectionId && (
                          <Button
                            size="sm"
                            variant="tertiary"
                            icon="refresh-line"
                            title="Rafraîchir les valeurs depuis la collection"
                            onClick={() => {
                              if (window.confirm(`Rafraîchir les valeurs de ${char.field} depuis la collection ${char.collectionId} ?`)) {
                                refreshCharacterizationMutation.mutate({
                                  boardId: char.boardId,
                                  collectionId: char.collectionId,
                                  field: char.field,
                                  associatedRoute: char.associatedRoute,
                                });
                              }
                            }}
                            disabled={refreshCharacterizationMutation.isPending}
                          >
                            {refreshCharacterizationMutation.isPending ? "..." : "Mettre à jour"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>Aucune caractérisation pour le moment</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Col>
      </Row>

      {/* 
      <Row gutters>
        <Col xs={12} sm={6} md={4}>
          <div className="fr-card fr-enlarge-link">
            <div className="fr-card__body">
              <div className="fr-card__content">
                <h2 className="fr-card__title">
                  Uploads directory
                  <br />
                  <Badge className="fr-mr-1w" color="brown-caramel">
                    {`${filesData?.length} file${filesData?.length > 1 ? "s" : ""}`}
                  </Badge>
                  <Badge color="blue-cumulus">{`${totalFilesSize} Mo`}</Badge>
                  <br />
                  <br />
                  <Button aria-controls="list-of-files-modal-id" data-fr-opened="false" className="fr-mr-1w" icon="eye-line" variant="tertiary">
                    View list
                  </Button>
                  <Button color="error" icon="delete-line" onClick={() => deleteFilesMutation.mutate()}>
                    Delete all files
                  </Button>
                </h2>
              </div>
            </div>
          </div>
        </Col>
        {data.map((dashboard) => (
          <Col xs={12} sm={6} md={4} key={dashboard.id}>
            <DashboardCard dashboard={dashboard} nbMessages={messages?.data?.data?.filter((el) => el.extra.subApplication === dashboard.id).length} />
          </Col>
        ))}
      </Row>
      */}
      <h3 className="fr-mb-2w">〉Administration des versions</h3>
      <div className="version-admin-section">
        {/* <Callout>
          Règles de nommage des collections :<br />
          nom-du-tableau_nom-de-la-collection_version <br />
          - Le nom de la collection doit être préfixé par le nom du tableau
          <br />- Le nom de la collection doit être suffixé par la version (staging-previous, staging, prod-previous, prod)
        </Callout> */}
        <Row>
          <Col>
            {isLoadingAllCollections ? (
              <p>Loading allCollections...</p>
            ) : (
              <div className="fr-table fr-table--layout-fixed">
                <table>
                  <thead>
                    <tr>
                      <th>Tableau de bord (ID)</th>
                      <th>Collection</th>
                      <th>staging-previous</th>
                      <th>staging</th>
                      <th>prod-previous</th>
                      <th>prod</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(groupedBoards || {})
                      .sort(([a], [b]) => a.localeCompare(b))
                      .map(([boardName, collections]) =>
                        Object.entries(collections)
                          .sort(([a], [b]) => a.localeCompare(b))
                          .map(([collectionName, versions]) => {
                            const getVersionInfo = (version) => allCollections?.find((b) => b.boardName === boardName && b.collectionName === collectionName && b.version === version);

                            return (
                              <Fragment key={`${boardName}-${collectionName}`}>
                                <tr>
                                  <td rowSpan={2}>
                                    <Title as="h3" look="h6">
                                      {boardName}
                                    </Title>
                                  </td>
                                  <td>
                                    <Text className="fr-text--bold fr-text--lg">{collectionName}</Text>
                                  </td>
                                  <td>
                                    {getVersionInfo("staging-previous")?.createdAt && (
                                      <Badge className="fr-ml-1w" color="blue-cumulus">
                                        <div className="fr-hint-text">Créé le {formatCreationDate(getVersionInfo("staging-previous").createdAt)}</div>
                                      </Badge>
                                    )}
                                  </td>
                                  <td>
                                    {getVersionInfo("staging")?.createdAt && (
                                      <Badge className="fr-ml-1w" color="blue-cumulus">
                                        <div className="fr-hint-text">Créé le {formatCreationDate(getVersionInfo("staging").createdAt)}</div>
                                      </Badge>
                                    )}
                                    {successMessages.get(`${boardName}_${collectionName}`) && (
                                      <Badge className="fr-ml-1w" color="success">
                                        {successMessages.get(`${boardName}_${collectionName}`)}
                                      </Badge>
                                    )}
                                  </td>
                                  <td>
                                    {getVersionInfo("prod-previous")?.createdAt && (
                                      <Badge className="fr-ml-1w" color="blue-cumulus">
                                        <div className="fr-hint-text">Créé le {formatCreationDate(getVersionInfo("prod-previous").createdAt)}</div>
                                      </Badge>
                                    )}
                                  </td>
                                  <td rowSpan={2} style={{ verticalAlign: "top" }}>
                                    {versions["prod"] && getVersionInfo("prod")?.createdAt && (
                                      <Badge className="fr-ml-1w" color="pink-tuile">
                                        <div className="fr-hint-text">Créé le {formatCreationDate(getVersionInfo("prod").createdAt)}</div>
                                      </Badge>
                                    )}
                                  </td>
                                </tr>
                                <tr>
                                  <td>
                                    <Button size="sm" color="blue-cumulus">
                                      Nouvelle version
                                    </Button>
                                  </td>
                                  <td>
                                    <Button color="blue-cumulus" disabled={!versions["staging-previous"]} size="sm">
                                      Restaurer vers staging
                                    </Button>
                                  </td>
                                  <td>
                                    <Button
                                      color="pink-tuile"
                                      disabled={!versions["staging"] || copyingCollections.has(`${boardName}_${collectionName}`)}
                                      onClick={() => stagingToProd(`${boardName}_${collectionName}`, getVersionInfo("prod").createdAt)}
                                      size="sm"
                                    >
                                      {copyingCollections.has(`${boardName}_${collectionName}`) ? "Copie en cours..." : "Mettre en production"}
                                    </Button>
                                  </td>
                                  <td>
                                    <Button color="green-emeraude" disabled={!versions["prod-previous"]} size="sm">
                                      Restaurer vers prod
                                    </Button>
                                  </td>
                                </tr>
                              </Fragment>
                            );
                          }),
                      )}
                  </tbody>
                </table>
              </div>
            )}
          </Col>
        </Row>
      </div>

      {/* Modale pour afficher les valeurs avec recherche */}
      <Modal isOpen={modalOpen} hide={handleCloseModal} size="lg">
        <ModalTitle>
          Valeurs de caractérisation
          {selectedCharacterization && (
            <div className="fr-text--sm fr-mt-1w">
              <strong>Tableau :</strong> {selectedCharacterization.boardId} |<strong> Collection :</strong> {selectedCharacterization.collectionId} |<strong> Champ :</strong> {selectedCharacterization.field}
            </div>
          )}
        </ModalTitle>
        <ModalContent>
          <TextInput label="Rechercher une valeur" value={searchValue} onChange={(e) => setSearchValue(e.target.value)} placeholder="Tapez pour filtrer les valeurs..." />
          <div className="fr-mt-2w" style={{ maxHeight: "400px", overflowY: "auto" }}>
            {filteredValues.length > 0 ? (
              <ul className="fr-raw-list">
                {filteredValues.map((value: string, idx: number) => (
                  <li key={idx} className="fr-py-1v" style={{ borderBottom: "1px solid #ddd" }}>
                    {value}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="fr-text--sm">{searchValue ? "Aucune valeur ne correspond à votre recherche." : "Aucune valeur disponible."}</p>
            )}
          </div>
          {selectedCharacterization && (
            <div className="fr-mt-2w fr-text--sm">
              <strong>Total : {filteredValues.length}</strong> valeur{filteredValues.length > 1 ? "s" : ""}
              {searchValue && ` (sur ${selectedCharacterization.values?.length || 0})`}
            </div>
          )}
        </ModalContent>
      </Modal>
    </Container>
  );
}
