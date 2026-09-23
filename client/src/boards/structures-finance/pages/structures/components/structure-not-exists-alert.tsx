import { Container, Row, Col } from "@dataesr/dsfr-plus";
import { useSearchParams } from "react-router-dom";
import CardSimple from "../../../../../components/card-simple";
import navigationConfig from "../../../components/layouts/navigation-config.json";
import Breadcrumb from "../../../../../components/breadcrumb";

interface StructureNotExistsAlertProps {
  etablissementLibHistorique: string;
  etablissementActuel: {
    etablissement_id_paysage: string;
    etablissement_lib: string;
    etablissement_actuel_lib: string;
  };
  selectedYear: string;
}

export default function StructureNotExistsAlert({
  etablissementLibHistorique,
  etablissementActuel,
  selectedYear,
}: StructureNotExistsAlertProps) {
  const [searchParams, setSearchParams] = useSearchParams();

  const handleSwitchToCurrentStructure = () => {
    const next = new URLSearchParams(searchParams);
    next.set("structureId", etablissementActuel.etablissement_id_paysage);
    next.delete("useHistorical");
    setSearchParams(next);
  };

  return (
    <main>
      <Container fluid className="etablissement-selector__wrapper">
        <Container as="section">
          <Row>
            <Col>
              <Breadcrumb config={{
                  ...navigationConfig,
                  etablissements: { ...navigationConfig.etablissements, label: { fr: "Établissement introuvable" } },
                }} />
            </Col>
          </Row>
        </Container>
        <Container className="fr-py-6w">
          <Row>
            <Col>
              <div className="fr-alert fr-alert--warning">
                <p>
                  L'établissement <strong>{etablissementLibHistorique}</strong>{" "}
                  n'existe pas pour l'année <strong>{selectedYear}</strong>.
                </p>
              </div>
            </Col>
          </Row>
          <Row className="fr-mt-3w">
            <Col xs="12" md="6">
              <CardSimple
                onClick={handleSwitchToCurrentStructure}
                title={
                  etablissementActuel.etablissement_actuel_lib ||
                  etablissementActuel.etablissement_lib
                }
              />
            </Col>
          </Row>
        </Container>
      </Container>
    </main>
  );
}
