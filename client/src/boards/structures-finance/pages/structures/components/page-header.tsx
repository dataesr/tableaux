import { Row, Col, Title, Text, Button, Tag } from "@dataesr/dsfr-plus";
import "../styles.scss";
import { capitalize } from "../../../../../utils/format";

interface PageHeaderProps {
  data: any;
  onClose: () => void;
}

export default function PageHeader({ data, onClose }: PageHeaderProps) {
  if (!data) return null;

  const hasCursus =
    data.has_effectif_l || data.has_effectif_m || data.has_effectif_d;
  const hasFilieres =
    data.has_effectif_iut || data.has_effectif_sante || data.has_effectif_ing;
  const hasDisciplines =
    data.has_effectif_dsa ||
    data.has_effectif_llsh ||
    data.has_effectif_theo ||
    data.has_effectif_si ||
    data.has_effectif_staps ||
    data.has_effectif_veto ||
    data.has_effectif_sante_disc ||
    data.has_effectif_interd;

  const hasFormations = hasCursus || hasFilieres || hasDisciplines;

  const showActuelName =
    data.etablissement_actuel_lib &&
    data.etablissement_lib &&
    data.etablissement_lib !== data.etablissement_actuel_lib;

  return (
    <header className="page-header fr-mb-4w">
      <Row gutters className="fr-grid-row--middle fr-mb-2w">
        <Col xs="12" md="8">
          <Title as="h1" look="h4" className="fr-mb-0">
            {data.etablissement_lib || data.etablissement_actuel_lib}
          </Title>
          <Text size="xs" className="fr-mb-0 fr-text-mention--grey">
            {[
              data.etablissement_actuel_categorie,
              data.catjur_lib,
              data.gdetab_lib,
            ]
              .filter(Boolean)
              .join(" · ")}
          </Text>
          {showActuelName && (
            <Text size="sm" className="fr-mb-0 fr-text-mention--grey">
              Actuellement : {data.etablissement_actuel_lib}
            </Text>
          )}
        </Col>
        <Col xs="12" md="4" style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            variant="tertiary"
            icon="arrow-go-back-line"
            iconPosition="left"
            onClick={onClose}
          >
            Changer d'établissement
          </Button>
        </Col>
      </Row>

      <Row gutters>
        <Col xs="12" md={hasFormations ? "8" : "12"}>
          <ul className="page-header__stats-list">
            {data.effectif_sans_cpge && (
              <li>
                <div className="fr-card fr-card--shadow fr-px-3v fr-py-2w page-header__stat-card">
                  <div className="page-header__stat-card-content">
                    <span
                      className="page-header__stat-icon page-header__stat-icon--pink-tuile"
                      aria-hidden="true"
                    >
                      <span className="fr-icon-team-fill" aria-hidden="true" />
                    </span>
                    <div>
                      <Text size="lg" bold className="fr-mb-0">
                        {data.effectif_sans_cpge.toLocaleString("fr-FR")}{" "}
                        étudiants inscrits en {data.anuniv}
                      </Text>
                      <Text size="xs" className="fr-mb-0 fr-text-mention--grey">
                        dont {data.part_effectif_sans_cpge_dn?.toFixed(1)} %
                        dans les diplômes nationaux
                      </Text>
                    </div>
                  </div>
                </div>
              </li>
            )}

            <li>
              <div className="fr-card fr-card--shadow fr-px-3v fr-py-2w page-header__stat-card">
                <div className="page-header__stat-card-content">
                  <span
                    className="page-header__stat-icon page-header__stat-icon--green-emeraude"
                    aria-hidden="true"
                  >
                    <span
                      className="fr-icon-map-pin-2-fill"
                      aria-hidden="true"
                    />
                  </span>
                  <div>
                    <Text size="lg" bold className="fr-mb-0">
                      {data.commune}
                    </Text>
                    <Text size="xs" className="fr-mb-0 fr-text-mention--grey">
                      {data.region}
                    </Text>
                  </div>
                </div>
              </div>
            </li>

            {data.nb_sites && (
              <li>
                <div className="fr-card fr-card--shadow fr-px-3v fr-py-2w page-header__stat-card">
                  <div className="page-header__stat-card-content">
                    <span
                      className="page-header__stat-icon page-header__stat-icon--yellow-tournesol"
                      aria-hidden="true"
                    >
                      <span
                        className="fr-icon-building-fill"
                        aria-hidden="true"
                      />
                    </span>
                    <div>
                      <Text size="lg" bold className="fr-mb-0">
                        {data.nb_sites}
                      </Text>
                      <Text size="xs" className="fr-mb-0 fr-text-mention--grey">
                        {data.nb_sites > 1 ? "Implantations" : "Implantation"}
                      </Text>
                    </div>
                  </div>
                </div>
              </li>
            )}

            {data.tutelle_lib && (
              <li>
                <div className="fr-card fr-card--shadow fr-px-3v fr-py-2w page-header__stat-card">
                  <div className="page-header__stat-card-content">
                    <span
                      className="page-header__stat-icon page-header__stat-icon--yellow-tournesol"
                      aria-hidden="true"
                    >
                      <span
                        className="fr-icon-government-fill"
                        aria-hidden="true"
                      />
                    </span>
                    <div>
                      <Text size="lg" bold className="fr-mb-0">
                        {data.tutelle_nb > 1 ? "Tutelles" : "Tutelle"}
                      </Text>
                      <Text size="xs" className="fr-mb-0 fr-text-mention--grey">
                        {capitalize(data.tutelle_lib)}
                        <br />
                        {data.regime_lib ? `${data.regime_lib}` : ""}
                      </Text>
                      {data.etablissement_id_paysage === "u79ZJ" && (
                        <Text
                          size="xs"
                          className="fr-mb-0 fr-text-mention--grey"
                          style={{ fontStyle: "italic" }}
                        >
                          La Fondation nationale des sciences politiques (FNSP)
                          assure la gestion administrative et financière de
                          l'institut
                        </Text>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            )}
            <li>
              <div className="fr-card fr-card--shadow fr-px-3v fr-py-2w page-header__stat-card">
                <div className="page-header__stat-card-content">
                  <span
                    className="page-header__stat-icon page-header__stat-icon--blue-france"
                    aria-hidden="true"
                  >
                    <span className="fr-icon-bank-fill" aria-hidden="true" />
                  </span>
                  <div>
                    <Text size="lg" bold className="fr-mb-0">
                      {data.is_rce ? `RCE depuis ${data.rce}` : "Non RCE"}
                    </Text>
                    <Text size="xs" className="fr-mb-0 fr-text-mention--grey">
                      Responsabilités et compétences élargies
                    </Text>
                  </div>
                </div>
              </div>
            </li>

            <li>
              <div className="fr-card fr-card--shadow fr-px-3v fr-py-2w page-header__stat-card">
                <div className="page-header__stat-card-content">
                  <span
                    className="page-header__stat-icon page-header__stat-icon--purple-glycine"
                    aria-hidden="true"
                  >
                    <span className="fr-icon-home-4-fill" aria-hidden="true" />
                  </span>
                  <div>
                    <Text size="lg" bold className="fr-mb-0">
                      {data.is_devimmo
                        ? "Dévolution du patrimoine immobilier"
                        : "Pas de dévolution immobilière"}
                    </Text>
                    <Text size="xs" className="fr-mb-0 fr-text-mention--grey">
                      {data.is_devimmo
                        ? data.devimmo_end
                          ? `De ${data.devimmo_start} à ${data.devimmo_end}`
                          : `Depuis ${data.devimmo_start}`
                        : " "}
                    </Text>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </Col>

        {hasFormations && (
          <Col xs="12" md="4">
            <div className="page-header__formations-column">
              {hasCursus && (
                <div className="page-header__formations-group fr-mb-3w">
                  <Text bold className="fr-text-mention--grey fr-mb-1v" id="page-header-cursus">
                    Cursus
                  </Text>
                  <ul className="page-header__tag-list" aria-labelledby="page-header-cursus">
                    {data.has_effectif_l && (
                      <li>
                        <Tag size="sm">Licence</Tag>
                      </li>
                    )}
                    {data.has_effectif_m && (
                      <li>
                        <Tag size="sm">Master</Tag>
                      </li>
                    )}
                    {data.has_effectif_d && (
                      <li>
                        <Tag size="sm">Doctorat</Tag>
                      </li>
                    )}
                  </ul>
                </div>
              )}
              {hasFilieres && (
                <div className="page-header__formations-group fr-mb-3w">
                  <Text bold className="fr-text-mention--grey fr-mb-1v" id="page-header-filieres">
                    Filières spécifiques
                  </Text>
                  <ul className="page-header__tag-list" aria-labelledby="page-header-filieres">
                    {data.has_effectif_iut && (
                      <li>
                        <Tag size="sm">IUT</Tag>
                      </li>
                    )}
                    {data.has_effectif_ing && (
                      <li>
                        <Tag size="sm">Ingénieur</Tag>
                      </li>
                    )}
                    {data.has_effectif_sante && (
                      <li>
                        <Tag size="sm">Santé</Tag>
                      </li>
                    )}
                  </ul>
                </div>
              )}
              {hasDisciplines && (
                <div className="page-header__formations-group">
                  <Text bold className="fr-text-mention--grey fr-mb-1v" id="page-header-disciplines">
                    Disciplines
                  </Text>
                  <ul className="page-header__tag-list" aria-labelledby="page-header-disciplines">
                    {data.has_effectif_dsa && (
                      <li>
                        <Tag size="sm">Droit Éco</Tag>
                      </li>
                    )}
                    {data.has_effectif_llsh && (
                      <li>
                        <Tag size="sm">Lettres SHS</Tag>
                      </li>
                    )}
                    {data.has_effectif_si && (
                      <li>
                        <Tag size="sm">Sciences</Tag>
                      </li>
                    )}
                    {data.has_effectif_staps && (
                      <li>
                        <Tag size="sm">STAPS</Tag>
                      </li>
                    )}
                    {data.has_effectif_theo && (
                      <li>
                        <Tag size="sm">Théologie</Tag>
                      </li>
                    )}
                    {data.has_effectif_veto && (
                      <li>
                        <Tag size="sm">Vétérinaire</Tag>
                      </li>
                    )}
                    {(data.has_effectif_sante_disc ||
                      data.has_effectif_sante) && (
                        <li>
                          <Tag size="sm">Santé</Tag>
                        </li>
                      )}
                    {data.has_effectif_interd && (
                      <li>
                        <Tag size="sm">Pluridisciplinaire</Tag>
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </Col>
        )}
      </Row>
    </header>
  );
}
