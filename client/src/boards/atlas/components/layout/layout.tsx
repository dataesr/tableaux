import { Button, FastAccess, Header, Logo, Service } from "@dataesr/dsfr-plus";
import { useEffect } from "react";
import { Outlet, useSearchParams } from "react-router-dom";

import Footer from "../../../../components/footer";
import SwitchTheme from "../../../../components/switch-theme";

export function Layout({ languageSelector = false }) {
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (!searchParams.get('language') && languageSelector) {
      searchParams.set("language", "FR"); // default value
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams, languageSelector]);

  const handleChange = (e) => {
    searchParams.set("language", e.target.value);
    setSearchParams(searchParams);
  }

  // TODO: Add file for external translations
  return (
    <>
      <Header>
        <Logo text={import.meta.env.VITE_MINISTER_NAME} />
        <Service name="Atlas des effectifs étudiants" />
        <FastAccess>
          <Button
            as="a"
            href="https://data.enseignementsup-recherche.gouv.fr/explore/assets/fr-esr-atlas_regional-effectifs-d-etudiants-inscrits_agregeables/"
            icon="code-s-slash-line"
            rel="noreferer noopener"
            size="sm"
            target="_blank"
            variant="text"
          >
            {searchParams.get("language") === "EN" ? "Dataset" : "Jeu de données"}
          </Button>
          <Button aria-controls="fr-theme-modal" className="fr-btn fr-icon-theme-fill" data-fr-opened="false">
            {searchParams.get("language") === "EN" ? "Themes" : "Changer de thème"}
          </Button>
          {languageSelector && (
            <select className="fr-select fr-p-0 fr-pl-1w" style={{ height: "25px", width: "55px" }} onChange={handleChange}>
              <option selected={searchParams.get("language") === "FR"} value="FR">
                Fr
              </option>
              <option selected={searchParams.get("language") === "EN"} value="EN">
                En
              </option>
            </select>
          )}
        </FastAccess>
      </Header>
      <Outlet />
      <Footer />
      <SwitchTheme />
    </>
  );
}
