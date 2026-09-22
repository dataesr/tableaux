import { useEffect, useState } from "react";
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
  Title,
} from "@dataesr/dsfr-plus";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import SyntaxHighlighter from "react-syntax-highlighter";

import { queryClient } from "../../main";
import UploadVersion from "./upload-version";

const { VITE_APP_SERVER_URL, VITE_APP_TICKETOFFICE_URL } = import.meta.env;

export default function Dashboard() {
  const { dashboardId } = useParams();
  const [constants, setConstants] = useState<
    { key: string; value: string; description: string }[]
  >([]);
  const [indexes, setIndexes] = useState({
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

  const invalidateDashboardQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["list-dashboards"] });
  };

  const setCurrentVersion = (collectionId, versionId) => {
    fetch(`${VITE_APP_SERVER_URL}/admin/set-current-version`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dashboardId,
        dataId: collectionId,
        versionId,
      }),
    }).then((response) => {
      if (response.ok) {
        invalidateDashboardQueries();
      } else {
        console.log("Erreur lors de la modification de la version courante");
      }
    });
  };

  const updateConstant = (key, value) => {
    fetch(`${VITE_APP_SERVER_URL}/admin/update-constant`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dashboardId,
        key,
        value,
      }),
    }).then((response) => {
      if (response.ok) {
        invalidateDashboardQueries();
      } else {
        console.log("Erreur lors de la modification de la constante");
      }
    });
  };

  const deleteVersion = (collectionId, versionId) => {
    fetch(`${VITE_APP_SERVER_URL}/admin/delete-version`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        dashboardId,
        collectionId,
        versionId,
      }),
    }).then((response) => {
      if (response.ok) {
        invalidateDashboardQueries();
      } else {
        console.log("Erreur lors de la suppression de la version");
      }
    });
  };

  const updateVersionFromDependentCollection = (collectionId) => {
    fetch(
      `${VITE_APP_SERVER_URL}/admin/update-version-from-dependent-collection`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dashboardId,
          collectionId,
        }),
      }
    ).then((response) => {
      if (response.ok) {
        invalidateDashboardQueries();
      } else {
        console.log("Erreur lors de la mise à jour de la version");
      }
    });
  };

  const showIndexesAside = (collectionId, versionId) => {
    fetch(`${VITE_APP_SERVER_URL}/admin/list-indexes?collectionId=${versionId}`)
      .then((response) => response.json())
      .then((data) => {
        setIndexes({ collectionId, versionId, data });
      });
  };

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
          <Link
            href={`${VITE_APP_TICKETOFFICE_URL}/tableaux-contact?page=1&query=&searchInMessage=true&sort=DESC&status=choose`}
            target="_blank"
          >
            Accéder à ticket office
          </Link>
        </Col>
      </Row>
      <div className="fr-table--sm fr-table fr-table--bordered">
        <div className="fr-table__wrapper">
          <div className="fr-table__container">
            <div className="fr-table__content">
              <table>
                <caption>Constantes applicatives</caption>
                <thead>
                  <tr>
                    <th>Clé</th>
                    <th>Valeur</th>
                    <th>Info</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {constants.map((constant) => (
                    <tr id="table-sm-row-key-1" data-row-key="1">
                      <td>{constant.key}</td>
                      <td>
                        <input
                          onChange={(e) => {
                            setConstants(
                              constants.map((el) =>
                                el.key === constant.key
                                  ? { ...el, value: e.target.value }
                                  : el
                              )
                            );
                          }}
                          type="text"
                          value={constant.value}
                        />
                      </td>
                      <td>{constant.description}</td>
                      <td>
                        <Button
                          disabled={
                            board.constants.find(
                              (el) => el.key === constant.key
                            )?.value === constant.value
                          }
                          icon="save-line"
                          onClick={() => {
                            updateConstant(constant.key, constant.value);
                          }}
                          size="sm"
                          title="Mettre à jour la constante"
                          variant="text"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <Title as="h2" look="h6">
        Liste des collections
      </Title>
      <ul>
        {board.data.map((collection) => (
          <li key={collection.id}>
            <div className="fr-card fr-my-2w fr-p-3w">
              <Row gutters>
                <Col>
                  <div className="fr-table--sm fr-table fr-table--bordered">
                    <div className="fr-table__wrapper">
                      <div className="fr-table__container">
                        <div className="fr-table__content">
                          <table>
                            <caption>
                              <span
                                className="fr-icon-bookmark-line"
                                aria-hidden="true"
                              />{" "}
                              {collection.id}
                              {collection.dependsOf ? (
                                <Button
                                  className="fr-ml-3w"
                                  icon="file-add-line"
                                  onClick={() => {
                                    updateVersionFromDependentCollection(
                                      collection.id
                                    );
                                  }}
                                  size="sm"
                                  variant="text"
                                >
                                  Mise à jour depuis la collection{" "}
                                  {collection.dependsOf}
                                </Button>
                              ) : (
                                <>
                                  <Button
                                    aria-controls={`${collection.id}-modal-id`}
                                    className="fr-ml-3w"
                                    data-fr-opened="false"
                                    icon="file-add-line"
                                    size="sm"
                                    variant="text"
                                  >
                                    Ajouter une version
                                  </Button>
                                  <Modal
                                    isOpen
                                    id={`${collection.id}-modal-id`}
                                    size="lg"
                                    hide={() => {}}
                                  >
                                    <ModalTitle>
                                      Ajout d'une version à la collection
                                      <Badge>{collection.id}</Badge>
                                    </ModalTitle>
                                    <ModalContent>
                                      <UploadVersion
                                        dashboardId={dashboardId || ""}
                                        collectionId={collection.id}
                                        invalidateDashboardQueries={
                                          invalidateDashboardQueries
                                        }
                                      />
                                    </ModalContent>
                                  </Modal>
                                </>
                              )}
                              {collection.dependsOf && (
                                <>
                                  <Text>
                                    ------&gt; <i>dépend de la collection</i>{" "}
                                    <Badge color="yellow-moutarde" size="sm">
                                      {collection.dependsOf}
                                    </Badge>
                                  </Text>
                                  {
                                    // test de l'obsolescence de la version actuelle
                                    board.data.find(
                                      (el) => el.id === collection.dependsOf
                                    ).current !==
                                      collection.versions.find(
                                        (v) => v.id === collection.current
                                      ).from && (
                                      <Badge color="warning">
                                        Attention : La version actuelle est
                                        obsolète
                                      </Badge>
                                    )
                                  }
                                </>
                              )}
                            </caption>
                            <thead>
                              <tr>
                                <th>ID de la version</th>
                                <th>Date de création</th>
                                <th colSpan={2}>Staging</th>
                                <th colSpan={2}>Production</th>
                                <th />
                              </tr>
                            </thead>
                            <tbody>
                              {collection.versions.map((version) => (
                                <tr key={version.id}>
                                  <td>{version.id}</td>
                                  <td>{version.createdAt}</td>
                                  {version.id === collection.current ? (
                                    <td>
                                      <Button
                                        color="yellow-tournesol"
                                        icon="star-s-fill"
                                        onClick={() => {
                                          setCurrentVersion(
                                            collection.id,
                                            version.id
                                          );
                                        }}
                                        title="Définir la version courante de staging"
                                        variant="text"
                                      />
                                    </td>
                                  ) : (
                                    <td>
                                      <Button
                                        color="beige-gris-galet"
                                        icon="star-s-line"
                                        onClick={() => {
                                          setCurrentVersion(
                                            collection.id,
                                            version.id
                                          );
                                        }}
                                        title="Définir la version courante de staging"
                                        variant="text"
                                      />
                                    </td>
                                  )}
                                  <td>
                                    <Button
                                      aria-controls={`${collection.id}-indexes-modal-id`}
                                      data-fr-opened="false"
                                      color="beige-gris-galet"
                                      icon="todo-line"
                                      onClick={() => {
                                        showIndexesAside(
                                          collection.id,
                                          version.id
                                        );
                                      }}
                                      size="sm"
                                      title="Afficher les index en staging"
                                      variant="text"
                                    />
                                  </td>
                                  <td>
                                    <Button
                                      color="beige-gris-galet"
                                      disabled
                                      icon="star-s-line"
                                      title="Définir la version courante de production"
                                      variant="text"
                                    />
                                  </td>
                                  <td>
                                    <Button
                                      color="beige-gris-galet"
                                      disabled
                                      icon="todo-line"
                                      size="sm"
                                      title="Gérer les index en production"
                                      variant="text"
                                    />
                                  </td>
                                  <td>
                                    <Button
                                      color="error"
                                      icon="delete-bin-line"
                                      onClick={() => {
                                        deleteVersion(
                                          collection.id,
                                          version.id
                                        );
                                      }}
                                      size="sm"
                                      title="Supprimer la version"
                                      variant="text"
                                    />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                </Col>
              </Row>
              <Modal
                isOpen
                id={`${collection.id}-indexes-modal-id`}
                size="lg"
                hide={() => {}}
              >
                <ModalTitle>
                  Indexes de la collection <Badge>{indexes.collectionId}</Badge>
                  <br />
                  Version{" "}
                  <Badge color="yellow-moutarde">{indexes.versionId}</Badge>
                </ModalTitle>
                <ModalContent>
                  <SyntaxHighlighter language="javascript">
                    {JSON.stringify(indexes.data, null, 2)}
                  </SyntaxHighlighter>
                </ModalContent>
              </Modal>
            </div>
          </li>
        ))}
      </ul>
    </Container>
  );
}
