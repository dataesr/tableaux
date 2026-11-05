import { Link } from 'react-router-dom';
import { createElement } from "react";
import type { AnchorHTMLAttributes } from "react";

type RouterLinkProps =  AnchorHTMLAttributes<HTMLAnchorElement> & {
  href?: string;
  replace?: boolean;
};

export default function RouterLink({ href, replace, target, children, ...props }: RouterLinkProps) {
  if (target === "_blank") {
    return createElement("a", { ...props, href, target }, children);
  }

  if (!href) {
    return createElement("span", null, children);
  }

  return createElement(Link, { ...props, to: href, replace, target }, children)
}