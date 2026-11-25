import { useSearchParams } from "react-router-dom";

import CallsContent from "./tabs/calls";
import EntitiesContent from "./tabs/entities";
import EvolutionContent from "./tabs/evolution";
import PiContent from "./tabs/pi";
import PositionnementContent from "./tabs/positioning";
import SyntheseContent from "./tabs/synthesis";
import { getI18nLabel } from "../../../../../utils";

import i18n from "../../../i18n-global.json";

export default function TabsContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const activeTab = searchParams.get("section") || "synthesis";

  // Fonction pour changer d'onglet
  const handleTabChange = (newTab: "synthesis" | "positioning" | "evolution" | "entities" | "pi" | "calls") => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("section", newTab);
    setSearchParams(newParams);
  };

  return (
    <div>
      <nav className="fr-nav" aria-label="Menu principal de sélection des sous-parties">
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
              {getI18nLabel(i18n, "synthesis", currentLang)}
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
              {getI18nLabel(i18n, "positioning", currentLang)}
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
              {getI18nLabel(i18n, "entities", currentLang)}
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
              {getI18nLabel(i18n, "pi", currentLang)}
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
              {getI18nLabel(i18n, "evolution", currentLang)}
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
              {getI18nLabel(i18n, "calls", currentLang)}
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
