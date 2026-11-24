import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Badge, Button, ButtonGroup, Col, Modal, ModalContent, ModalTitle, Row, Spinner, Text, Title } from "@dataesr/dsfr-plus";
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

// Dernière version d'une collection : la date de création la plus récente. Une date égale ou illisible
// ne fait pas reculer : à défaut, c'est la version ajoutée en dernier à la liste qui l'emporte.
function getLatestVersion(collection: DashboardCollection) {
  const getTime = (version: DashboardCollection["versions"][number]) => new Date(version.createdAt).getTime();
  let latest = collection.versions[0];
  for (const version of collection.versions) {
    if (!(getTime(version) < getTime(latest))) latest = version;
  }
  return latest;
}

type Props = {
  collections: DashboardCollection[];
  dashboardId: string | undefined;
  indexes: DashboardIndexes;
  invalidateDashboardQueries: () => void;
  setCurrentVersion: (collectionId: string, versionId: string) => Promise<boolean>;
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
  const [isIndexesModalOpen, setIsIndexesModalOpen] = useState(false);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 5000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  // Copie en production la version courante de staging de chaque collection qui n'y est pas encore.
  // Les copies s'enchaînent une par une : chacune est déjà lourde pour les deux bases, et le suivi reste lisible.
  // Un échec n'arrête pas les suivantes : chaque copie est indépendante et laisse la production intacte si elle échoue.
  const copyAllToProduction = async () => {
    const collectionsToCopy = collections.filter((collection) => collection.current && collection.current !== collection.productionVersion);
    if (collectionsToCopy.length === 0) {
      setSuccessMessage("Toutes les versions courantes de staging sont déjà en production");
      return;
    }
    if (copyInProgress.current || !window.confirm(`Copier en production la version courante de staging de ${collectionsToCopy.length} collection(s) : ${collectionsToCopy.map((collection) => collection.id).join(", ")} ?`)) return;
    copyInProgress.current = true;
    setSuccessMessage(null);
    setErrorMessage(null);
    const errors: string[] = [];
    try {
      for (const collection of collectionsToCopy) {
        setLoadingVersion({ collectionId: collection.id, versionId: collection.current });
        const result = await copyVersionToProduction(collection.id, collection.current);
        if (!result.success) errors.push(`${collection.id} : ${result.message}`);
      }
    } finally {
      copyInProgress.current = false;
      setLoadingVersion(null);
    }
    const copiedCount = collectionsToCopy.length - errors.length;
    if (copiedCount > 0) setSuccessMessage(`${copiedCount} collection(s) copiée(s) en production`);
    if (errors.length > 0) setErrorMessage(errors.join(" ; "));
  };

  // Après une mise à jour des données, définit la dernière version disponible comme version courante de staging,
  // pour chaque collection où ce n'est pas déjà le cas.
  const setLatestVersionsInStaging = async () => {
    const changes = collections
      .map((collection) => ({ collection, latest: getLatestVersion(collection) }))
      .filter(({ collection, latest }) => latest && latest.id !== collection.current);
    if (changes.length === 0) {
      setSuccessMessage("Les dernières versions sont déjà les versions courantes de staging");
      return;
    }
    if (!window.confirm(`Passer en staging la dernière version de ${changes.length} collection(s) :\n${changes.map(({ collection, latest }) => `${collection.id} : ${collection.current} → ${latest.id}`).join("\n")}`)) return;
    setSuccessMessage(null);
    setErrorMessage(null);
    const results = await Promise.all(changes.map(({ collection, latest }) => setCurrentVersion(collection.id, latest.id).catch(() => false)));
    const failures = changes.filter((_, index) => !results[index]).map(({ collection }) => collection.id);
    if (failures.length < changes.length) setSuccessMessage(`${changes.length - failures.length} collection(s) passée(s) sur leur dernière version en staging`);
    if (failures.length > 0) setErrorMessage(`Échec du passage en staging : ${failures.join(", ")}`);
  };

  return (
    <>
      <Title as="h2" look="h6">
        Liste des collections
      </Title>
      {/* Groupe de boutons DSFR : espacement entre les boutons et retour à la ligne gérés par le DSFR, boutons empilés sur mobile. */}
      <ButtonGroup className="fr-mb-0" isInlineFrom="md" size="sm">
        <Button>Ajouter une collection</Button>
        <Button disabled={loadingVersion !== null} icon="refresh-line" onClick={setLatestVersionsInStaging} variant="secondary">
          Passer en staging les dernières versions
        </Button>
        <Button disabled={loadingVersion !== null} icon="upload-line" onClick={copyAllToProduction} variant="secondary">
          Copier toutes les versions courantes en production
        </Button>
      </ButtonGroup>
      <p className="fr-mb-3w" role="status">
        {loadingVersion && (
          <>
            <Spinner size={16} /> Copie en cours : {loadingVersion.collectionId}
          </>
        )}
      </p>
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
                              <th>Production</th>
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
                                    color="beige-gris-galet"
                                    icon="todo-line"
                                    onClick={() => {
                                      showIndexesAside(collection.id, version.id);
                                      setIsIndexesModalOpen(true);
                                    }}
                                    size="sm"
                                    title="Afficher les index en staging"
                                    variant="text"
                                  />
                                </td>
                                <td>
                                  <Button
                                    color={version.id === collection.productionVersion ? "success" : "beige-gris-galet"}
                                    icon={version.id === collection.productionVersion ? "star-s-fill" : "star-s-line"}
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
          </li>
        ))}
      </ul>
      {/* Une seule fenêtre pour toutes les versions, ouverte et fermée par React : avant, une fenêtre par collection
          était ouverte par le JavaScript du DSFR (aria-controls / data-fr-opened sur un bouton React). */}
      <Modal hide={() => setIsIndexesModalOpen(false)} isOpen={isIndexesModalOpen} size="lg">
        <ModalTitle>
          Index de la collection <Badge>{indexes.collectionId}</Badge>
          <br />
          Version <Badge color="yellow-moutarde">{indexes.versionId}</Badge>
        </ModalTitle>
        <ModalContent>
          {indexes.isLoading && <p role="status">Chargement des index…</p>}
          {indexes.error && <Alert description={indexes.error} title="Erreur" variant="error" />}
          {!indexes.isLoading && !indexes.error && <SyntaxHighlighter language="javascript">{JSON.stringify(indexes.data, null, 2)}</SyntaxHighlighter>}
        </ModalContent>
      </Modal>
      {successMessage && <Alert description={successMessage} title="Succès" variant="success" />}
      {errorMessage && <Alert closeMode="controlled" description={errorMessage} onClose={() => setErrorMessage(null)} title="Erreur" variant="error" />}
    </>
  );
}
