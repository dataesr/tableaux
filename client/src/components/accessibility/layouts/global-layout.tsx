import { Logo, Service } from "@dataesr/dsfr-plus";
import { useEffect } from "react";
import { Outlet, useSearchParams } from "react-router-dom";

import Footer from "../../../components/footer";
import { useTitle } from "../../../hooks/usePageTitle";

export default function GlobalLayout() {
  const [searchParams, setSearchParams] = useSearchParams();

  useTitle("Accessibilité");

  useEffect(() => {
    if (!searchParams.get("language")) {
      searchParams.set("language", "fr");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  return (
    <>
      <header role="banner" className="fr-header">
        <div className="fr-header__body">
          <div className="fr-container">
            <div className="fr-header__body-row">
              <div className="fr-header__brand fr-enlarge-link">
                <div className="fr-header__brand-top">
                  <Logo text={import.meta.env.VITE_MINISTER_NAME} />
                </div>
              </div>
              <div className="fr-header__service">
                <Service href="/" name="#dataESR tableaux de bord" tagline="Accessibilité" />
              </div>
            </div>
          </div>
        </div>
      </header>
      <Outlet />
      <Footer />
    </>
  );
}
