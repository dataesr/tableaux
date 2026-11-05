import { useSearchParams } from "react-router-dom";

import { useTitle } from "../../hooks/usePageTitle";
import { Layout } from "../../layout/layout";
import { getI18nLabel } from "../../utils";
import i18n from "./i18n.json";

import "./styles.scss";

export default function GlobalLayout() {
  const [searchParams] = useSearchParams();
  const currentLang = searchParams.get("language") || "fr";
  const title = getI18nLabel(i18n, "pageTitle", currentLang);

  useTitle(title);

  return <Layout languageSelector serviceTag={title} />;
}
