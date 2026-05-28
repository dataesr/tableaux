import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge, Button, Text, Title } from "@dataesr/dsfr-plus";
const { VITE_APP_SERVER_URL } = import.meta.env;

import { rgaa_tests_list_type } from "./types";

const i18n = {
  title: {
    fr: "Audit",
    en: "Audit",
  },
  "siteId-label": {
    fr: "Identifiant du site : ",
    en: "Site ID: ",
  },
  "last-update-label": {
    fr: "Date de dernière mise à jour : ",
    en: "Last update date: ",
  },
  "conformity-percentage": {
    fr: "Pourcentage de conformité : ",
    en: "Conformity percentage: ",
  },
  "rgaa-version-label": {
    fr: "Version du RGAA testée : ",
    en: "RGAA version tested: ",
  },
  "non-conformities-title": {
    fr: "Non conformités détectées",
    en: "Non conformities",
  },
  "performed-tests-title": {
    fr: "Tests passés avec succès",
    en: "Tests performed successfully",
  },
  "not-performed-tests-title": {
    fr: "Tests non passés ou non applicables",
    en: "Tests not performed or not applicable",
  },
  "develop-button": {
    fr: "Développer",
    en: "Expand",
  },
  "reduce-button": {
    fr: "Réduire",
    en: "Reduce",
  },
  "status-date": {
    fr: "Statut et date du test : ",
    en: "Test status and date: ",
  },
  "associated-comment": {
    fr: "Commentaire associé : ",
    en: "Associated comment: ",
  },
};

function List({ expanded, list, title, numberOfTests }: { expanded?: boolean; list: rgaa_tests_list_type; title: string; numberOfTests: number }) {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const [isExpanded, setIsExpanded] = useState(expanded || false);

  if (!list || list.length === 0) return null;
  return (
    <>
      <Title as="h4">
        {title}
        <Badge color="green-menthe" className="fr-ml-1w">{`${list.length} / ${numberOfTests} tests`}</Badge>
        <Button variant="tertiary" size="sm" onClick={() => setIsExpanded((prev) => !prev)} style={{ marginLeft: "1rem" }}>
          {isExpanded ? i18n["reduce-button"][currentLang] : i18n["develop-button"][currentLang]}
        </Button>
      </Title>
      <ul style={{ display: isExpanded ? "block" : "none" }}>
        {list.map((test) => (
          <li key={test.testId}>
            {test.description}
            {test.status && test.date && test.comment && <div>{`${i18n["status-date"][currentLang]}${test.status} (${test.date}) / ${i18n["associated-comment"][currentLang]}${test.comment}`}</div>}
          </li>
        ))}
      </ul>
    </>
  );
}

export default function AuditComponent({ idSite }) {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";

  // Récupération des données d'audit pour le site donné (idSite)
  const { data, isLoading } = useQuery({
    queryKey: ["audits", idSite],
    queryFn: () => fetch(`${VITE_APP_SERVER_URL}/get-last-audit/${idSite}`).then((response) => response.json()),
  });

  // Récupération de tous les tests du RGAA utilisés dans l'audit
  const { data: rgaa } = useQuery({
    queryKey: ["rgaa", data?.rgaaId],
    queryFn: () => fetch(`${VITE_APP_SERVER_URL}/get-rgaa/${data?.rgaaId}`).then((response) => response.json()),
    enabled: !!data?.rgaaId,
  });

  if (isLoading || !data || !rgaa) return <div>Pas d'audit trouvé pour ce tableau de bord</div>;

  // construction d'une liste "à plat" qui contient tous les tests du rgaa
  const rgaa_tests_list = rgaa?.criteria?.flatMap(({ thematique_id, thematique, criteres }) =>
    criteres?.flatMap(({ id: critereId, titre, tests }) =>
      tests?.map(({ id: testId, description }) => ({
        thematiqueId: thematique_id,
        thematique,
        critereId,
        title: titre,
        testId,
        description,
        status: "initial",
      })),
    ),
  );

  // Parcours des tests effectuer pour mettre à jour la liste
  data.tests.forEach((test) => {
    const foundedTest = rgaa_tests_list.find((critere) => critere.testId === test.testId);
    if (!foundedTest) return;
    foundedTest.status = test.value;
    foundedTest.comment = test.comment;
    foundedTest.date = new Date(test.date).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  });

  // date du test le plus récent
  const lastUpdateDate = new Date(data?.tests.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0]?.date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <section>
      <Title as="h2">{i18n.title[currentLang]}</Title>
      <Text>
        {i18n["siteId-label"][currentLang]}
        <strong>{idSite}</strong>
      </Text>
      <Text>
        {i18n["last-update-label"][currentLang]}
        <strong>{lastUpdateDate}</strong>
      </Text>
      <Text>
        {i18n["conformity-percentage"][currentLang]}
        <strong>{Math.round((rgaa_tests_list.filter((test) => test.status === "ok").length / rgaa_tests_list.length) * 100)}%</strong> ({rgaa_tests_list.filter((test) => test.status === "ok").length} / {rgaa_tests_list.length} tests)
      </Text>
      <Text>
        {i18n["rgaa-version-label"][currentLang]}
        <strong>{data.rgaaId}</strong>
      </Text>
      <List expanded list={rgaa_tests_list.filter((test) => test.status === "fail")} title={i18n["non-conformities-title"][currentLang]} numberOfTests={rgaa_tests_list.length} />
      <List list={rgaa_tests_list.filter((test) => test.status === "ok")} title={i18n["performed-tests-title"][currentLang]} numberOfTests={rgaa_tests_list.length} />
      <List list={rgaa_tests_list.filter((test) => test.status === "initial" || test.status === "na")} title={i18n["not-performed-tests-title"][currentLang]} numberOfTests={rgaa_tests_list.length} />
    </section>
  );
}
