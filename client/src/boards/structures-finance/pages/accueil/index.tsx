import { useNavigate } from "react-router-dom";
import { Row, Col, Container, Title } from "@dataesr/dsfr-plus";
import { useMemo, useState } from "react";
import { useFinanceYears } from "../../api";
import { useFinanceEtablissements } from "./api";
import Select from "../../../../components/select";
import "./styles.scss";
import { normalizeString } from "../../utils/utils";
import { DEFAULT_REFERENCE_YEAR } from "../../config/constants";

function HeroSection() {
  const navigate = useNavigate();

  return (
    <section className="accueil-hero">
      <Container>
        <Row>
          <Col xs="12" lg="6">
            <div className="accueil-hero__text">
              <p className="accueil-hero__label">FINANCES DES ÉTABLISSEMENTS</p>
              <Title as="h1" look="h1" className="accueil-hero__title">
                Explorez les données financières de l'enseignement supérieur
              </Title>
              <p className="accueil-hero__description">
                Consultez et analysez les données financières des universités et
                établissements d'enseignement supérieur français. Visualisez les
                tendances nationales et les indicateurs clés.
              </p>
              <div className="accueil-hero__cta">
                <button
                  className="fr-btn fr-btn--icon-right fr-icon-arrow-right-line"
                  onClick={() => navigate("/structures-finance/etablissements")}
                >
                  Explorer un établissement
                </button>
                <button
                  className="fr-btn fr-btn--icon-right fr-icon-arrow-right-line"
                  onClick={() => navigate("/structures-finance/national")}
                >
                  Explorer la vue nationale
                </button>
              </div>
            </div>
          </Col>
          <Col xs="12" lg="6">
            <div className="accueil-hero__illustration">
              <img
                src="/src/assets/boards/structures-finance.svg"
                alt=""
                aria-hidden="true"
              />
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

function QuickAccessSection() {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState("");
  const { data: yearsData } = useFinanceYears();
  const latestYear = (yearsData?.years || [])[0] || DEFAULT_REFERENCE_YEAR;
  const { data: etablissementsData } = useFinanceEtablissements(
    String(latestYear)
  );

  const etablissementOptions = useMemo(() => {
    if (!etablissementsData || !Array.isArray(etablissementsData)) return [];

    return etablissementsData
      .map((etab: any) => {
        const displayName = etab.nom || "";
        const searchText = normalizeString(
          [displayName, etab.champ_recherche, etab.type, etab.region]
            .filter(Boolean)
            .join(" ")
        );

        return {
          id: etab.id,
          label: `${displayName}${etab.region ? ` — ${etab.region}` : ""}`,
          searchableText: searchText,
          subtitle: etab.type,
        };
      })
      .sort((a, b) => {
        return a.label.localeCompare(b.label, "fr", { sensitivity: "base" });
      });
  }, [etablissementsData]);

  const handleEtablissementSelect = (etablissementId?: string) => {
    if (etablissementId) {
      navigate(
        `/structures-finance/etablissements?year=${DEFAULT_REFERENCE_YEAR}&type=tous&region=toutes&structureId=${etablissementId}`
      );
      setSearchValue("");
    }
  };

  return (
    <section className="accueil-section accueil-section--alt">
      <Container>
        <Row>
          <Col xs="12" lg="8" offsetLg="2">
            <div className="accueil-quick-access">
              <Title as="h2" look="h5" className="accueil-section__title">
                Accès rapide
              </Title>
              <p className="accueil-section__description">
                Accédez directement aux données financières détaillées d’un
                établissement
              </p>
              <div className="accueil-quick-access__search">
                <Select
                  label="Rechercher un établissement..."
                  icon="search-line"
                  size="md"
                  fullWidth
                >
                  <Select.Search
                    placeholder="Rechercher un établissement..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                  <Select.Content maxHeight="300px">
                    {etablissementOptions
                      .filter((opt) =>
                        searchValue
                          ? opt.searchableText.includes(
                            normalizeString(searchValue)
                          )
                          : true
                      )
                      .map((opt) => (
                        <Select.Option
                          key={opt.id}
                          value={opt.id}
                          onClick={() => handleEtablissementSelect(opt.id)}
                        >
                          {opt.label}
                        </Select.Option>
                      ))}
                    {etablissementOptions.filter((opt) =>
                      searchValue
                        ? opt.searchableText.includes(
                          normalizeString(searchValue)
                        )
                        : true
                    ).length === 0 && (
                        <Select.Empty>Aucun établissement trouvé</Select.Empty>
                      )}
                  </Select.Content>
                </Select>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

export default function AccueilView() {
  return (
    <div className="accueil-page">
      <HeroSection />
      <QuickAccessSection />
    </div>
  );
}
