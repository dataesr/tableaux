import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import Cookies from "js-cookie";

import { GetData } from "./query";
import optionsSubsidiesValues from "./options-values";
import optionsSubsidiesSuccessRates from "./options-success-rates";
import optionsSubsidiesRates from "./options-rates";

import ChartWrapper from "../../../../../../components/chart-wrapper";
import { getDefaultParams } from "./utils";
import { Container, Row, Col } from "@dataesr/dsfr-plus";
import DefaultSkeleton from "../../../../../../components/charts-skeletons/default";
import { RenderDataSubsidiesValuesAndRates } from "./render-data";

import i18nLocal from "./i18n.json";
import i18nGlobal from "../../../../i18n-global.json";

const configChart1 = {
  id: "EvolutionFundingLines",
  title: {
    fr: "Evolution des financements demandés et obtenus (M€)",
    en: "Financing applied for and obtained (€m)",
  },
  description: {
    fr: "",
    en: "",
  },
  subtitle: "",
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/projects-types-3",
};
const configChart2 = {
  id: "EvolutionFundingLinesSuccessRate",
  title: {
    fr: "Evolution du taux de succès des financements demandés et obtenus",
    en: "Trend in the success rate of financing applications and grants",
  },
  description: {
    fr: "",
    en: "",
  },
  subtitle: "",
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/projects-types-3",
};
const configChart3 = {
  id: "EvolutionFundingLinesRates",
  title: {
    fr: "Part des subventions du pays demandées et obtenus par rapport au total des participants",
    en: "Percentage of country funding applied for and obtained as a proportion of total participants",
  },
  description: {
    fr: "",
    en: "",
  },
  subtitle: "",
  integrationURL: "/european-projects/components/pages/analysis/overview/charts/projects-types-3",
};

export default function FundingEvo3Years() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const params = getDefaultParams(searchParams);
  const country_code = searchParams.get("country_code") || "FRA";

  const { data, isLoading } = useQuery({
    queryKey: [
      "FundingEvo3Years",
      params,
      Cookies.get("selectedPillars"),
      Cookies.get("selectedPrograms"),
      Cookies.get("selectedThematics"),
      Cookies.get("selectedDestinations"),
      country_code,
    ],
    queryFn: () => GetData(params),
  });

  if (isLoading || !data)
    return (
      <>
        <DefaultSkeleton col={2} />
        <DefaultSkeleton />
      </>
    );

  const i18n = {
    ...i18nLocal,
    ...i18nGlobal,
  };
  function getI18nLabel(key) {
    return i18n[key][currentLang];
  }

  function Legend({ data }) {
    const rootStyles = getComputedStyle(document.documentElement);
    return (
      <fieldset className="legend">
        <legend>{getI18nLabel("legend")}</legend>
        <ul>
          {data.successful.map((country, index) => (
            <li key={country.id}>
              <div
                style={{
                  background: rootStyles.getPropertyValue(`--scale-${index}-color`),
                }}
              />
              <span>{country[`name_${currentLang}`]}</span>
            </li>
          ))}
        </ul>
      </fieldset>
    );
  }

  const successfulData = data.filter((item) => item.stage === "successful");
  const sortedSuccessfulData = successfulData
    .sort((a, b) => {
      const aValue = a.data.find((d) => d.year === "2023")?.total_fund_eur || 0;
      const bValue = b.data.find((d) => d.year === "2023")?.total_fund_eur || 0;
      return bValue - aValue;
    })
    .slice(0, 5);

  // si le pays en cours 'country_code' n'est pas dans les 5 premiers, on l'ajoute à la place du 5eme
  if (!sortedSuccessfulData.some((item) => item.id === country_code)) {
    const countryData = successfulData.find((item) => item.id === country_code);
    if (countryData) {
      sortedSuccessfulData[4] = countryData;
    }
  }

  // On part de la liste des pays triés par succès et on récupère les données évaluées correspondantes. De cette façon, on s'assure que les pays évalués sont dans le même ordre que les pays réussis pour la gestion des couleurs
  const evaluatedData = data.filter((item) => item.stage === "evaluated");
  const sortedEvaluatedData: typeof evaluatedData = [];
  sortedSuccessfulData.forEach((country) => {
    const found = evaluatedData.find((item) => item.id === country.id);
    if (found) sortedEvaluatedData.push(found);
  });

  interface CountryData {
    id: string;
    stage: string;
    name_fr: string;
    name_en: string;
    data: Array<{ year: string; total_fund_eur: number }>;
  }

  interface FilteredData {
    successful: CountryData[];
    evaluated: CountryData[];
    total_successful?: { year: string; total_fund_eur: number }[];
    total_evaluated?: { year: string; total_fund_eur: number }[];
  }

  // création de l'objet filteredData avec les données triées par année
  const filteredData: FilteredData = {
    successful: sortedSuccessfulData.map((country) => ({ ...country, data: country.data.sort((a, b) => a.year - b.year) })),
    evaluated: sortedEvaluatedData.map((country) => ({ ...country, data: country.data.sort((a, b) => a.year - b.year) })),
  };

  // ajout de la somme des subventions pour tous les pays dans filteredData
  // filteredData.total_successful = [{year: "2021", total_fund_eur: 1000000}, {year: "2022", total_fund_eur: 2000000}, ...]
  filteredData.total_successful = data
    .filter((item) => item.stage === "successful")
    .reduce((acc, country) => {
      country.data.forEach((yearData) => {
        const existingYear = acc.find((y) => y.year === yearData.year);
        if (existingYear) {
          existingYear.total_fund_eur += yearData.total_fund_eur;
        } else {
          acc.push({ year: yearData.year, total_fund_eur: yearData.total_fund_eur });
        }
      });
      return acc;
    }, []);
  filteredData.total_evaluated = data
    .filter((item) => item.stage === "evaluated")
    .reduce((acc, country) => {
      country.data.forEach((yearData) => {
        const existingYear = acc.find((y) => y.year === yearData.year);
        if (existingYear) {
          existingYear.total_fund_eur += yearData.total_fund_eur;
        } else {
          acc.push({ year: yearData.year, total_fund_eur: yearData.total_fund_eur });
        }
      });
      return acc;
    }, []);

  // TODO: permettre l'ajout de pays avec un bouton "plus de pays" dans la légende. Ce bouton aurait pour effet de charger plus de pays dans le graphique, en changeant simplement la limite du slice()

  return (
    <Container fluid>
      <Row className="fr-mt-4w">
        <Col md={6}>
          <ChartWrapper
            config={configChart1}
            options={optionsSubsidiesValues(filteredData, currentLang)}
            renderData={RenderDataSubsidiesValuesAndRates}
          />
        </Col>
        <Col>
          <ChartWrapper
            config={configChart2}
            options={optionsSubsidiesSuccessRates(filteredData, currentLang)}
            renderData={RenderDataSubsidiesValuesAndRates}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <Legend data={filteredData} />
        </Col>
      </Row>
      <Row className="fr-mt-4w">
        <Col>
          <ChartWrapper
            config={configChart3}
            options={optionsSubsidiesRates(filteredData, currentLang)}
            renderData={RenderDataSubsidiesValuesAndRates}
          />
        </Col>
      </Row>
      <Row>
        <Col>
          <Legend data={filteredData} />
        </Col>
      </Row>
    </Container>
  );
}
