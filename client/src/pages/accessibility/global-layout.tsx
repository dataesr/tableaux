import { useTitle } from "../../hooks/usePageTitle";
import { Layout } from "../../layout/layout";

export default function GlobalLayout() {
  useTitle("Accessibilité");

  return <Layout serviceTag="Accessibilité" />;
}
