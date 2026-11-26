import { Skiplinks } from "@dataesr/dsfr-plus";
import { ComponentProps, ReactNode } from "react";
import { Outlet, useSearchParams } from "react-router-dom"

import { getI18nLabel } from "../utils";
import FooterWrapper from "./footer";
import HeaderWrapper from "./header";
import i18n from "./i18n.json";

type LayoutProps = ComponentProps<typeof HeaderWrapper> & {
  before?: ReactNode;
  children?: ReactNode;
  footer?: ComponentProps<typeof FooterWrapper>;
};

export function Layout({ before, children, footer, ...headerProps }: LayoutProps) {
  const [searchParams] = useSearchParams();
  const lang = searchParams.get("language")?.toLowerCase() === "en" ? "en" : "fr";
  const t = (key: string) => getI18nLabel(i18n, key, lang);
  const hasNav = !!headerProps.items?.length || !!headerProps.navExtra;

  return (
    <>
      <Skiplinks
        aria-label={t("skipLinks")}
        links={[
          { href: "#main-content", label: t("skipContent") },
          ...(hasNav ? [{ href: "#main-menu", label: t("skipMenu") }] : []),
          { href: "#footer", label: t("skipFooter") },
        ]}
      />
      <HeaderWrapper {...headerProps} />
      <main id="main-content" tabIndex={-1}>
        {before}
        {children ?? <Outlet />}
      </main>
      <FooterWrapper {...footer} />
    </>
  )
}

export default Layout;
