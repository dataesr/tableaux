import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { useState } from "react";
import { Button, Col, Container, Row, Title, Modal, ModalContent, Tag } from "@dataesr/dsfr-plus";

import { getCollaborations } from "./query";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { getFlagEmoji } from "../../../../utils";
import { getI18nLabel } from "../../../../../../utils";

import i18n from "./i18n.json";
import "./styles.scss";

interface Entity {
  entities_name: string;
  country_code: string;
  country_name_fr: string;
  country_name_en: string;
  projects: Array<{ project_id: string; role: string }>;
  total_projects: number;
}

export default function EntitiesTable({ entityId }) {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";

  // Extraire les paramètres pertinents pour la queryKey
  const rangeOfYears = searchParams.get("range_of_years") || "";
  const pillarId = searchParams.get("pillarId") || "";
  const programId = searchParams.get("programId") || "";
  const thematicIds = searchParams.get("thematicIds") || "";
  const destinationIds = searchParams.get("destinationIds") || "";

  const { data, isLoading } = useQuery({
    queryKey: ["EntitiesCollaborations", entityId, rangeOfYears, pillarId, programId, thematicIds, destinationIds],
    queryFn: () => getCollaborations(entityId, searchParams),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [sortColumn, setSortColumn] = useState("total_collaborations");
  const [sortDirection, setSortDirection] = useState("desc");
  const [showAll, setShowAll] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [countryFilter, setCountryFilter] = useState("");

  // Fonction de téléchargement CSV
  const downloadCSV = (projects: Array<{ project_id: string; role: string }>, filename: string) => {
    const header = "project_id,role,cordis_url\n";
    const rows = projects.map((p) => `${p.project_id},${p.role},https://cordis.europa.eu/project/${p.project_id}`).join("\n");
    const csv = header + rows;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Fonction de tri
  const sortData = (items) => {
    return [...items]?.sort((a, b) => {
      if (sortColumn === "entities_name") {
        return sortDirection === "asc" ? a.entities_name.localeCompare(b.entities_name) : b.entities_name.localeCompare(a.entities_name);
      }
      if (sortColumn === "total_collaborations") {
        return sortDirection === "asc" ? a.projects.length - b.projects.length : b.projects.length - a.projects.length;
      }
      if (sortColumn === "ratio") {
        const ratioA = a.total_projects > 0 ? a.projects.length / a.total_projects : 0;
        const ratioB = b.total_projects > 0 ? b.projects.length / b.total_projects : 0;
        return sortDirection === "asc" ? ratioA - ratioB : ratioB - ratioA;
      }
      return sortDirection === "asc" ? a[sortColumn] - b[sortColumn] : b[sortColumn] - a[sortColumn];
    });
  };

  // Fonction de filtrage
  const filterData = (items) => {
    return items?.filter((item) => {
      const nameMatch = item.entities_name.toLowerCase().includes(searchTerm.toLowerCase());
      const countryMatch = countryFilter ? item.country_code === countryFilter : true;
      return nameMatch && countryMatch;
    });
  };

  const handleSort = (column) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  // Filtrage et tri des données
  const filteredData = filterData(data?.collaborations);
  const sortedData = sortData(filteredData || []);
  const displayedData = showAll ? sortedData : sortedData.slice(0, 20);

  if (isLoading || !data) return <DefaultSkeleton />;

  return (
    <Container fluid className="fr-mt-5w">
      <Row>
        <Title as="h2" look="h4">
          {getI18nLabel(i18n, "title", currentLang)} {currentLang === "fr" ? data.name_fr : data.name_en || data.name_fr}
        </Title>
      </Row>
      {/* Filtres */}
      <Row gutters className="fr-mb-2w">
        <Col>
          <label className="fr-label">{getI18nLabel(i18n, "searchEntity", currentLang)}</label>
          <input
            type="text"
            className="fr-input"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={getI18nLabel(i18n, "searchPlaceholder", currentLang)}
          />
        </Col>
        <Col>
          <label className="fr-label">{getI18nLabel(i18n, "filterByCountry", currentLang)}</label>
          <select className="fr-select" value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)}>
            <option value="">{getI18nLabel(i18n, "allCountries", currentLang)}</option>
            {(
              Array.from(
                new Map(
                  data.collaborations.map((item: Entity) => [
                    item.country_code,
                    { code: item.country_code, name_fr: item.country_name_fr, name_en: item.country_name_en },
                  ]),
                ).values(),
              ) as Array<{ code: string; name_fr: string; name_en: string }>
            )
              .sort((a, b) => (currentLang === "fr" ? a.name_fr : a.name_en).localeCompare(currentLang === "fr" ? b.name_fr : b.name_en))
              .map((country) => (
                <option key={country.code} value={country.code}>
                  {currentLang === "fr" ? country.name_fr : country.name_en}
                </option>
              ))}
          </select>
        </Col>
      </Row>
      <Row>
        <Col>
          <div className="fr-table fr-table--sm fr-table--no-caption fr-pt-0">
            <div className="fr-table__wrapper">
              <div className="fr-table__container">
                <div className="fr-table__content">
                  <table className="fr-table--layout-fixed">
                    <thead>
                      <tr>
                        <th>
                          <Button variant="text" onClick={() => handleSort("entities_name")}>
                            {getI18nLabel(i18n, "entities", currentLang)} {sortColumn === "entities_name" && (sortDirection === "asc" ? "↑" : "↓")}
                          </Button>
                        </th>
                        <th>
                          <Button variant="text" onClick={() => handleSort("total_collaborations")}>
                            {getI18nLabel(i18n, "collaborationsCount", currentLang)}{" "}
                            {sortColumn === "total_collaborations" && (sortDirection === "asc" ? "↑" : "↓")}
                          </Button>
                        </th>
                        <th>
                          <Button variant="text" onClick={() => handleSort("total_projects")}>
                            {getI18nLabel(i18n, "totalProjectsCount", currentLang)}{" "}
                            {sortColumn === "total_projects" && (sortDirection === "asc" ? "↑" : "↓")}
                          </Button>
                        </th>
                        <th>
                          <Button variant="text" onClick={() => handleSort("ratio")}>
                            {getI18nLabel(i18n, "ratio", currentLang)} {sortColumn === "ratio" && (sortDirection === "asc" ? "↑" : "↓")}
                          </Button>
                        </th>
                        <th>{getI18nLabel(i18n, "list", currentLang)}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedData.map((item) => (
                        <tr key={item._id}>
                          <td className="fr-p-1w">{`${getFlagEmoji(item.country_code)} ${item.entities_name}`}</td>
                          <td className="fr-p-1w text-center">{item.projects.length.toLocaleString(currentLang)}</td>
                          <td className="fr-p-1w text-center">{item.total_projects.toLocaleString(currentLang)}</td>
                          <td className="fr-p-1w text-center">
                            {item.total_projects > 0 ? `${((item.projects.length / item.total_projects) * 100).toFixed(1)}%` : "-"}
                          </td>
                          <td className="fr-p-1w">
                            <Button
                              icon="eye-line"
                              size="sm"
                              onClick={() => {
                                setSelectedEntity(item);
                                setIsModalOpen(true);
                              }}
                              variant="text"
                            />
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td className="fr-text--sm text-right">
                          <strong>
                            <i>Total</i>
                          </strong>
                        </td>
                        <td className="text-center">
                          <strong>
                            <i>{sortedData.reduce((acc, item) => acc + item.projects.length, 0).toLocaleString()}</i>
                          </strong>
                        </td>
                        <td className="text-center">
                          <strong>
                            <i>{sortedData.reduce((acc, item) => acc + item.total_projects, 0).toLocaleString()}</i>
                          </strong>
                        </td>
                        <td />
                        <td />
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {sortedData.length > 20 && (
            <Button onClick={() => setShowAll(!showAll)} size="sm">
              {showAll ? getI18nLabel(i18n, "showLess", currentLang) : getI18nLabel(i18n, "showAll", currentLang)}
            </Button>
          )}
        </Col>
      </Row>
      {/* Modale des projets */}
      <Modal isOpen={isModalOpen} hide={() => setIsModalOpen(false)} size="xl">
        <ModalContent>
          {selectedEntity && (
            <>
              <div className="entities-modal__header">
                <Title
                  as="h2"
                  className="entities-modal__title"
                >{`${selectedEntity.entities_name} ${getFlagEmoji(selectedEntity.country_code)}`}</Title>
                <div className="entities-modal__header-count">
                  {selectedEntity.projects.length}{" "}
                  {selectedEntity.projects.length > 1
                    ? getI18nLabel(i18n, "collaborations", currentLang)
                    : getI18nLabel(i18n, "collaboration", currentLang)}
                </div>
                <Button
                  className="fr-mt-2w"
                  icon="download-line"
                  size="sm"
                  variant="secondary"
                  onClick={() => downloadCSV(selectedEntity.projects, `${selectedEntity.entities_name}_all_projects.csv`)}
                >
                  {getI18nLabel(i18n, "downloadAllProjects", currentLang)}
                </Button>
              </div>

              {/* Grouper les projets par rôle */}
              {Object.entries(
                selectedEntity.projects.reduce(
                  (acc, project) => {
                    if (!acc[project.role]) acc[project.role] = [];
                    acc[project.role].push(project);
                    return acc;
                  },
                  {} as Record<string, typeof selectedEntity.projects>,
                ),
              ).map(([role, projects]) => (
                <div
                  key={role}
                  className={`entities-modal__role-card ${role.toLowerCase() === "coordinator" ? "entities-modal__role-card--coordinator" : ""}`}
                >
                  <div className="entities-modal__role-header">
                    <span
                      className={`entities-modal__role-badge ${role.toLowerCase() === "coordinator" ? "entities-modal__role-badge--coordinator" : ""}`}
                    >
                      {role}
                    </span>
                    <span className="entities-modal__role-count">
                      {projects.length}{" "}
                      {projects.length > 1 ? getI18nLabel(i18n, "projects", currentLang) : getI18nLabel(i18n, "project", currentLang)}
                    </span>
                    <Button
                      icon="download-line"
                      size="sm"
                      variant="text"
                      onClick={() => downloadCSV(projects, `${selectedEntity.entities_name}_${role}_projects.csv`)}
                      title={`${getI18nLabel(i18n, "downloadProjects", currentLang)} ${role}`}
                    />
                  </div>
                  <div className="entities-modal__tags">
                    {projects.map((project) => (
                      <Tag
                        key={project.project_id}
                        as="a"
                        href={`https://cordis.europa.eu/project/${project.project_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        color={role.toLowerCase() === "coordinator" ? "green-emeraude" : "purple-glycine"}
                      >
                        {project.project_id}
                      </Tag>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </ModalContent>
      </Modal>
    </Container>
  );
}
