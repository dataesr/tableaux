import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import Template from "./template";
import { GetData } from "./query";

import { useGetParams } from "./utils";
import { Col, Container, Row, Title } from "@dataesr/dsfr-plus";

import "./styles.scss";
import RateCard from "../../../../components/cards/funds-cards/rate";

import i18n from "./i18n.json";

export default function SynthesisFocus() {
  const [searchParams] = useSearchParams();
  const params = useGetParams();
  const currentLang = searchParams.get("language") || "fr";
  const structureId = searchParams.get("structureid") || "";

  function getI18nLabel(key: string) {
    const keys = key.split(".");
    let value: Record<string, unknown> = i18n;
    for (const k of keys) {
      value = value?.[k] as Record<string, unknown>;
    }
    return (value as Record<string, string>)?.[currentLang] || key;
  }

  const { data, isLoading } = useQuery({
    queryKey: ["SynthesisFocus", params],
    queryFn: () => GetData(params),
  });

  if (isLoading || !data) return <Template />;

  const dataSuccessful = data.successful;
  const dataEvaluated = data.evaluated;
  const dataCurrentCountry_successful = dataSuccessful.countries.find((el) => el.country_code === searchParams.get("country_code"));
  const dataCurrentCountry_evaluated = dataEvaluated.countries.find((el) => el.country_code === searchParams.get("country_code"));

  if (!structureId) {
    return (
      <Container as="section" fluid className="fr-mb-2w">
        <Title as="h2">{currentLang === "en" ? "Key figures" : "Grands chiffres"}</Title>
        <Row gutters>
          <Col md={6}>
            <RateCard
              nb={dataCurrentCountry_successful.total_fund_eur / dataSuccessful.total_fund_eur}
              label={getI18nLabel("fundsShare.label")}
              loading={false}
              tooltipText={getI18nLabel("fundsShare.tooltip")}
              numerator={dataCurrentCountry_successful.total_fund_eur}
              denominator={dataSuccessful.total_fund_eur}
              numeratorLabel={getI18nLabel("labels.fundsShare.numerator")}
              denominatorLabel={getI18nLabel("labels.fundsShare.denominator")}
            />
          </Col>
          <Col md={6}>
            <RateCard
              nb={dataCurrentCountry_successful.total_involved / dataSuccessful.total_involved}
              label={getI18nLabel("participantsShare.label")}
              loading={false}
              tooltipText={getI18nLabel("participantsShare.tooltip")}
              numerator={dataCurrentCountry_successful.total_involved}
              denominator={dataSuccessful.total_involved}
              numeratorLabel={getI18nLabel("labels.participantsShare.numerator")}
              denominatorLabel={getI18nLabel("labels.participantsShare.denominator")}
            />
          </Col>
          <Col md={6}>
            <RateCard
              nb={dataCurrentCountry_successful.total_coordination_number / dataSuccessful.total_coordination_number}
              label={getI18nLabel("coordinationsShare.label")}
              loading={false}
              tooltipText={getI18nLabel("coordinationsShare.tooltip")}
              numerator={dataCurrentCountry_successful.total_coordination_number}
              denominator={dataSuccessful.total_coordination_number}
              numeratorLabel={getI18nLabel("labels.coordinationsShare.numerator")}
              denominatorLabel={getI18nLabel("labels.coordinationsShare.denominator")}
            />
          </Col>
          <Col md={6}>
            <RateCard
              nb={dataCurrentCountry_successful.total_fund_eur / dataCurrentCountry_evaluated.total_fund_eur}
              label={getI18nLabel("fundsSuccessRate.label")}
              loading={false}
              tooltipText={getI18nLabel("fundsSuccessRate.tooltip")}
              numerator={dataCurrentCountry_successful.total_fund_eur}
              denominator={dataCurrentCountry_evaluated.total_fund_eur}
              numeratorLabel={getI18nLabel("labels.fundsSuccessRate.numerator")}
              denominatorLabel={getI18nLabel("labels.fundsSuccessRate.denominator")}
            />
          </Col>
          <Col md={6}>
            <RateCard
              nb={dataCurrentCountry_successful.total_involved / dataCurrentCountry_evaluated.total_involved}
              label={getI18nLabel("participantsSuccessRate.label")}
              loading={false}
              tooltipText={getI18nLabel("participantsSuccessRate.tooltip")}
              numerator={dataCurrentCountry_successful.total_involved}
              denominator={dataCurrentCountry_evaluated.total_involved}
              numeratorLabel={getI18nLabel("labels.participantsSuccessRate.numerator")}
              denominatorLabel={getI18nLabel("labels.participantsSuccessRate.denominator")}
            />
          </Col>
          <Col md={6}>
            <RateCard
              nb={dataCurrentCountry_successful.total_coordination_number / dataCurrentCountry_evaluated.total_coordination_number}
              label={getI18nLabel("projectsSuccessRate.label")}
              loading={false}
              tooltipText={getI18nLabel("projectsSuccessRate.tooltip")}
              numerator={dataCurrentCountry_successful.total_coordination_number}
              denominator={dataCurrentCountry_evaluated.total_coordination_number}
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
      <Title as="h2">{currentLang === "en" ? "Key figures" : "Grands chiffres"}</Title>
      <Row gutters>
        <Col md={6}>
          <RateCard
            nb={dataSuccessful.entity.total_fund_eur / dataCurrentCountry_successful.total_fund_eur}
            label={getI18nLabel("EntityFundsShare.label")}
            loading={false}
            tooltipText={getI18nLabel("EntityFundsShare.tooltip")}
            numerator={dataSuccessful.entity.total_fund_eur}
            denominator={dataCurrentCountry_successful.total_fund_eur}
            numeratorLabel={getI18nLabel("labels.EntityFundsShare.numerator")}
            denominatorLabel={getI18nLabel("labels.fundsShare.numerator")}
          />
        </Col>
        <Col md={6}>
          <RateCard
            nb={dataSuccessful.entity.total_involved / dataCurrentCountry_successful.total_involved}
            label={getI18nLabel("entityParticipantsShare.label")}
            loading={false}
            tooltipText={getI18nLabel("entityParticipantsShare.tooltip")}
            numerator={dataSuccessful.entity.total_involved}
            denominator={dataCurrentCountry_successful.total_involved}
            numeratorLabel={getI18nLabel("labels.entityParticipantsShare.numerator")}
            denominatorLabel={getI18nLabel("labels.participantsShare.numerator")}
          />
        </Col>

        <Col md={6}>
          <RateCard
            nb={dataSuccessful.entity.total_coordination_number / dataCurrentCountry_successful.total_coordination_number}
            label={getI18nLabel("coordinationsShare.label")}
            loading={false}
            tooltipText={getI18nLabel("coordinationsShare.tooltip")}
            numerator={dataSuccessful.entity.total_coordination_number}
            denominator={dataCurrentCountry_successful.total_coordination_number}
            numeratorLabel={getI18nLabel("labels.coordinationsShare.numerator")}
            denominatorLabel={getI18nLabel("labels.coordinationsShare.denominator")}
          />
        </Col>
      </Row>
    </Container>
  );
}

