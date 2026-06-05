import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Container, Row, Col, Text, Title, Button, Badge } from "@dataesr/dsfr-plus";
import { useParams } from "react-router-dom";
import { queryClient } from "../../main";

const { VITE_APP_SERVER_URL } = import.meta.env;

type FormResponse = { testId: string; value: string; comment?: string; modified: boolean };

export default function AccessibilityPage() {
  const { dashboardId } = useParams();
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);

  // Récupération des données d'audit pour le site donné (idSite)
  const { data: audit, isLoading: isLoadingAudit } = useQuery({
    queryKey: ["audits", dashboardId],
    queryFn: () => fetch(`${VITE_APP_SERVER_URL}/get-last-audit/tableaux_${dashboardId}`).then((response) => response.json()),
  });

  // Récupération de tous les tests du RGAA utilisés dans l'audit. Si pas de rgaaId, on récupère le dernier RGAA par défaut
  const { data: rgaa, isLoading: isLoadingRgaa } = useQuery({
    queryKey: ["rgaa", audit?.rgaaId, isLoadingAudit],
    queryFn: () => fetch(`${VITE_APP_SERVER_URL}/get-rgaa/${audit?.rgaaId}`).then((response) => response.json()),
    enabled: !isLoadingAudit,
  });

  const rgaa_tests_list = useMemo(
    () =>
      rgaa?.criteria?.flatMap(({ thematique_id, thematique, criteres }) =>
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
      ),
    [rgaa],
  );

  const invalidateDashboardQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["audits", dashboardId] });
  };

  useMemo(() => {
    // init du state
    if (audit) {
      const initialFormResponses: FormResponse[] = [];
      audit.tests?.forEach((test) => {
        initialFormResponses.push({ testId: test.testId, value: test.value, comment: test.comment, modified: false });
      });
      setFormResponses(initialFormResponses);
    }
  }, [audit]);

  // Structure plate du RGAA indexée par testId pour lookups O(1)
  const rgaaFlat = useMemo(() => {
    const testMap = new Map<string, { description: string }>();
    const hierarchyMap = new Map<string, { thematiqueId: string; thematiqueTitle: string; critereId: string; critereTitle: string }>();

    rgaa?.criteria?.forEach(({ thematique_id, thematique, criteres }) => {
      criteres?.forEach(({ id: critereId, titre, tests }) => {
        tests?.forEach(({ id: testId, description }) => {
          testMap.set(testId, { description });
          hierarchyMap.set(testId, { thematiqueId: thematique_id, thematiqueTitle: thematique, critereId, critereTitle: titre });
        });
      });
    });

    return { testMap, hierarchyMap, raw: rgaa };
  }, [rgaa]);

  // Structure plate des réponses du formulaire indexée par testId
  const formResponsesMap = useMemo(() => {
    const map = new Map<string, FormResponse>();
    formResponses.forEach((response) => {
      map.set(response.testId, response);
    });
    return map;
  }, [formResponses]);

  const updateTestsInDb = () => {
    // envoi des tests modifiés ou nouveaux uniquement

    fetch(`${VITE_APP_SERVER_URL}/update-tests`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        siteId: `tableaux_${dashboardId}`,
        rgaaId: audit.rgaaId,
        tests: formResponses.filter((test) => test.modified).map(({ testId, value, comment }) => ({ testId, value, comment })),
      }),
    }).then((response) => {
      if (response.ok) {
        invalidateDashboardQueries();
      } else {
        console.log("Erreur lors de la modification ou l'ajout du test");
      }
    });
  };

  if (isLoadingAudit || isLoadingRgaa) {
    return (
      <Container className="fr-py-5w" role="main">
        <p>Chargement...</p>
      </Container>
    );
  }

  const getValueFromState = (testId: string, field: string) => {
    const response = formResponsesMap.get(testId);
    return response ? response[field] : field === "value" ? "initial" : "";
  };

  const setValueInState = (testId: string, field: "value" | "comment", value: string) => {
    const existingResponse = formResponsesMap.get(testId);
    let newState;

    if (existingResponse) {
      newState = formResponses.map((response) => (response.testId === testId ? { ...response, [field]: value, modified: true } : response));
    } else {
      newState = [
        ...formResponses,
        {
          testId,
          value: field === "value" ? value : "initial",
          comment: field === "comment" ? value : "",
          modified: true,
        },
      ];
    }

    setFormResponses(newState);
  };

  const changesDetected = formResponses.some((response) => response.modified);

  return (
    <Container className="fr-py-5w" role="main">
      <Row>
        <Col>
          <Title as="h1">Audits d'accessibilité</Title>
        </Col>
        <Col md={3}>
          <Button
            variant="secondary"
            disabled={!changesDetected}
            onClick={() => {
              updateTestsInDb();
            }}
          >
            Enregistrer les modifications
          </Button>
        </Col>
        <Col md={2}>
          <fieldset>
            <legend className="fr-mb-2w">Statut des tests</legend>
            <div className="fr-flex fr-flex-wrap fr-gap-2w">
              <div className="fr-flex fr-items-center fr-gap-1w">
                <span className="fr-mr-1w">🟢</span>
                <span>Réussi</span>
              </div>
              <div className="fr-flex fr-items-center fr-gap-1w">
                <span className="fr-mr-1w">🔴</span>
                <span>Échoué</span>
              </div>
              <div className="fr-flex fr-items-center fr-gap-1w">
                <span className="fr-mr-1w">🟠</span>
                <span>Non applicable</span>
              </div>
              <div className="fr-flex fr-items-center fr-gap-1w">
                <span className="fr-mr-1w">⚪</span>
                <span>Non testé</span>
              </div>
            </div>
          </fieldset>
        </Col>
      </Row>
      <section className="fr-mt-5w">
        <Title as="h2">Audit d'accessibilité pour {dashboardId}</Title>
        <Text>Date du dernier audit : 01/01/2024</Text>
        <Text>Version du RGAA testée : {rgaa?.rgaaId} </Text>
        <section className="fr-accordion">
          {rgaaFlat.raw?.criteria?.map(({ thematique_id, thematique, criteres }) => (
            <div key={thematique_id}>
              <Title as="h3" className="fr-accordion__title">
                <button type="button" className="fr-accordion__btn" aria-expanded="false" aria-controls={`accordion-${thematique_id}`}>
                  {thematique}
                  <Badge className="fr-ml-2w">
                    {
                      // nombre de tests réussis 🟢, nombre de tests échoués 🔴, nombre de tests non-applcables 🟠, non-testés ⚪ pour cette thématique
                      (() => {
                        const totalTestsThematique = rgaa_tests_list?.filter((t) => t.thematiqueId === thematique_id).length || 0;
                        const testsOk = audit?.tests?.filter((test) => test.value === "ok" && rgaa_tests_list?.find((t) => t.testId === test.testId)?.thematiqueId === thematique_id).length || 0;
                        const testsFail = audit?.tests?.filter((test) => test.value === "fail" && rgaa_tests_list?.find((t) => t.testId === test.testId)?.thematiqueId === thematique_id).length || 0;
                        const testsNa = audit?.tests?.filter((test) => test.value === "na" && rgaa_tests_list?.find((t) => t.testId === test.testId)?.thematiqueId === thematique_id).length || 0;
                        const totalTestsAuditThematique = audit?.tests?.filter((test) => rgaa_tests_list?.find((t) => t.testId === test.testId)?.thematiqueId === thematique_id).length || 0;
                        const testsNonTestes =
                          totalTestsThematique - totalTestsAuditThematique + audit?.tests?.filter((test) => test.value === "initial" && rgaa_tests_list?.find((t) => t.testId === test.testId)?.thematiqueId === thematique_id).length || 0;
                        return `${testsOk} 🟢 / ${testsFail} 🔴 / ${testsNa} 🟠 / ${testsNonTestes} ⚪`;
                      })()
                    }
                  </Badge>
                </button>
              </Title>
              <div id={`accordion-${thematique_id}`} className="fr-collapse">
                {criteres?.map(({ id: critereId, titre, tests }) => (
                  <div key={critereId} className="fr-mt-2w">
                    <Title as="h4" look="h6">
                      {titre}
                    </Title>
                    {tests?.map(({ id: testId, description }) => (
                      <div key={testId}>
                        <Text className="fr-mb-0 fr-mt-4w">
                          {audit?.tests?.find((test) => test.testId === testId)?.value === "ok"
                            ? "🟢 "
                            : audit?.tests?.find((test) => test.testId === testId)?.value === "fail"
                              ? "🔴 "
                              : audit?.tests?.find((test) => test.testId === testId)?.value === "na"
                                ? "🟠 "
                                : "⚪ "}
                          {description}
                        </Text>

                        <Container fluid key={`yiyji${testId}`}>
                          <Row gutters>
                            <Col md={2}>
                              <select className="fr-select" value={getValueFromState(testId, "value")} onChange={(e) => setValueInState(testId, "value", e.target.value)}>
                                <option value="initial">Non testé</option>
                                <option value="ok">Réussi</option>
                                <option value="fail">Échoué</option>
                                <option value="na">Non applicable</option>
                              </select>
                            </Col>
                            <Col md={7}>
                              <input type="text" className="fr-input" value={getValueFromState(testId, "comment")} onChange={(e) => setValueInState(testId, "comment", e.target.value)} />
                            </Col>
                            <Col>
                              {audit?.tests?.find((t) => t.testId === testId)?.date
                                ? new Date(audit.tests.find((t) => t.testId === testId).date).toLocaleDateString("fr-FR", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })
                                : ""}
                            </Col>
                          </Row>
                        </Container>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </section>
    </Container>
  );
}
