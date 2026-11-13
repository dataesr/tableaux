import { useState } from "react";
import { Alert, Badge, Button, Col, Modal, ModalContent, ModalTitle, Row, Text, Title } from "@dataesr/dsfr-plus";
import SyntaxHighlighter from "react-syntax-highlighter";

import UploadVersion from "../../upload-version";
import type { DashboardCollection, DashboardIndexes } from "../utils";

type Props = {
  collections: DashboardCollection[];
  dashboardId: string | undefined;
  indexes: DashboardIndexes;
  invalidateDashboardQueries: () => void;
  setCurrentVersion: (collectionId: string, versionId: string) => void;
  updateVersionFromDependentCollection: (collectionId: string) => void;
  showIndexesAside: (collectionId: string, versionId: string) => void;
  deleteVersion: (collectionId: string, versionId: string) => void;
  copyVersionToProduction: (collectionId: string, versionId: string) => Promise<{ success: boolean; message: string }>;
};

export default function Collections({ collections, dashboardId, indexes, invalidateDashboardQueries, setCurrentVersion, updateVersionFromDependentCollection, showIndexesAside, deleteVersion, copyVersionToProduction }: Props) {
  const [loadingVersions, setLoadingVersions] = useState<Set<string>>(new Set());
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);
  return (
    <>
      <Row>
        <Col>
          <Title as="h2" look="h6">
            Liste des collections
          </Title>
        </Col>
        <Col className="text-right">
          <Button size="sm">Ajouter une collection</Button>
        </Col>
      </Row>
      <ul style={{ listStyle: "none" }} className="fr-p-0">
        {collections.map((collection) => (
          <li key={collection.id}>
            <Row gutters>
              <Col>
                <div className="fr-table--sm fr-table fr-table--bordered">
                  <div className="fr-table__wrapper">
                    <div className="fr-table__container">
                      <div className="fr-table__content">
                        <table>
                          <caption>
                            <span className="fr-icon-bookmark-line" aria-hidden="true" /> {collection.id}
                            {collection.dependsOf ? (
                              <Button
                                className="fr-ml-3w"
                                icon="file-add-line"
                                onClick={() => {
                                  updateVersionFromDependentCollection(collection.id);
                                }}
                                size="sm"
                                variant="text"
                              >
                                Mise à jour depuis la collection {collection.dependsOf}
                              </Button>
                            ) : (
                              <>
                                <Button aria-controls={`${collection.id}-modal-id`} className="fr-ml-3w" data-fr-opened="false" icon="file-add-line" size="sm" variant="text">
                                  Ajouter une version
                                </Button>
                                <Modal isOpen id={`${collection.id}-modal-id`} size="lg" hide={() => {}}>
                                  <ModalTitle>
                                    Ajout d'une version à la collection
                                    <Badge>{collection.id}</Badge>
                                  </ModalTitle>
                                  <ModalContent>
                                    <UploadVersion dashboardId={dashboardId || ""} collectionId={collection.id} invalidateDashboardQueries={invalidateDashboardQueries} />
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
                                  collections.find((el) => el.id === collection.dependsOf)!.current !== collection.versions.find((v) => v.id === collection.current)!.from && <Badge color="warning">Attention : La version actuelle est obsolète</Badge>
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
                                        setCurrentVersion(collection.id, version.id);
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
                                        setCurrentVersion(collection.id, version.id);
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
                                      showIndexesAside(collection.id, version.id);
                                    }}
                                    size="sm"
                                    title="Afficher les index en staging"
                                    variant="text"
                                  />
                                </td>
                                <td>
                                  <Button
                                    color="success"
                                    icon="star-s-fill"
                                    onClick={async () => {
                                      const versionKey = `${collection.id}-${version.id}`;
                                      setLoadingVersions((prev) => new Set(prev).add(versionKey));
                                      try {
                                        const result = await copyVersionToProduction(collection.id, version.id);
                                        setNotification({ type: result.success ? "success" : "error", message: result.message });
                                      } finally {
                                        setLoadingVersions((prev) => {
                                          const updated = new Set(prev);
                                          updated.delete(versionKey);
                                          return updated;
                                        });
                                      }
                                    }}
                                    disabled={loadingVersions.has(`${collection.id}-${version.id}`)}
                                    title="Copier cette version de Staging en production"
                                    variant="text"
                                  />
                                </td>
                                <td>
                                  <Button color="beige-gris-galet" disabled icon="todo-line" size="sm" title="Appliquer l'index de Staging en production" variant="text" />
                                </td>
                                <td>
                                  <Button
                                    color="error"
                                    icon="delete-bin-line"
                                    onClick={() => {
                                      deleteVersion(collection.id, version.id);
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
            <Modal isOpen id={`${collection.id}-indexes-modal-id`} size="lg" hide={() => {}}>
              <ModalTitle>
                Indexes de la collection <Badge>{indexes.collectionId}</Badge>
                <br />
                Version <Badge color="yellow-moutarde">{indexes.versionId}</Badge>
              </ModalTitle>
              <ModalContent>
                <SyntaxHighlighter language="javascript">{JSON.stringify(indexes.data, null, 2)}</SyntaxHighlighter>
              </ModalContent>
            </Modal>
          </li>
        ))}
      </ul>
      {notification && <Alert description={notification.message} onClose={() => setNotification(null)} title={notification.type === "success" ? "Succès" : "Erreur"} variant={notification.type} />}
    </>
  );
}
