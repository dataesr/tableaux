import { Row, Col, Title, Badge } from "@dataesr/dsfr-plus";
import Callout from "../../../../../../components/callout";

export default function Id3Charts() {
  return (
    <Row gutters>
      <Col>
        <div id="id3">
          <Title as="h2" look="h4">
            Ajout d'un graphique
          </Title>
          <Callout>
            Pour ajouter un graphique dans un tableau de bord, il faut utiliser son identifiant unique (id).
            <br />
            <br />
            1. <strong>Création</strong>
            <br />
            Chaque graphique est défini dans un fichier TypeScript (.tsx) situé dans le dossier "charts" de la page correspondante du tableau de bord.
            <br />
            Par exemple, pour créer un graphique des 10 premiers bénéficiaires dans le tableau de bord des projets européens, il faut créer un fichier
            nommé "top-10-beneficiaries.tsx" dans le dossier "european-projects/pages/positioning/charts/".
            <br />
            <br />
            Chaque graphique est indépendant et importe ses propres données. Il doit pouvoir être réutilisé dans différentes pages ou tableaux de bord
            si nécessaire et être partageable.
            <br />
            <br />
            <Badge color="purple-glycine">Nom du répertoire</Badge>
            <br />
            <code>client/src/boards/[nom-du-tableau-de-bord]/pages/[nom-de-la-page]/charts/[nom-du-graphique]</code>
            <br />
            <br />
            <Badge color="purple-glycine">Composition du dossier</Badge>
            <br />- <code>index.tsx</code> : fichier principal du graphique
            <br />
            - options.tsx : fichier des options Highcharts du graphique
            <br />
            - query.tsx : fichier des données du graphique
            <br />
            - utils.tsx : fichier des fonctions utilitaires du graphique
            <br />
            - i18n.json : fichier des traductions du graphique
            <br />
            <br />
            <Badge color="purple-glycine">Objet de configuration</Badge>
            <br />
            Chaque graphique doit posséder un objet de configuration contenant les propriétés suivantes :
            <br />- id : identifiant unique du graphique
            <br />- title : titre international du graphique (facultatif)
            <br />- comment : description internationale du graphique (facultatif). Affiché dans le footer du graphique
            <br />- readingKey : fonction retournant la clé de lecture des données
            <br />- source : source des données
            <br />- updateDate : date de mise à jour des données
            <br />- integrationURL : URL d'intégration du graphique
            <br />
            <br />
            Exemple d'objet de configuration&nbsp;:
            <br />
            <pre>
              <code>
                {`const config = {
  id: chartId,
  title: {
    fr: i18n.title.fr,
    en: i18n.title.en,
  },
  comment: {
    fr: <>{i18n.comment.fr}</>,
    en: <>{i18n.comment.en}</>,
  },
  readingKey: readingKey(data, isLoading),
  sources: EPChartsSources,
  integrationURL: \`/integration?chart_id=\${chartId}&\${params}\`,
};`}
              </code>
            </pre>
            <br />
            2. <strong>Utilisation du composant ChartWrapper</strong>
            <br />
            Chaque graphique doit utiliser le composant ChartWrapper pour l'affichage. Ce composant gère l'affichage du graphique, la table de
            données, la légende, la source, la date de mise à jour, le partage etc.
            <br />
            <br />
            <Badge color="purple-glycine">Props</Badge>
            <br />
            - config : objet de configuration du graphique
            <br />
            - options : options Highcharts du graphique
            <br />
            - legend : légende externe du graphique si impossible de la faire avec Highcharts (facultatif, mettre null si pas de légende externe)
            <br />
            - renderData : fonction de rendu de la table de données du graphique. Doit renvoyer un composant JSX affichant la table (facultatif)
            <br />
            - hideTitle : booléen pour cacher le titre du graphique (facultatif, par défaut false)
            <br />
            - constructorType : type de constructeur Highcharts (facultatif, par défaut "chart"). Utile pour les graphiques spécifiques comme les
            cartes.
            <br />
            Exemple d'utilisation du composant ChartWrapper&nbsp;:
            <br />
            <pre>
              <code>
                {`<ChartWrapper
  config={config}
  options={options(data, currentLang)}
  renderData={() => renderDataTable(data, currentLang)}
/>`}
              </code>
            </pre>
            <br />
            3. <strong>Intégration</strong>
            <br />
            Cet identifiant devra être reporté dans le fichier "charts-registry" du dossier "integration"
            <br />
            Par exemple, pour ajouter le graphique des 10 premiers bénéficiaires dans le tableau de bord des projets européens, il faut utiliser
            l'id&nbsp;: <code>top10beneficiaries</code>
            <br />
            Ensuite, dans le fichier "charts-registry", il faut ajouter une entrée avec cet id et le chemin relatif vers le fichier du
            graphique&nbsp;:
            <br />
            Exemple &nbsp;:
            <pre>
              <code>{`top10beneficiaries: lazy(() => import("../european-projects/pages/positioning/charts/top-10-beneficiaries")),`}</code>
            </pre>
          </Callout>
        </div>
      </Col>
    </Row>
  );
}
