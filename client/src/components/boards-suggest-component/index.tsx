import { useMemo, useState } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Badge, Container, Row, Col, Text, Title, Link } from "@dataesr/dsfr-plus";
import "./styles.scss";

const { VITE_APP_SERVER_URL } = import.meta.env;

interface CrossBoardMatch {
  field: string;
  value: string;
  collectionId: string;
}

interface CrossBoardResult {
  boardId: string;
  associatedRoute: string;
  matches: CrossBoardMatch[];
}

interface Dashboard {
  id: string;
  name_fr: string;
  name_en: string;
  description_fr?: string;
  description_en?: string;
  isMultilingual?: boolean;
}

export default function BoardsSuggestComponent() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = useState(false);

  // Extraire la langue depuis les paramètres d'URL (par défaut 'fr')
  const language = searchParams.get("language") || "fr";

  // Extraire la base de la route actuelle (ex: /european-projects depuis /european-projects/overview)
  const currentRouteBase = useMemo(() => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    // Prendre tout sauf le dernier segment (ex: european-projects)
    return pathParts.length > 1 ? `/${pathParts[0]}` : location.pathname;
  }, [location.pathname]);

  // Convertir les paramètres d'URL en objet
  const params = useMemo(() => Object.fromEntries(searchParams.entries()), [searchParams]);

  // Créer la query string pour l'API
  const queryString = useMemo(() => {
    if (Object.keys(params).length === 0) return null;
    return new URLSearchParams(params).toString();
  }, [params]);

  // Récupérer la liste des dashboards pour savoir lesquels sont multilingues
  const { data: dashboards } = useQuery<Dashboard[]>({
    queryKey: ["list-dashboards"],
    queryFn: () => fetch(`${VITE_APP_SERVER_URL}/admin/list-dashboards`).then((response) => response.json()),
  });

  // Rechercher dans shared
  const { data: suggestionsData, isLoading } = useQuery<CrossBoardResult[]>({
    queryKey: ["search-shared", queryString],
    queryFn: () => fetch(`${VITE_APP_SERVER_URL}/admin/search-shared?${queryString}`).then((response) => response.json()),
    enabled: !!queryString, // Ne faire la requête que si on a des paramètres
  });

  // Regrouper et filtrer les suggestions pour exclure le tableau en cours
  const suggestions = useMemo(() => {
    if (!suggestionsData) return [];

    // Regrouper les suggestions par boardId
    const groupedByBoard = suggestionsData.reduce((acc, suggestion) => {
      const boardId = suggestion.boardId;

      if (!acc[boardId]) {
        acc[boardId] = {
          boardId,
          associatedRoutes: [],
          matches: [],
        };
      }

      acc[boardId].associatedRoutes.push(suggestion.associatedRoute);
      acc[boardId].matches.push(...suggestion.matches);

      return acc;
    }, {} as Record<string, { boardId: string; associatedRoutes: string[]; matches: CrossBoardMatch[] }>);

    // Convertir en tableau et filtrer
    return Object.values(groupedByBoard)
      .filter((suggestion) => {
        // Prendre la première route pour déterminer la base
        const suggestedRouteFull = suggestion.associatedRoutes[0].split("?")[0];
        const suggestedPathParts = suggestedRouteFull.split("/").filter(Boolean);
        const suggestedRouteBase = suggestedPathParts.length > 0 ? `/${suggestedPathParts[0]}` : suggestedRouteFull;

        // Exclure si la base de la route correspond à la route actuelle
        return suggestedRouteBase !== currentRouteBase;
      })
      .map((suggestion) => ({
        boardId: suggestion.boardId,
        associatedRoute: suggestion.associatedRoutes[0], // On prendra la route la plus complexe
        matches: suggestion.matches,
      }))
      .sort((a, b) => {
        // Trier par nombre de matches décroissant (le plus de matches en premier)
        return b.matches.length - a.matches.length;
      });
  }, [suggestionsData, currentRouteBase]);

  // Construire la route complète avec les paramètres matchés
  const buildRouteWithParams = (suggestion: { boardId: string; associatedRoute: string; matches: CrossBoardMatch[] }) => {
    // Trouver la route la plus complexe (celle avec le plus de paramètres)
    const allRoutes = suggestionsData?.filter((s) => s.boardId === suggestion.boardId).map((s) => s.associatedRoute) || [suggestion.associatedRoute];

    const mostComplexRoute = allRoutes.reduce((prev, current) => {
      return current.length > prev.length ? current : prev;
    }, allRoutes[0] || suggestion.associatedRoute);

    let finalRoute = mostComplexRoute;

    // Trier les matches : d'abord ceux qui ont un champ explicite dans la route, puis les autres
    const sortedMatches = [...suggestion.matches].sort((a, b) => {
      const aHasField = finalRoute.includes(`${a.field}=`);
      const bHasField = finalRoute.includes(`${b.field}=`);
      if (aHasField && !bHasField) return -1;
      if (!aHasField && bHasField) return 1;
      return 0;
    });

    // Pour chaque match, vérifier si le champ est présent dans associatedRoute
    sortedMatches.forEach((match) => {
      // Cas 1: Si match.value est "$value", il faut le remplacer par la vraie valeur du paramètre
      const actualValue = match.value.startsWith("$") ? params[match.field] : match.value;

      // Cas 2: Chercher le pattern field=$value ou field=$xxx dans les query params avec ?&
      const fieldParamPattern = new RegExp(`([?&])${match.field}=\\$\\w+`, "g");

      if (fieldParamPattern.test(finalRoute)) {
        // Si on trouve field=$value, remplacer par field=valeur_réelle
        finalRoute = finalRoute.replace(new RegExp(`([?&])${match.field}=\\$\\w+`, "g"), `$1${match.field}=${actualValue}`);
      } else {
        // Cas 3: Chercher field=$value dans le path (sans ? ou &), par exemple /pillarId=$value
        const pathParamPattern = new RegExp(`\\b${match.field}=\\$\\w+`, "g");
        if (pathParamPattern.test(finalRoute)) {
          finalRoute = finalRoute.replace(pathParamPattern, `${match.field}=${actualValue}`);
        } else {
          // Cas 4: Chercher $value seul dans le path (ex: /pays/$value/profil)
          // Seulement si le champ n'est pas explicitement présent dans la route
          const hasFieldInRoute = finalRoute.includes(`${match.field}=`);
          const hasValuePlaceholder = finalRoute.includes("$value");

          if (!hasFieldInRoute && hasValuePlaceholder) {
            // Remplacer la première occurrence de $value par la valeur du match
            finalRoute = finalRoute.replace("$value", actualValue || match.value);
          }
        }
      }
    });

    // Vérifier si le tableau de bord cible est multilingue
    const targetDashboard = dashboards?.find((dashboard) => dashboard.id === suggestion.boardId);

    // Si le tableau de bord cible est multilingue, gérer le paramètre language
    if (targetDashboard?.isMultilingual) {
      // D'abord, supprimer le paramètre language existant s'il y en a un
      finalRoute = finalRoute.replace(/[?&]language=[^&]*/g, "");

      // Nettoyer les éventuels problèmes de séparateurs
      // Si on a ?& remplacer par ?
      finalRoute = finalRoute.replace(/\?&/g, "?");
      // Si on a && remplacer par &
      finalRoute = finalRoute.replace(/&&/g, "&");
      // Si on a & au début des query params (sans ?), remplacer par ?
      finalRoute = finalRoute.replace(/([^?&])&/, "$1?");

      // Ajouter le paramètre language avec la langue actuelle
      const separator = finalRoute.includes("?") ? "&" : "?";
      finalRoute = `${finalRoute}${separator}language=${language}`;
    }

    return finalRoute;
  };

  // Si pas de paramètres d'URL
  if (!queryString) {
    return null;
  }

  // Si en chargement
  if (isLoading) {
    return (
      <aside className="inline-suggest">
        <Container fluid>
          <Row>
            <Col>
              <Text size="sm">⏳ Recherche de tableaux de bord associés...</Text>
            </Col>
          </Row>
        </Container>
      </aside>
    );
  }

  // Si aucune suggestion trouvée
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  return (
    <aside className={`inline-suggest fr-mt-3w ${isExpanded ? "inline-suggest--expanded" : ""}`}>
      <Container fluid>
        <Row gutters>
          <Col xs="12" className="fr-pb-0">
            <Title as="h5" look="h5" className="fr-mb-0">
              Tableaux
            </Title>
            <Text className="fr-mb-1w">
              Tableaux est un ensemble de tableaux de bord. Nous avons détecté que d'autres tableaux de bord pourraient vous intéresser en fonction
              des paramètres que vous avez sélectionnés. Cliquez sur le bouton + pour voir les suggestions complètes.
            </Text>
            <div className="inline-suggest__header" onClick={() => setIsExpanded(!isExpanded)}>
              <Title as="h6" look="h6" className="fr-mb-0">
                💡 {suggestions.length} tableau{suggestions.length > 1 ? "x" : ""} de bord suggéré{suggestions.length > 1 ? "s" : ""}
              </Title>
              <button className="inline-suggest__toggle" aria-label={isExpanded ? "Réduire" : "Agrandir"}>
                {isExpanded ? "−" : "+"}
              </button>
            </div>
          </Col>

          {!isExpanded && (
            <Col xs="12" className="fr-pt-0">
              <div className="inline-suggest__quick-links">
                {suggestions.map((suggestion, index) => {
                  const targetDashboard = dashboards?.find((dashboard) => dashboard.id === suggestion.boardId);
                  const dashboardName =
                    language === "en" && targetDashboard?.name_en
                      ? targetDashboard.name_en
                      : targetDashboard?.name_fr || suggestion.boardId.toUpperCase();

                  return (
                    <Link
                      key={index}
                      href={buildRouteWithParams(suggestion)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-suggest__quick-link"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {dashboardName}
                      <span className="inline-suggest__quick-link-count">{suggestion.matches.length}</span>
                    </Link>
                  );
                })}
              </div>
            </Col>
          )}

          {isExpanded && (
            <>
              <Col xs="12">
                <Text size="sm" bold className="fr-mb-1w">
                  Paramètres détectés :
                </Text>
                <div className="fr-mb-2w">
                  {Object.entries(params).map(([key, value]) => (
                    <Badge key={key} color="blue-ecume" size="sm" className="fr-mr-1v fr-mb-1v">
                      {key} = {value}
                    </Badge>
                  ))}
                </div>
              </Col>
              <Col xs="12">
                {suggestions.map((suggestion, index) => {
                  const targetDashboard = dashboards?.find((dashboard) => dashboard.id === suggestion.boardId);

                  // Déterminer le nom et la description en fonction de la langue
                  const dashboardName =
                    language === "en" && targetDashboard?.name_en
                      ? targetDashboard.name_en
                      : targetDashboard?.name_fr || suggestion.boardId.toUpperCase();

                  const dashboardDescription =
                    language === "en" && targetDashboard?.description_en ? targetDashboard.description_en : targetDashboard?.description_fr;

                  return (
                    <Link key={index} href={buildRouteWithParams(suggestion)} target="_blank" rel="noopener noreferrer" className="suggestion-card">
                      <h6 className="suggestion-card__title">{dashboardName}</h6>
                      {dashboardDescription && <p className="suggestion-card__description">{dashboardDescription}</p>}
                      <div className="suggestion-card__badges">
                        <Badge color="green-menthe" size="sm" className="fr-mr-1v">
                          {suggestion.matches.length} correspondance{suggestion.matches.length > 1 ? "s" : ""}
                        </Badge>
                        {suggestion.matches.map((match, matchIndex) => (
                          <Badge key={matchIndex} color="purple-glycine" size="sm">
                            {match.field}: {match.value}
                          </Badge>
                        ))}
                      </div>
                    </Link>
                  );
                })}
              </Col>
            </>
          )}
        </Row>
      </Container>
    </aside>
  );
}
