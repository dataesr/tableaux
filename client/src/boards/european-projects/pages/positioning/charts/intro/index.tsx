import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { getData } from "../top-10-beneficiaries/query";
import Callout from "../../../../../../components/callout";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { getFlagEmoji } from "../../../../../../utils";

import i18n from "./i18n.json";
import { useGetParams } from "../top-10-beneficiaries/utils";

// Mapping des codes pays vers leurs noms et genres
const COUNTRY_MAPPING = {
  FRA: {
    name: { fr: "La France", en: "France" },
    gender: "feminine",
  },
  DEU: {
    name: { fr: "L'Allemagne", en: "Germany" },
    gender: "feminine",
  },
  NLD: {
    name: { fr: "Les Pays-Bas", en: "The Netherlands" },
    gender: "masculine",
  },
  ITA: {
    name: { fr: "L'Italie", en: "Italy" },
    gender: "feminine",
  },
  ESP: {
    name: { fr: "L'Espagne", en: "Spain" },
    gender: "feminine",
  },
  BEL: {
    name: { fr: "La Belgique", en: "Belgium" },
    gender: "feminine",
  },
  AUT: {
    name: { fr: "L'Autriche", en: "Austria" },
    gender: "feminine",
  },
  SWE: {
    name: { fr: "La Suède", en: "Sweden" },
    gender: "feminine",
  },
  CHE: {
    name: { fr: "La Suisse", en: "Switzerland" },
    gender: "feminine",
  },
  NOR: {
    name: { fr: "La Norvège", en: "Norway" },
    gender: "feminine",
  },
  DNK: {
    name: { fr: "Le Danemark", en: "Denmark" },
    gender: "masculine",
  },
  FIN: {
    name: { fr: "La Finlande", en: "Finland" },
    gender: "feminine",
  },
  PRT: {
    name: { fr: "Le Portugal", en: "Portugal" },
    gender: "masculine",
  },
  POL: {
    name: { fr: "La Pologne", en: "Poland" },
    gender: "feminine",
  },
  GRC: {
    name: { fr: "La Grèce", en: "Greece" },
    gender: "feminine",
  },
  CZE: {
    name: { fr: "La République tchèque", en: "Czech Republic" },
    gender: "feminine",
  },
  HUN: {
    name: { fr: "La Hongrie", en: "Hungary" },
    gender: "feminine",
  },
  IRL: {
    name: { fr: "L'Irlande", en: "Ireland" },
    gender: "feminine",
  },
  SVN: {
    name: { fr: "La Slovénie", en: "Slovenia" },
    gender: "feminine",
  },
  SVK: {
    name: { fr: "La Slovaquie", en: "Slovakia" },
    gender: "feminine",
  },
  HRV: {
    name: { fr: "La Croatie", en: "Croatia" },
    gender: "feminine",
  },
  BGR: {
    name: { fr: "La Bulgarie", en: "Bulgaria" },
    gender: "feminine",
  },
  ROU: {
    name: { fr: "La Roumanie", en: "Romania" },
    gender: "feminine",
  },
  EST: {
    name: { fr: "L'Estonie", en: "Estonia" },
    gender: "feminine",
  },
  LVA: {
    name: { fr: "La Lettonie", en: "Latvia" },
    gender: "feminine",
  },
  LTU: {
    name: { fr: "La Lituanie", en: "Lithuania" },
    gender: "feminine",
  },
  LUX: {
    name: { fr: "Le Luxembourg", en: "Luxembourg" },
    gender: "masculine",
  },
  MLT: {
    name: { fr: "Malte", en: "Malta" },
    gender: "feminine",
  },
  CYP: {
    name: { fr: "Chypre", en: "Cyprus" },
    gender: "feminine",
  },
  GBR: {
    name: { fr: "Le Royaume-Uni", en: "United Kingdom" },
    gender: "masculine",
  },
  ISL: {
    name: { fr: "L'Islande", en: "Iceland" },
    gender: "feminine",
  },
  TUR: {
    name: { fr: "La Turquie", en: "Turkey" },
    gender: "feminine",
  },
  ISR: {
    name: { fr: "Israël", en: "Israel" },
    gender: "masculine",
  },
  UKR: {
    name: { fr: "L'Ukraine", en: "Ukraine" },
    gender: "feminine",
  },
};

