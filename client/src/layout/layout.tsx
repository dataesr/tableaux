import { ComponentProps, ReactNode } from "react";
import { Outlet } from "react-router-dom"
import Footer from "../components/footer";
import Header from "./header";

type LayoutProps = ComponentProps<typeof Header> & {
  before?: ReactNode;
  children?: ReactNode;
  footer?: ComponentProps<typeof Footer>;
};

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
  )
}

export default Layout;
