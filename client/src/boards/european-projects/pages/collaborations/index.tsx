import { useEffect } from "react";
import { Container } from "@dataesr/dsfr-plus";
import { useSearchParams } from "react-router-dom";

import CountriesCollaborationsBubble from "./charts/countries-collaborations-bubble";

// import i18n from "./i18n.json";
import Callout from "../../../../components/callout";
import CountriesCollaborationsTable from "./charts/countries-collaborations-table";

export default function Collaborations() {
  const [searchParams, setSearchParams] = useSearchParams();
  // const currentLang = searchParams.get("language") || "fr";

  useEffect(() => {
    if (!searchParams.get("country_code")) {
      setSearchParams({ country_code: "FRA" });
    }
  }, [searchParams, setSearchParams]);

  // function getI18nLabel(key) {
  //   return i18n[key][currentLang];
  // }
  return (
    <Container as="main" className="fr-my-6w">
      <Callout className="callout-style">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Rem dolorum impedit in nisi quibusdam, consequuntur omnis. Qui at error aliquam atque natus facilis, reiciendis alias perferendis tenetur minus quae rerum?
      </Callout>

      <CountriesCollaborationsBubble nbToShow={5} />
      <CountriesCollaborationsTable />
    </Container>
  );
}
