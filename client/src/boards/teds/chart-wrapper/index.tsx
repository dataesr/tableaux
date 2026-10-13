import Highcharts from "highcharts/es-modules/masters/highcharts.src.js";
import HighchartsReact from "highcharts-react-official";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import SyntaxHighlighter from "react-syntax-highlighter";
import { a11yDark } from "react-syntax-highlighter/dist/esm/styles/hljs";

import { Button, Col, Container, Modal, ModalContent, ModalTitle, Radio, Row, Text, Title } from "@dataesr/dsfr-plus";
import CopyButton from "../../../components/copy-button/index.tsx";
import { getConfig } from "../utils.ts";

import "./styles.scss";

const { VITE_APP_URL } = import.meta.env;

function IntegrationModal({ isOpen, setIsOpen, graphConfig }) {
  const integrationCode = `<iframe \ntitle="${graphConfig.title}" \nwidth="800" \nheight="600" \nsrc="${VITE_APP_URL}${graphConfig.integrationURL}"></iframe>`;
  return (
    <Modal isOpen={isOpen} hide={() => setIsOpen(false)} size="lg">
      <ModalTitle>Intégrer ce graphique dans un autre site</ModalTitle>
      <ModalContent>
        <div className="text-right">
          <CopyButton text={integrationCode} />
        </div>
        <SyntaxHighlighter language="javascript" style={a11yDark}>
          {integrationCode}
        </SyntaxHighlighter>
      </ModalContent>
    </Modal>
  );
}

function MenuModal({ displayType, isOpen, setDisplayType, setIsOpen, setIsOpenIntegration }) {
  return (
    <Modal isOpen={isOpen} hide={() => setIsOpen(false)} size="sm">
      <ModalContent className="modal-actions">
        <Title as="h1" look="h6">
          <span className="fr-icon-bar-chart-box-line fr-mr-1w" aria-hidden="true" />
          Options du graphique
        </Title>

        <fieldset className="fr-fieldset" id="radio-hint">
          <legend className="fr-fieldset__legend--regular fr-fieldset__legend" id="radio-hint-legend">
            Type d'affichage
          </legend>
          <div className="fr-fieldset__element">
            <Radio
              defaultChecked={displayType === "chart"}
              id="chart-element"
              label="Graphique"
              name="chart-name"
              onClick={() => setDisplayType("chart")}
            />
          </div>
          <div className="fr-fieldset__element">
            <Radio
              defaultChecked={displayType === "data"}
              id="data-element"
              label="Données"
              name="data-name"
              onClick={() => setDisplayType("data")}
            />
          </div>
        </fieldset>
        <hr />
        <ul>
          <li>
            <Button color="beige-gris-galet" icon="file-download-line" title="téléchargement des données du graphique" variant="text" disabled>
              Télécharger les données (csv)
            </Button>
          </li>
          <li>
            <Button color="beige-gris-galet" icon="image-line" title="téléchargement de l'image" variant="text" disabled>
              Télécharger l'image (png)
            </Button>
          </li>
          <li>
            <Button color="beige-gris-galet" icon="printer-line" title="lancement de l'impression" variant="text" disabled>
              Imprimer
            </Button>
          </li>
        </ul>
        <hr />
        <Container fluid>
          <Row>
            <Col>
              <Title as="h2" look="h6">
                Partager
              </Title>
              <div className="share">
                <Button color="beige-gris-galet" icon="twitter-x-fill" title="Twitter-X" variant="text" disabled />
                <Button color="beige-gris-galet" icon="linkedin-box-fill" title="Linkedin" variant="text" disabled />
                <Button color="beige-gris-galet" icon="facebook-circle-fill" title="Facebook" variant="text" disabled />
              </div>
            </Col>
            <Col>
              <Title as="h2" look="h6">
                Intégrer
              </Title>
              <div className="share">
                <Button
                  color="beige-gris-galet"
                  icon="code-s-slash-line"
                  onClick={() => {
                    setIsOpenIntegration(true);
                    setIsOpen(false);
                  }}
                  title="Intégration"
                  variant="secondary"
                >
                  Intégrer
                </Button>
              </div>
            </Col>
          </Row>
        </Container>
      </ModalContent>
    </Modal>
  );
}

export default function ChartWrapper({ display_title, id, legend, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenIntegration, setIsOpenIntegration] = useState(false);
  const [displayType, setDisplayType] = useState("chart"); // ["chart", "data"]
  const graphConfig = getConfig(id);

  const [searchParams] = useSearchParams();
  const currentLanguage = searchParams.get("language") || "FR";

  return (
    <section>
      {graphConfig.title[currentLanguage] && !display_title && (
        <>
          <Title as="h2" look="h4" className="fr-mb-1w">
            {graphConfig.title[currentLanguage]}
          </Title>
          <Text className="sources">
            Sources :{" "}
            <a href={graphConfig.sourceURL} target="_blank" rel="noreferrer noopener">
              {graphConfig.source[currentLanguage]}
            </a>
          </Text>
        </>
      )}
      {graphConfig.subtitle && (
        <Title as={graphConfig.title ? "h3" : "h2"} look="h6" className="fr-mb-0">
          {graphConfig.subtitle[currentLanguage]}
        </Title>
      )}
      <div className="actions">
        <Button
          color="beige-gris-galet"
          icon="settings-5-line"
          onClick={() => setIsOpen(true)}
          size="sm"
          style={{ minHeight: "1rem", padding: "0 0.5rem" }}
          variant="text"
        />
      </div>
      {displayType === "data" && <pre>{JSON.stringify(options.series, null, 2)}</pre>}
      {displayType === "chart" && (
        <figure>
          <HighchartsReact highcharts={Highcharts} options={options} />
        </figure>
      )}
      <div className="graph-footer fr-pt-1w">
        {legend}
        {graphConfig.description && (
          <div className="fr-notice fr-notice--info fr-mt-1w">
            <div className="fr-container">
              <div className="fr-notice__body">
                <Text className="description">{graphConfig.description[currentLanguage]}</Text>
              </div>
            </div>
          </div>
        )}
      </div>
      <MenuModal
        displayType={displayType}
        isOpen={isOpen}
        setDisplayType={setDisplayType}
        setIsOpen={setIsOpen}
        setIsOpenIntegration={setIsOpenIntegration}
      />
      <IntegrationModal graphConfig={graphConfig} isOpen={isOpenIntegration} setIsOpen={setIsOpenIntegration} />
    </section>
  );
}
