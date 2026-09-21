import { Container, Row, Col } from "@dataesr/dsfr-plus";

type Props = {
  filter?: "all" | "erc" | "msca";
};
const defaultProps = {
  filter: "all",
} satisfies Props;

export default function Calls(props: Props) {
  const { filter } = { ...defaultProps, ...props };
  return (
    <Container>
      <Row>
        <Col>
          Liste des appels à projets. <br />
          filtre : {filter}
        </Col>
      </Row>
    </Container>
  );
}
