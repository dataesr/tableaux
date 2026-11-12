import { Col, Container, Row, Title } from "@dataesr/dsfr-plus";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { formatCurrency, formatCurrencyEn } from "../../../../../../utils/format";
import RateCard from "../../../../components/cards/funds-cards/rate";
import i18n from "./i18n.json";
import { getData } from "./query";
import Template from "./template";
import { useGetParams } from "./utils";
import { getCountryAdjectives } from "../../../../../../components/country-selector/utils";
import { getCountryNameWithArticle } from "../../../../utils/country-mapping";

import "./styles.scss";

export default function SynthesisFocus() {
  const [searchParams] = useSearchParams();
  const params = useGetParams();
  const countryCode = searchParams.get("country_code") || "FRA";
  const currentLang = (searchParams.get("language") === "en" ? "en" : "fr") as "fr" | "en";
  const structureId = searchParams.get("structureid") || "";

  const country = getCountryNameWithArticle(countryCode, currentLang).replace(/^(Le |La |Les |L')/, (m) => m.toLowerCase());
  const countryAdj = getCountryAdjectives(countryCode, currentLang);

  // Pluriel seulement en français
  const adjMascPlural =
  currentLang === "fr" && !countryAdj.m.endsWith("s") ? `${countryAdj.m}s` : countryAdj.m;

function getI18nLabel(key: string, values: Record<string, string> = {}) {
  const keys = key.split(".");
  let value: Record<string, unknown> = i18n;
  for (const k of keys) {
    value = value?.[k] as Record<string, unknown>;
  }
  const text = (value as Record<string, string>)?.[currentLang] || key;
  // Remplace chaque {placeholder} par sa valeur (laisse le texte tel quel si absent)
  return text.replace(/\{(\w+)\}/g, (match, k) => values[k] ?? match);
}

  const { data, isLoading } = useQuery({
    queryKey: ["SynthesisFocus", params],
    queryFn: () => getData(params),
  });

  if (isLoading || !data) return <Template />;

  const dataSuccessful = data.successful;
  const dataEvaluated = data.evaluated;
  const dataCurrentCountry_successful = dataSuccessful.countries.find((el) => el.country_code === searchParams.get("country_code"));
  const dataCurrentCountry_evaluated = dataEvaluated.countries.find((el) => el.country_code === searchParams.get("country_code"));

  if (!structureId) {
    return (
      <Container as="section" fluid className="fr-mb-2w">
        <Title as="h2">{getI18nLabel("keyFigures")}</Title>
        <Row gutters>
          <Col xs={12} md={4}>
            {/*cards successful funding country share*/}
            <RateCard
              nb={dataCurrentCountry_successful.total_fund_eur / dataSuccessful.total_fund_eur}
              label={getI18nLabel("fundsShare.label", { adj: adjMascPlural })}
              loading={false}
              tooltipText={getI18nLabel("fundsShare.tooltip")}
              numerator={currentLang === "fr" ? formatCurrency(dataCurrentCountry_successful.total_fund_eur) : formatCurrencyEn(dataCurrentCountry_successful.total_fund_eur)}
              denominator={currentLang === "fr" ? formatCurrency(dataSuccessful.total_fund_eur) : formatCurrencyEn(dataSuccessful.total_fund_eur)}
              numeratorLabel={getI18nLabel("labels.fundsShare.numerator")}
              denominatorLabel={getI18nLabel("labels.fundsShare.denominator")}
            />
          </Col>
          <Col xs={12} md={4}>
            {/*cards evaluated involved country share*/}
            <RateCard
              nb={dataCurrentCountry_evaluated.total_involved / dataEvaluated.total_involved}
              label={getI18nLabel("applicantsShare.label", { adj: adjMascPlural })}
              loading={false}
              tooltipText={getI18nLabel("applicantsShare.tooltip")}
              numerator={Math.trunc(dataCurrentCountry_evaluated.total_involved)}
              denominator={Math.trunc(dataEvaluated.total_involved)}
              numeratorLabel={getI18nLabel("labels.applicantsShare.numerator")}
              denominatorLabel={getI18nLabel("labels.applicantsShare.denominator")}
            />
          </Col>
          <Col xs={12} md={4}>
            {/*cards successful coord country share*/}
            <RateCard
              nb={dataCurrentCountry_successful.total_coordination_number / dataSuccessful.total_coordination_number}
              label={getI18nLabel("coordinationsShare.label", { country: country })}
              loading={false}
              tooltipText={getI18nLabel("coordinationsShare.tooltip")}
              numerator={Math.trunc(dataCurrentCountry_successful.total_coordination_number)}
              denominator={Math.trunc(dataSuccessful.total_coordination_number)}
              numeratorLabel={getI18nLabel("labels.coordinationsShare.numerator")}
              denominatorLabel={getI18nLabel("labels.coordinationsShare.denominator")}
            />
          </Col>
          <Col xs={12} md={4}>
            {/*cards funding country success*/}
            <RateCard
              nb={dataCurrentCountry_successful.total_fund_eur / dataCurrentCountry_evaluated.total_fund_eur}
              label={getI18nLabel("fundsSuccessRate.label")}
              loading={false}
              tooltipText={getI18nLabel("fundsSuccessRate.tooltip")}
              numerator={currentLang === "fr" ? formatCurrency(dataCurrentCountry_successful.total_fund_eur) : formatCurrencyEn(dataCurrentCountry_successful.total_fund_eur)}
              denominator={currentLang === "fr" ? formatCurrency(dataCurrentCountry_evaluated.total_fund_eur) : formatCurrencyEn(dataCurrentCountry_evaluated.total_fund_eur)}
              numeratorLabel={getI18nLabel("labels.fundsSuccessRate.numerator")}
              denominatorLabel={getI18nLabel("labels.fundsSuccessRate.denominator")}
            />
          </Col>
          <Col xs={12} md={4}>
            {/*cards involved country success*/}
            <RateCard
              nb={dataCurrentCountry_successful.total_involved / dataCurrentCountry_evaluated.total_involved}
              label={getI18nLabel("participantsSuccessRate.label")}
              loading={false}
              tooltipText={getI18nLabel("participantsSuccessRate.tooltip")}
              numerator={Math.trunc(dataCurrentCountry_successful.total_involved)}
              denominator={Math.trunc(dataCurrentCountry_evaluated.total_involved)}
              numeratorLabel={getI18nLabel("labels.participantsSuccessRate.numerator")}
              denominatorLabel={getI18nLabel("labels.participantsSuccessRate.denominator")}
            />
          </Col>
          <Col xs={12} md={4}>
            {/*cards coord country success*/}
            <RateCard
              nb={dataCurrentCountry_successful.total_coordination_number / dataCurrentCountry_evaluated.total_coordination_number}
              label={getI18nLabel("projectsSuccessRate.label")}
              loading={false}
              tooltipText={getI18nLabel("projectsSuccessRate.tooltip")}
              numerator={Math.trunc(dataCurrentCountry_successful.total_coordination_number)}
              denominator={Math.trunc(dataCurrentCountry_evaluated.total_coordination_number)}
              numeratorLabel={getI18nLabel("labels.projectsSuccessRate.numerator")}
              denominatorLabel={getI18nLabel("labels.projectsSuccessRate.denominator")}
            />
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container as="section" fluid className="fr-mb-2w">
      <Title as="h2">{getI18nLabel("keyFigures")}</Title>
      <Row gutters>
        <Col md={4}>
          <RateCard
            nb={dataSuccessful.entity.total_fund_eur / dataCurrentCountry_successful.total_fund_eur}
            label={getI18nLabel("EntityFundsShare.label")}
            loading={false}
            tooltipText={getI18nLabel("EntityFundsShare.tooltip")}
            numerator={currentLang === "fr" ? formatCurrency(dataSuccessful.entity.total_fund_eur) : formatCurrencyEn(dataSuccessful.entity.total_fund_eur)}
            denominator={currentLang === "fr" ? formatCurrency(dataCurrentCountry_successful.total_fund_eur) : formatCurrencyEn(dataCurrentCountry_successful.total_fund_eur)}
            numeratorLabel={getI18nLabel("labels.EntityFundsShare.numerator")}
            denominatorLabel={getI18nLabel("labels.fundsShare.numerator")}
          />
        </Col>
        <Col md={4}>
          <RateCard
            nb={dataSuccessful.entity.total_involved / dataCurrentCountry_successful.total_involved}
            label={getI18nLabel("entityParticipantsShare.label")}
            loading={false}
            tooltipText={getI18nLabel("entityParticipantsShare.tooltip")}
            numerator={Math.trunc(dataSuccessful.entity.total_involved)}
            denominator={Math.trunc(dataCurrentCountry_successful.total_involved)}
            numeratorLabel={getI18nLabel("labels.entityParticipantsShare.numerator")}
            denominatorLabel={getI18nLabel("labels.participantsShare.numerator")}
          />
        </Col>

        <Col md={4}>
          <RateCard
            nb={dataSuccessful.entity.total_coordination_number / dataCurrentCountry_successful.total_coordination_number}
            label={getI18nLabel("entityCoordinationsShare.label")}
            loading={false}
            tooltipText={getI18nLabel("entityCoordinationsShare.tooltip")}
            numerator={Math.trunc(dataSuccessful.entity.total_coordination_number)}
            denominator={Math.trunc(dataCurrentCountry_successful.total_coordination_numberMath.trunc)}
            numeratorLabel={getI18nLabel("labels.entityCoordinationsShare.numerator")}
            denominatorLabel={getI18nLabel("labels.coordinationsShare.numerator")}
          />
        </Col>
        <Col md={4}>
          <RateCard
            nb={dataSuccessful.entity.total_fund_eur / dataEvaluated.entity.total_fund_eur}
            label={getI18nLabel("fundsSuccessRate.label")}
            loading={false}
            tooltipText={getI18nLabel("fundsSuccessRate.tooltip")}
            numerator={currentLang === "fr" ? formatCurrency(dataSuccessful.entity.total_fund_eur) : formatCurrencyEn(dataSuccessful.entity.total_fund_eur)}
            denominator={currentLang === "fr" ? formatCurrency(dataEvaluated.entity.total_fund_eur) : formatCurrencyEn(dataEvaluated.entity.total_fund_eur)}
            numeratorLabel={getI18nLabel("labels.fundsSuccessRate.numerator")}
            denominatorLabel={getI18nLabel("labels.fundsSuccessRate.denominator")}
          />
        </Col>
        <Col md={4}>
          <RateCard
            nb={dataSuccessful.entity.total_involved / dataEvaluated.entity.total_involved}
            label={getI18nLabel("participantsSuccessRate.label")}
            loading={false}
            tooltipText={getI18nLabel("participantsSuccessRate.tooltip")}
            numerator={Math.trunc(dataSuccessful.entity.total_involved)}
            denominator={Math.trunc(dataEvaluated.entity.total_involved)}
            numeratorLabel={getI18nLabel("labels.participantsSuccessRate.numerator")}
            denominatorLabel={getI18nLabel("labels.participantsSuccessRate.denominator")}
          />
        </Col>
        <Col md={4}>
          <RateCard
            nb={dataSuccessful.entity.total_coordination_number / dataEvaluated.entity.total_coordination_number}
            label={getI18nLabel("projectsSuccessRate.label")}
            loading={false}
            tooltipText={getI18nLabel("projectsSuccessRate.tooltip")}
            numerator={Math.trunc(dataSuccessful.entity.total_coordination_number)}
            denominator={Math.trunc(dataEvaluated.entity.total_coordination_number)}
            numeratorLabel={getI18nLabel("labels.projectsSuccessRate.numerator")}
            denominatorLabel={getI18nLabel("labels.projectsSuccessRate.denominator")}
          />
        </Col>
      </Row>
    </Container>
  );
}

