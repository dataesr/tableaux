import { Col, Container, Row, Title } from "@dataesr/dsfr-plus";

export default function MethodologiePage() {
    return (
        <Container className="outcomes-section-page outcomes-flux-page">
            <Row gutters>
                <Col lg={12}>
                    <div className="outcomes-flux-page__params fr-mb-3w">
                        <Title as="h1" look="h4" className="fr-mb-2w">
                            Méthodologie et définitions
                        </Title>

                        <Title as="h2" look="h5" className="fr-mt-3w fr-mb-2w">
                            Données
                        </Title>

                        <p className="fr-mb-2w">
                            Gestion des doubles inscriptions : les étudiants peuvent s'inscrire dans plusieurs formations ou dans une même formation dans différents établissements. Seule la formation "principale" est conservée, c'est-à-dire celle menant au diplôme le plus élevé. Les étudiants inscrits en CPGE et simultanément en licence sont exclus du champ.
                        </p>

                        <p className="fr-mb-2w">
                            Sources : les informations sur les lieux de scolarisation en terminale et les résultats au baccalauréat sont issus du système d'information CYCLADES du ministère de l'éducation nationale (MEN). Les inscriptions et diplomations à l'université et dans les écoles d'ingénieur, de commerce et de la culture sont issues du dispositif SISE du ministère de l'enseignement supérieur, de la recherche et de l'espace (MESRE). Les réorientations et diplomations en BTS ou en CPGE sont retrouvées grâce au système d'information SCOLARITE et SCOLEGE du MEN et du MESRE. Lorsqu'un étudiant qui souhaite se réorienter accepte sur Parcoursup une formation pour laquelle les données individuelles ne sont pas disponibles, on considère qu'il est effectivement inscrit dans cette formation.
                        </p>

                        <p>
                            <b>Champ :</b> Les néo-bacheliers inscrits en L1 en 2019
                        </p>

                        <Title as="h2" look="h5" className="fr-mt-3w fr-mb-2w">
                            Définitions
                        </Title>

                        <p className="fr-mb-2w">
                            L'origine sociale correspond à la PCS du responsable légal. Elle peut être :
                        </p>
                        <ul className="fr-mb-2w">
                            <li>Très favorisée : chefs d'entreprise de 10 salariés ou plus, cadres, professions intellectuelles supérieures, professeurs ;</li>
                            <li>Favorisée : professions intermédiaires (hors professeurs), retraités des catégories favorisées ;</li>
                            <li>Assez défavorisée : agriculteurs exploitants, artisans, commerçants, employés ;</li>
                            <li>Défavorisée : ouvriers, inactifs, chômeurs n'ayant jamais travaillé.</li>
                        </ul>

                        <p className="fr-mb-2w">
                            Le devenir en un an correspond à la situation des étudiants un an après leur première inscription en 2019 :
                        </p>
                        <ul className="fr-mb-2w">
                            <li>Passage en L2 dans la même licence ou dans une licence du même groupe disciplinaire ;</li>
                            <li>Redoublement en L1 dans la même licence ou dans une licence du même groupe disciplinaire ;</li>
                            <li>Réorientation vers d'autres formations que la licence ou vers une licence d'un autre groupe disciplinaire, avec ou sans perte de temps ;</li>
                            <li>Sortie de l'enseignement supérieur français.</li>
                        </ul>

                        <p className="fr-mb-2w">
                            Les sortants de l'enseignement supérieur peuvent soit renoncer à faire des études ou entrer sur le marché du travail, soit décider de poursuivre des études à l'étranger ou dans des formations pour lesquelles les données individuelles ne sont pas disponibles.
                        </p>

                        <p className="fr-mb-2w">Les parcours types sont construits selon les trajectoires les plus fréquentes qui sont :</p>
                        <ul className="fr-mb-2w">
                            <li>
                                Parcours linéaire : diplômés de la licence dans laquelle ils étaient inscrits en 2019 ou une licence du même groupe disciplinaire. Ces étudiants sont restés inscrits en licence dans la même spécialité avant l'obtention du diplôme, même avec une interruption temporaire des études.
                            </li>
                            <li>
                                Réorientations accomplies : réorientés et diplômés d'un autre diplôme que la licence dans laquelle ils étaient inscrits, ou valident leur diplôme de 2019 en passant par d'autres formations que la licence avant l'obtention du diplôme. Quand ces réorientés ne sont pas diplômés, ils ont au minimum atteint un niveau d'études BAC+3 en 2023-2024 (dernière année d'observation) ou avant.
                            </li>
                            <li>
                                Inscriptions récurrentes sans dépasser le niveau BAC+3 : non-diplômés restés inscrits au moins 3 fois sur les 5 années d'observation sans dépasser le niveau BAC+3. Les trajectoires de ces étudiants sont marquées par des sorties temporaires, des redoublements et des réorientations vers d'autres formations et/ou secteurs disciplinaires. Ils peuvent atteindre un niveau d'étude égale à BAC+3 sans s'être réorientés, sinon un BAC+2 ou ne jamais dépasser le niveau BAC+1.
                            </li>
                            <li>
                                Inscrits moins de deux fois durant la période d'observation : non-diplômés qui ne s'inscrivent pas plus de 2 fois dans l'enseignement supérieur durant la période d'observation et ne dépasse jamais le niveau BAC+2.
                            </li>
                        </ul>
                        <p>
                            Application basée sur une première version conçue et développée par Caroline WIRTH - département des études statistiques de l'enseignement supérieur (MESRE-SIES)
                        </p>
                    </div>
                </Col>
            </Row>
        </Container>
    );
}
