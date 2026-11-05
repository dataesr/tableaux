import { useTitle } from "../../hooks/usePageTitle";
import { Layout } from "../../layout/layout";

export default function GlobalLayout() {
  useTitle("Nous contacter");

  return <Layout serviceTag="Contact" />;
}
