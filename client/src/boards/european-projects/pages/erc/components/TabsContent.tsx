import { useSearchParams } from "react-router-dom";

import i18n from "../../../i18n-global.json";
import CallsContent from "./tabs/CallsContent";
import EntitiesContent from "./tabs/EntitiesContent";
import EvolutionContent from "./tabs/EvolutionContent";
import PiContent from "./tabs/PiContent";
import PositionnementContent from "./tabs/PositionnementContent";
import SyntheseContent from "./tabs/SyntheseContent";

export default function TabsContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("section") || "synthesis";

  const currentLang = searchParams.get("language") || "fr";

  function getIntlLabel(key: string): string {
    return i18n[key][currentLang as "fr" | "en"] || i18n[key]["en"];
  }

  // Fonction pour changer d'onglet
  const handleTabChange = (newTab: "synthesis" | "positioning" | "evolution" | "entities" | "pi" | "calls") => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("section", newTab);
    setSearchParams(newParams);
  };

  return (
    <div>
      <nav className="fr-nav" role="navigation" aria-label="Menu principal">
        <ul className="fr-nav__list">
          <li className="fr-nav__item">
            <button
              className="fr-nav__link"
              onClick={(e) => {
                e.preventDefault();
                handleTabChange("synthesis");
              }}
              aria-current={activeTab === "synthesis" ? "page" : undefined}
            >
              {getIntlLabel("synthesis")}
            </button>
          </li>
          <li className="fr-nav__item">
            <button
              className="fr-nav__link"
              onClick={(e) => {
                e.preventDefault();
                handleTabChange("positioning");
              }}
              aria-current={activeTab === "positioning" ? "page" : undefined}
            >
              {getIntlLabel("positioning")}
            </button>
          </li>
          <li className="fr-nav__item">
            <button
              className="fr-nav__link"
              onClick={(e) => {
                e.preventDefault();
                handleTabChange("entities");
              }}
              aria-current={activeTab === "entities" ? "page" : undefined}
            >
              {getIntlLabel("entities")}
            </button>
          </li>
          <li className="fr-nav__item">
            <button
              className="fr-nav__link"
              onClick={(e) => {
                e.preventDefault();
                handleTabChange("pi");
              }}
              aria-current={activeTab === "pi" ? "page" : undefined}
            >
              {getIntlLabel("pi")}
            </button>
          </li>
          <li className="fr-nav__item">
            <button
              className="fr-nav__link"
              onClick={(e) => {
                e.preventDefault();
                handleTabChange("evolution");
              }}
              aria-current={activeTab === "evolution" ? "page" : undefined}
            >
              {getIntlLabel("evolution")}
            </button>
          </li>
          <li className="fr-nav__item">
            <button
              className="fr-nav__link"
              onClick={(e) => {
                e.preventDefault();
                handleTabChange("calls");
              }}
              aria-current={activeTab === "calls" ? "page" : undefined}
            >
              {getIntlLabel("calls")}
            </button>
          </li>
        </ul>
      </nav>
      <div className="fr-mt-3w">
        {activeTab === "synthesis" && <SyntheseContent />}
        {activeTab === "positioning" && <PositionnementContent />}
        {activeTab === "entities" && <EntitiesContent />}
        {activeTab === "pi" && <PiContent />}
        {activeTab === "evolution" && <EvolutionContent />}
        {activeTab === "calls" && <CallsContent />}
      </div>
    </div>
  );
}
