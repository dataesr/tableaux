import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Badge, Button, Col, Modal, ModalContent, ModalTitle, Row, Spinner, Text, Title } from "@dataesr/dsfr-plus";
import SyntaxHighlighter from "react-syntax-highlighter";

import UploadVersion from "../../upload-version";
import type { DashboardCollection, DashboardIndexes } from "../utils";

const { VITE_APP_SERVER_URL } = import.meta.env;

function CollectionSize({ collectionName, dashboardId }: { collectionName: string; dashboardId: string }) {
  const { data, isFetching, error } = useQuery({
    queryKey: ["admin-collection-size", dashboardId, collectionName],
    queryFn: async () => {
      const params = new URLSearchParams({ dashboardId });
      const response = await fetch(`${VITE_APP_SERVER_URL}/admin/collection-size/${encodeURIComponent(collectionName)}?${params}`);
      if (response.status === 404) throw new Error("Collection staging introuvable");
      if (response.status === 409) throw new Error("Plusieurs collections staging correspondent à cette version");
      if (!response.ok) throw new Error("Impossible de charger le nombre de documents");
      const result: { size: number } = await response.json();
      return result.size;
    },
    retry: false,
  });

  if (isFetching) return <span role="status">Chargement…</span>;
  if (error) return <span role="alert">{error.message}</span>;
  return <>{data?.toLocaleString("fr-FR")}</>;
}

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
  const [loadingVersion, setLoadingVersion] = useState<{ collectionId: string; versionId: string } | null>(null);
  const copyInProgress = useRef(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 5000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

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
                              <th scope="col">Documents de la version staging</th>
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
                                <td>{dashboardId ? <CollectionSize collectionName={version.id} dashboardId={dashboardId} /> : "Nombre de documents indisponible"}</td>
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
                                      if (copyInProgress.current || !window.confirm("Êtes-vous sûr de vouloir copier cette version de Staging en production ?")) return;
                                      copyInProgress.current = true;
                                      setLoadingVersion({ collectionId: collection.id, versionId: version.id });
                                      setSuccessMessage(null);
                                      try {
                                        const result = await copyVersionToProduction(collection.id, version.id);
                                        if (result.success) setSuccessMessage(result.message);
                                        else setErrorMessage(result.message);
                                      } finally {
                                        copyInProgress.current = false;
                                        setLoadingVersion(null);
                                      }
                                    }}
                                    disabled={loadingVersion !== null}
                                    title="Copier cette version de Staging en production"
                                    variant="text"
                                  />
                                  {loadingVersion?.collectionId === collection.id && loadingVersion.versionId === version.id && (
                                    <span role="status"><Spinner size={16} /> Copie en cours…</span>
                                  )}
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
      {successMessage && <Alert description={successMessage} title="Succès" variant="success" />}
      {errorMessage && <Alert closeMode="controlled" description={errorMessage} onClose={() => setErrorMessage(null)} title="Erreur" variant="error" />}
    </>
  );
}
