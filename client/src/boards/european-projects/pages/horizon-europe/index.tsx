import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Container, Button, Badge, Title } from "@dataesr/dsfr-plus";
import EpNavigator from "../../components/ep-navigator/index";
import TabsContent from "./components/TabsContent";
import { getCountryInfo } from "../../../../components/country-selector/utils";

import navigationConfig from "./navigation-config.json";

import "./styles.scss";
import Breadcrumb from "../../../../components/breadcrumb";
import { getFlagEmoji } from "../../../../utils";

function FloatingFilters() {
  const [searchParams] = useSearchParams();
  // Récupération des paramètres d'url
  const allEntries = Array.from(searchParams.entries());

  // clés à ne pas afficher
  const excludedKeys = ["language", "section"];
  const currentLang = searchParams.get("language") || "fr";
  const filteredEntries = allEntries.filter(([key]) => !excludedKeys.includes(key));

  const i18n = {
    country_code: { fr: "Pays sélectionné", en: "Selected country" },
    range_of_years: { fr: "Années sélectionnées", en: "selected years" },
    pillarId: { fr: "Pilier", en: "Pilar" },
    programId: { fr: "Programme", en: "Program" },
    thematicIds: { fr: "Thématiques", en: "Thematics" },
    destinationIds: { fr: "Destinations", en: "Destinations" },
  };

  function showParam(param) {
    let ret;
    switch (param[0]) {
      case "country_code":
        const countryInfo = getCountryInfo(param[1]);
        ret = (
          <>
            <span>{i18n[param[0]][currentLang]}</span>
            <Badge>
              {countryInfo[`name_${currentLang}`]} {getFlagEmoji(countryInfo.iso2)}
            </Badge>
          </>
        );
        break;
      case "range_of_years":
        ret = (
          <>
            <span>{i18n[param[0]][currentLang]}</span>
            {param[1].split("|").map((y) => (
              <Badge color="green-archipel" className="fr-mx-1w">
                {y}
              </Badge>
            ))}
          </>
        );
        break;

      default:
        ret = (
          <>
            <span>{i18n[param[0]][currentLang]}</span>
            <Badge>{param[1]}</Badge>
          </>
        );
        break;
    }
    return <li key={param[1]}>{ret}</li>;
  }

  return (
    <div>
      <Button data-fr-opened="false" aria-controls="modal" icon="filter-fill" className="ep-filter-button" variant="secondary">
        Filtres actifs
        <Badge className="fr-ml-1w" size="sm">
          {filteredEntries.length}
        </Badge>
      </Button>
      <dialog id="modal" className="fr-modal" aria-labelledby="modal-title">
        <div className="fr-container fr-container--fluid fr-container-md">
          <div className="fr-grid-row fr-grid-row--center">
            <div className="fr-col-12 fr-col-md-8 fr-col-lg-6">
              <div className="fr-modal__body">
                <div className="fr-modal__header">
                  <button aria-controls="modal" title="Fermer" type="button" className="fr-btn--close fr-btn">
                    Fermer
                    {allEntries}
                  </button>
                </div>
                <div className="fr-modal__content">
                  <Title as="h2" id="modal-title" className="fr-modal__title">
                    <span className="fr-icon-arrow-right-line fr-icon--lg" aria-hidden="true" />
                    Filtres actifs
                  </Title>
                  <p>
                    <ul>{filteredEntries.map((param) => showParam(param))}</ul>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </dialog>
    </div>
  );
}

export default function HorizonEurope() {
  const [collapsed, setCollapsed] = useState(false);
  const isModalOpenRef = useRef(false);

  useEffect(() => {
    const modalEl = document.getElementById("modal") as HTMLDialogElement | null;

    // Observe l'ouverture/fermeture de la modale DSFR
    let observer: MutationObserver | null = null;
    if (modalEl) {
      observer = new MutationObserver(() => {
        // DSFR ajoute l'attribut "open" natif du <dialog> quand elle est visible
        isModalOpenRef.current = modalEl.hasAttribute("open");
      });
      observer.observe(modalEl, {
        attributes: true,
        attributeFilter: ["open", "data-fr-opened"],
      });
      // initialisation
      isModalOpenRef.current = modalEl.hasAttribute("open");
    }

    const handleScroll = () => {
      // On ignore le scroll tant que la modale est ouverte
      if (isModalOpenRef.current) return;
      setCollapsed(window.scrollY > 100);
    };;

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer?.disconnect();
    };
  }, []);

  return (
    <>
      <Container as="main" fluid>
        <div className={`ep-navigator-wrapper${collapsed ? " ep-navigator-wrapper--collapsed" : ""}`}>
          <Container>
            <Breadcrumb config={navigationConfig} />
            <EpNavigator />
          </Container>
        </div>
        <Container as="section">
          <TabsContent />
        </Container>
      </Container>
      <FloatingFilters />
    </>
  );
}
