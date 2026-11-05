import { ComponentProps, ReactNode } from "react";
import { Outlet } from "react-router-dom";

import Footer from "../components/footer";
import Header from "./header";

type LayoutProps = ComponentProps<typeof Header> & {
  // Contenu rendu dans <main> avant la page (ex. barre de sélection d'un board)
  before?: ReactNode;
  // Rendu à la place de <Outlet /> pour les pages hors routeur imbriqué
  children?: ReactNode;
  footer?: ComponentProps<typeof Footer>;
};

// Layout unique de l'application : en-tête (avec liens d'évitement), <main id="main-content"> et pied de page.
export function Layout({ before, children, footer, ...headerProps }: LayoutProps) {
  return (
    <>
      <Header {...headerProps} />
      <main id="main-content" tabIndex={-1}>
        {before}
        {children ?? <Outlet />}
      </main>
      <Footer {...footer} />
    </>
  );
}

export default Layout;
