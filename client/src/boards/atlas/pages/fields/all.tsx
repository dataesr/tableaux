import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { Col, Container, Row } from "@dataesr/dsfr-plus";
import FilieresSectorsChart from "../../charts/filieres-sectors.tsx";
import {
  getNumberOfStudents,
  getNumberOfStudentsByGenderAndLevel,
} from "../../../../api/atlas.ts";

import FilieresGendersChart from "../../charts/filieres-genders.tsx";
import FilieresList from "../../../../components/filieres-list/index.tsx";

export default function AllFields() {
  const [searchParams] = useSearchParams();

  const params = [...searchParams].map(([key, value]) => `${key}=${value}`).join("&");

  const { data, isLoading } = useQuery({
    queryKey: ["atlas/number-of-students", params],
    queryFn: () => getNumberOfStudents(params),
  });

  const { data: dataByGender, isLoading: isLoadinByGender } = useQuery({
    queryKey: ["atlas/number-of-students-by-gender-and-level", params],
    queryFn: () => getNumberOfStudentsByGenderAndLevel(params),
  });

  return (
    <>
      <Container as="section" fluid>
        <Row>
          <Col>
            <FilieresList />
          </Col>
        </Row>
        <Row className="fr-my-5w">
          <Col>
            <FilieresSectorsChart data={data?.filieres || []} isLoading={isLoading} />
          </Col>
        </Row>
        <Row className="fr-my-5w">
          <Col>
            <FilieresGendersChart data={dataByGender || []} isLoading={isLoadinByGender} />
          </Col>
        </Row>
      </Container>
    </>
  );
}
