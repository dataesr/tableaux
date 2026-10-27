import { useSearchParams } from "react-router-dom";

import Tab1 from "./tabs/tab1";
import Tab2 from "./tabs/tab2";
import Tab3 from "./tabs/tab3";
import Tab4 from "./tabs/tab4";
import { getI18nLabel } from "../../../../../utils";

import i18n from "../../../i18n-global.json";

export default function TabsContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("section") || "synthesis";

  const currentLang = searchParams.get("language") || "en";

  // Fonction pour changer d'onglet
  const handleTabChange = (newTab: "tab1" | "tab2" | "tab3" | "tab4") => {
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
                handleTabChange("tab1");
              }}
              aria-current={activeTab === "tab1" ? "page" : undefined}
            >
              {getI18nLabel(i18n, "tab1", currentLang)}
            </button>
          </li>
          <li className="fr-nav__item">
            <button
              className="fr-nav__link"
              onClick={(e) => {
                e.preventDefault();
                handleTabChange("tab2");
              }}
              aria-current={activeTab === "tab2" ? "page" : undefined}
            >
              {getI18nLabel(i18n, "tab2", currentLang)}
            </button>
          </li>
          <li className="fr-nav__item">
            <button
              className="fr-nav__link"
              onClick={(e) => {
                e.preventDefault();
                handleTabChange("tab3");
              }}
              aria-current={activeTab === "tab3" ? "page" : undefined}
            >
              {getI18nLabel(i18n, "tab3", currentLang)}
            </button>
          </li>
          <li className="fr-nav__item">
            <button
              className="fr-nav__link"
              onClick={(e) => {
                e.preventDefault();
                handleTabChange("tab4");
              }}
              aria-current={activeTab === "tab4" ? "page" : undefined}
            >
              {getI18nLabel(i18n, "tab4", currentLang)}
            </button>
          </li>
        </ul>
      </nav>
      <div className="fr-mt-3w">
        {activeTab === "tab1" && <Tab1 />}
        {activeTab === "tab2" && <Tab2 />}
        {activeTab === "tab3" && <Tab3 />}
        {activeTab === "tab4" && <Tab4 />}
      </div>
    </div>
  );
}
