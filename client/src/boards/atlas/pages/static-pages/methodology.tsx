import {
  Breadcrumb,
  Col,
  Container,
  Link,
  Row,
  Text,
} from "@dataesr/dsfr-plus";

export default function Methodology() {
  return (
    <Container as="main">
      <Row className="fr-mb-5w">
        <Col>
          <Breadcrumb className="fr-m-0 fr-mt-1w">
            <Link href="/atlas">Accueil</Link>
            <Link>
              <strong>Méthodologie</strong>
            </Link>
          </Breadcrumb>
        </Col>
      </Row>

      <h1>Méthodologie</h1>
      <Text>
        L’Atlas des effectifs étudiants mobilise les données sur les effectifs d’étudiants inscrits dans les établissements et les formations de l’enseignement supérieur. Elles sont issues des systèmes d’information et enquêtes des ministères en
        charge de l’Éducation nationale, de l’Enseignement supérieur, de l’Agriculture, de la Pêche, de la Santé et des Sports selon différents niveaux géographiques.
      </Text>
      <Text>
        Les données mobilisées remontent à 2001-02. En 2015-16, la double inscription des étudiants inscrits en CPGE à l’université a été systématisées. En conséquence, à partir de 2015-16, les effectifs étudiants restitués dans l’Atlas sont compris
        hors doubles inscriptions à l’université des étudiants en CPGE.
      </Text>
      <Text>
        Les effectifs d’étudiants inscrits dans les écoles paramédicales et sociales correspondent pour l’année la plus récente restituée (N) aux effectifs de l’année précédente (N-1) en raison d’un décalage dans le calendrier de collecte de
        l’information.
      </Text>
      <Text>
        Les données géographiques s’appuient sur le{" "}
        <Link href="http://www.insee.fr/fr/methodes/nomenclatures/cog/" target="_blank">
          code officiel géographique
        </Link>
        . Les unités urbaines ont été calculées par l’Insee en 2020.
      </Text>
      <Text>
        L’Atlas comprend le niveau géographique « France » comme l’agrégat regroupant la France métropolitaine, les départements et régions d’Outre-mer (DROM), les collectivités d’outre-mer (COM) et la Nouvelle-Calédonie. Il prend en compte la
        création de l’académie de Normandie, intervenue le 1er janvier 2020, issue de la fusion des académies de Caen et de Rouen. Mayotte a changé de statut le 31 mars 2011, passant de COM à DROM. Ces changements de statut ont été rétropolés sur
        l’ensemble de la série.
      </Text>
      <Text>
        L’Atlas des effectifs étudiants adopte une approche strictement géographique. En conséquence, les effectifs d’étudiants inscrits dans une implantation à l’étranger d’un établissement dont le siège est situé en France ne sont comptabilisés ni
        au niveau de la France ni aux différents niveaux géographiques (unité urbaine ou commune rurale, département, académie, région) auxquelles appartient l’établissement d’origine.
      </Text>
      <Text>
        Le regroupement des diverses sources peut entraîner, à la marge, la présence de doubles comptes dans les effectifs d’inscrits dans l’enseignement supérieur, car les étudiants peuvent s’inscrire à plusieurs formations sans être repérés.
      </Text>
      <table className="fr-table">
        <caption style={{ display: "none" }} aria-hidden={false}>
          Données sources
        </caption>
        <thead>
          <tr>
            <th>Filières</th>
            <th>Sources</th>
            <th>Champs des données</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Classes préparatoires aux grandes écoles (CPGE)</td>
            <td>MESRE – SIES MESRE– DEPP Ministère en charge de l’Agriculture et de la pêche</td>
            <td>Élèves inscrits en CPGE dans les établissements publics ou privés du ministère en charge de l’Éducation nationale ou des autres ministères.</td>
          </tr>
          <tr>
            <td>Sections de techniciens supérieurs (STS) et assimilés </td>
            <td>MESRE – SIES MESRE – DEPP Ministère en charge de l’Agriculture et de la pêche</td>
            <td>
              Élèves en formations post-baccalauréat assimilées aux STS (STS, DMA, DCESF, classes de mise à niveau au BTS) y compris en apprentissage, dans les établissements publics et privés du ministère en charge de l’Éducation nationale ou des
              autres ministères
            </td>
          </tr>
          <tr>
            <td>Universités</td>
            <td>MESRE-DGESIP/DGRI-SIES</td>
            <td>
              Inscriptions principales en universités (à l’exclusion, depuis 2015-16) des doubles inscriptions des étudiants inscrits en CPGE) y inclus la formation continue diplômante, par alternance, diplômes universitaires, DUT, DAEU, enseignement
              à distance et formations d’ingénieurs. Les effectifs des universités à statut expérimentaux comprennent ceux de leurs établissements-composantes, mais pas ceux de leurs membres partenaires ou associés.
            </td>
          </tr>
          <tr>
            <td>Grands établissements MESRE</td>
            <td>MESRE-DGESIP/DGRI-SIES</td>
            <td>
              Inscriptions principales (y compris la formation continue diplômante) dans grands établissements sous tutelle du ministère en charge de l’Enseignement supérieur, hors établissements-composantes des universités à statut expérimentaux.
            </td>
          </tr>
          <tr>
            <td>Instituts nationaux polytechniques (INP) </td>
            <td>MESRE-DGESIP/DGRI-SIES</td>
            <td>Inscriptions principales à l'INP de Toulouse, de Lorraine (Jusqu’à 2010-11) et de Grenoble (jusqu’à 2006-07), y compris la formation continue diplômante et les formations d’ingénieurs.</td>
          </tr>
          <tr>
            <td>Universités de technologie (UT) </td>
            <td>MESRE-DGESIP/DGRI-SIES</td>
            <td>Inscriptions principales dans les UT de Belfort-Montbéliard, Compiègne et Troyes, y compris la formation continue diplômante et les formations d’ingénieurs.</td>
          </tr>
          <tr>
            <td>Autres formations d’ingénieurs </td>
            <td>MESRE-DGESIP/DGRI-SIES</td>
            <td>
              Inscriptions principales dans les formations d’ingénieurs d’écoles d’ingénieurs rattachées à une université (L. 719-10), des écoles publiques sous tutelle du MESRE (Ecoles centrales hors Paris, INSA et autres) ou sous tutelle des autres
              ministères, ou dans les formations d’ingénieurs des écoles d’ingénieurs privées.
            </td>
          </tr>
          <tr>
            <td>Écoles normales supérieures (ENS) </td>
            <td>MESRE-DGESIP/DGRI-SIES</td>
            <td>Toutes formations de ces écoles, hors établissements-composantes des universités à statuts expérimentaux.</td>
          </tr>
          <tr>
            <td>Établissements d’enseignement universitaire privés </td>
            <td>MESRE-DGESIP/DGRI-SIES</td>
            <td>Effectifs des formations préparant aux diplômes nationaux et autres diplômes délivrés par ces établissements.</td>
          </tr>
          <tr>
            <td>Écoles de commerce, gestion et comptabilité </td>
            <td>MESRE-DGESIP/DGRI-SIES</td>
            <td>Toutes formations d’enseignement supérieur de ces écoles (formations principales, cycles préparatoires, spécialisations, master et MBA) , hors établissements-composantes des universités à statuts expérimentaux.</td>
          </tr>
          <tr>
            <td>Écoles juridiques et administratives </td>
            <td>MESRE-DGESIP/DGRI-SIES</td>
            <td>Toutes formations d’enseignement supérieur de ces écoles. </td>
          </tr>
          <tr>
            <td>Écoles supérieures art et culture</td>
            <td>MESRE-DGESIP/DGRI-SIES</td>
            <td>Toutes formations d’enseignement supérieur de ces écoles, y compris les écoles supérieures d’architecture, de journalisme et de communication, hors établissements-composantes des universités à statuts expérimentaux.</td>
          </tr>
          <tr>
            <td>Écoles paramédicales et sociales </td>
            <td>Ministère en charge de la Santé </td>
            <td>Toutes formations d’enseignement supérieur de ces écoles, hors établissements-composantes des universités à statuts expérimentaux. Données provisoires pour 2023-24, données de 2022-23 reconduites.</td>
          </tr>
          <tr>
            <td>Autres écoles de spécialités diverses </td>
            <td>MESRE-DGESIP/DGRI-SIES MESRE– DEPP</td>
            <td>Toutes autres formations d’enseignement supérieur.</td>
          </tr>
          <tr>
            <td>Formations d'IUT</td>
            <td>MESRE-DGESIP/DGRI-SIES</td>
            <td>Inscriptions principales dans les formations de BUT, DUT, post-DUT ou DNTS.</td>
          </tr>
          <tr>
            <td>Formations d'ESPE et INSPE</td>
            <td>MESRE-DGESIP/DGRI-SIES</td>
            <td>Inscriptions principales dans les master MEEF dans les Écoles supérieures du professorat et de l'éducation (ESPE) et les Instituts supérieures du professorat et de l'éducation (INSPE).</td>
          </tr>
          <tr>
            <td>Universités à statuts expérimentaux</td>
            <td>MESRE-DGESIP/DGRI-SIES</td>
            <td>
              Ensemble des nouvelles universités qui regroupent ou fusionnent des établissements d’enseignement supérieur et de recherche publics et privés et qui expérimente de nouveaux modes d’organisation et de fonctionnement, afin de réaliser un
              projet partagé d’enseignement supérieur et de recherche défini par les établissements qu’il regroupe : CY Cergy Paris Université, Nantes Université, Université Clermont Auvergne, Université Côte d'Azur, Université de Lille, Université
              de Montpellier, Université Grenoble Alpes, Université Gustave Eiffel, Université Paris Cité, Université de Rennes, Université Toulouse Capitol, Université Paris-Panthéon-Assas, Université Paris-Saclay, Université Polytechnique
              Hauts-de-France. L’Université Paris sciences et lettres (2023) et l’Université Grenoble Alpes (2024) ont désormais un statut de grand établissement.
            </td>
          </tr>
        </tbody>
      </table>

      <Text>
        Les données sources sont proposées sous forme de jeux de données ouverts sur la plate-forme ministérielle de données ouvertes{" "}
        <Link href="https://data.enseignementsup-recherche.gouv.fr/pages/explorer/?q=atlas&sort=modified&refine.keyword=atlas_etudiants" target="_blank">
          https://data.enseignementsup-recherche.gouv.fr/pages/explorer/?q=atlas&sort=modified&refine.keyword=atlas_etudiants
        </Link>
      </Text>
    </Container>
  );
}
