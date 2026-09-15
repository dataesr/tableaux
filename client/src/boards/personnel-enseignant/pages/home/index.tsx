import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Row, Col, Container, Title } from "@dataesr/dsfr-plus";
import { useFacultyFilters, useFacultyYears } from "../structures/api";
import FranceMap from "../structures/components/france-map";
import mediaFacultyMembers from "../../../../assets/boards/faculty-members.svg";
import "./styles.scss";

function HeroSection() {
  const navigate = useNavigate();

  const { data: structuresData } = useFacultyFilters("structure");

  const etablissementOptions = useMemo(() => {
    if (!structuresData?.items) return [];
    const seen = new Set<string>();
    return structuresData.items
      .filter((s: any) => {
        if (!s.id || !s.label || seen.has(s.id)) return false;
        seen.add(s.id);
        return true;
      })
      .sort((a: any, b: any) => a.label.localeCompare(b.label, "fr", { sensitivity: "base" }))
      .map((s: any) => ({ id: s.id, label: s.label }));
  }, [structuresData]);

  const handleSelect = (id: string) => {
    navigate(`/personnel-enseignant/etablissements?structureId=${encodeURIComponent(id)}&section=enseignants-chercheurs`);
  };

  return (
    <section className="fm-accueil-hero">
      <Container>
        <Row gutters className="fr-mb-3w">
          <Col xs="12" lg="6">
            <div className="fm-accueil-hero__text">
              <p className="fm-accueil-hero__label">LE PERSONNEL ENSEIGNANT</p>
              <Title as="h1" look="h1" className="fm-accueil-hero__title">
                Explorez les données du personnel enseignant
              </Title>
              <p className="fm-accueil-hero__description">
                Consultez et analysez les données du personnel enseignant des universités et
                établissements d'enseignement supérieur français. Visualisez les
                tendances nationales et les indicateurs clés.
              </p>
            </div>
          </Col>
          <Col xs="12" lg="6">
            <div className="fm-accueil-hero__illustration">
              <img
                src={mediaFacultyMembers}
                alt=""
                aria-hidden="true"
              />
            </div>
          </Col>
        </Row>
        <Row gutters>
          <Col xs="12" lg="6">
            <div className="fr-select-group">
              <select
                className="fr-select"
                id="fm-accueil-etablissement"
                name="etablissement"
                value=""
                onChange={(e) => handleSelect(e.target.value)}
              >
                <option value="" disabled>
                  Sélectionner un établissement
                </option>
                {etablissementOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </Col>
          <Col xs="12" lg="6">
            <div className="fm-accueil-hero__cta">
              <button
                className="fr-btn fr-btn--icon-right fr-icon-arrow-right-line"
                onClick={() => navigate("/personnel-enseignant/disciplines")}
              >
                Par discipline
              </button>
              <button
                className="fr-btn fr-btn--icon-right fr-icon-arrow-right-line"
                onClick={() => navigate("/personnel-enseignant/regions")}
              >
                Par région
              </button>
              <button
                className="fr-btn fr-btn--icon-right fr-icon-arrow-right-line"
                onClick={() => navigate("/personnel-enseignant/academies")}
              >
                Par académie
              </button>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

// =============================================================================
// MAP SECTION
// =============================================================================
function MapSection() {
  const navigate = useNavigate();
  const { data: yearsData } = useFacultyYears("region", undefined);
  const years: string[] = yearsData?.years || [];
  const latestYear = years.length > 0 ? years[years.length - 1] : "";

  const handleRegionClick = (geo_id: string) => {
    navigate(`/personnel-enseignant/regions?geo_id=${encodeURIComponent(geo_id)}&section=enseignants-chercheurs`);
  };

  if (!latestYear) return null;

  return (
    <section className="fm-accueil-section fm-accueil-section--default">
      <Container>
        <Title as="h2" look="h5" className="fm-accueil-section__title">
          Répartition nationale
        </Title>
        <p className="fm-accueil-section__description">
          Cliquez sur une région — sur la carte ou dans la liste — pour explorer ses données en détail
        </p>
        <FranceMap
          year={latestYear}
          onRegionClick={handleRegionClick}
          title={`Répartition des enseignants par région (${latestYear})`}
          asideList
        />
      </Container>
    </section>
  );
}

export default function Home() {
  return (
    <div className="fm-accueil-page">
      <HeroSection />
      <MapSection />
    </div>
  );
}
