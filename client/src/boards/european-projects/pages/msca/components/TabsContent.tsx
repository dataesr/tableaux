import { useSearchParams } from "react-router-dom";

import i18n from "../../../i18n-global.json";
import SyntheseContent from "./tabs/SyntheseContent";
import PositionnementContent from "./tabs/PositionnementContent";
import EvolutionContent from "./tabs/EvolutionContent";
// import EntitiesContent from "./tabs/EntitiesContent";

export default function TabsContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("section") || "synthesis";
  const currentLang = searchParams.get("language") || "fr";

  function getIntlLabel(key: string): string {
    return i18n[key][currentLang as "fr" | "en"] || i18n[key]["en"];
  }

  const handleTabChange = (newTab: "synthesis" | "positioning" | "evolution" | "entities") => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set("section", newTab);
    setSearchParams(newParams);
  };

  return (
    <div>
      <nav className="fr-nav" role="navigation" aria-label="Menu secondaire">
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
          {/** TODO: Add entities tab */}
          {/* <li className="fr-nav__item">
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
          </li> */}
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
        </ul>
      </nav>
      <div className="fr-mt-3w">
        {activeTab === "synthesis" && <SyntheseContent />}
        {activeTab === "positioning" && <PositionnementContent />}
        {/* {activeTab === "entities" && <EntitiesContent />} */}
        {activeTab === "evolution" && <EvolutionContent />}
      </div>
    </div>
  );
}