export default function Intro() {
  const [searchParams] = useSearchParams();
  const params = useGetParams();
  const currentLang = searchParams.get("language") || "fr";
  const selectedCountryCode = searchParams.get("country_code") || "FRA";

  const { data, isLoading } = useQuery({
    queryKey: ["Top10Beneficiaries", params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <DefaultSkeleton height="200px" />;

  const top10 = data.top10.sort((a, b) => b.total_fund_eur - a.total_fund_eur).slice(0, 10);

  // Trouver la position du pays sélectionné dans le classement complet
  const allCountries = data.top10.sort((a, b) => b.total_fund_eur - a.total_fund_eur);

  const selectedCountryIndex = allCountries.findIndex(
    (country) =>
      country.country_code === selectedCountryCode ||
      country.country_id === selectedCountryCode ||
      country.iso3 === selectedCountryCode ||
      country.code === selectedCountryCode ||
      country._id?.country_code === selectedCountryCode ||
      country.id === selectedCountryCode
  );
  const selectedCountryPosition = selectedCountryIndex !== -1 ? selectedCountryIndex + 1 : null;

  function getI18nLabel(key) {
    return i18n[key][currentLang];
  }

  function getPositionText(position) {
    const positionKey = position?.toString();
    const positions = i18n.ranking_position[currentLang];

    if (positions[positionKey]) {
      return positions[positionKey];
    }
    return positions.default.replace("{position}", position);
  }

  // Mapping ISO3 vers ISO2 pour les drapeaux
  const getISO2FromISO3 = (iso3) => {
    const mapping = {
      FRA: "FR",
      DEU: "DE",
      NLD: "NL",
      ITA: "IT",
      ESP: "ES",
      BEL: "BE",
      AUT: "AT",
      SWE: "SE",
      CHE: "CH",
      NOR: "NO",
      DNK: "DK",
      FIN: "FI",
      PRT: "PT",
      POL: "PL",
      GRC: "GR",
      CZE: "CZ",
      HUN: "HU",
      IRL: "IE",
      SVN: "SI",
      SVK: "SK",
      HRV: "HR",
      BGR: "BG",
      ROU: "RO",
      EST: "EE",
      LVA: "LV",
      LTU: "LT",
      LUX: "LU",
      MLT: "MT",
      CYP: "CY",
      GBR: "GB",
      ISL: "IS",
      TUR: "TR",
      ISR: "IL",
      UKR: "UA",
    };
    return mapping[iso3] || iso3;
  };

  function getCountryRankingText() {
    if (!selectedCountryPosition) return null;

    const countryInfo = COUNTRY_MAPPING[selectedCountryCode];
    if (!countryInfo) return null;

    const positionText = getPositionText(selectedCountryPosition);
    const countryName = countryInfo.name[currentLang] || countryInfo.name.fr;
    const iso2Code = getISO2FromISO3(selectedCountryCode);
    const flag = getFlagEmoji(iso2Code);

    // En français, on utilise le genre pour la conjugaison
    if (currentLang === "fr") {
      const genderKey = countryInfo.gender === "feminine" ? "ranking_feminine" : "ranking_masculine";
      const rankingTemplate = getI18nLabel(genderKey);
      return (
        <>
          <strong>{countryName}</strong> {flag} {rankingTemplate.replace("{position}", positionText)}
        </>
      );
    } else {
      // En anglais, pas de distinction de genre
      const rankingTemplate = getI18nLabel("ranking_masculine");
      return (
        <>
          <strong>{countryName}</strong> {flag} {rankingTemplate.replace("{position}", positionText)}
        </>
      );
    }
  }

  return (
    <>
      <Callout className="callout-style">
        <strong>{`${top10[top10.length - 1]?.influence.toFixed(1)}`}</strong>
        {getI18nLabel("intro")}
        <i>{top10.map((item) => item.name_fr).join(", ")}</i>
        <>
          <br />
          <br />
          {selectedCountryPosition ? getCountryRankingText() : `Pays ${selectedCountryCode} non trouvé dans le classement`}
        </>
      </Callout>
    </>
  );
}
