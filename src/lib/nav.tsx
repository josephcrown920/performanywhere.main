// Compatibility layer: lets the original screens keep their simple Link/useLocation calls on top of TanStack Router.
import { Link as TLink, useNavigate, useRouterState } from "@tanstack/react-router";
import type { AnchorHTMLAttributes, ReactNode } from "react";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & { to?: string; href?: string; children?: ReactNode };

export function Link({ to, href, ...rest }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <TLink to={(to ?? href ?? "/") as any} {...(rest as any)} />;
}

export function useLocation(): [string, (to: string) => void] {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return [pathname, (to: string) => navigate({ to: to as any })];
}
