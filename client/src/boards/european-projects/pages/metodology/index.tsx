import { Container } from "@dataesr/dsfr-plus";
import Breadcrumb from "../../../../components/breadcrumb";
import navigationConfig from "../../navigation-config.json";
import TabsContent from "./components/tab-content";

export default function Methodology() {
  return (
    <Container as="main">
      <Breadcrumb config={navigationConfig} />
      <TabsContent />
    </Container>
  );
}
