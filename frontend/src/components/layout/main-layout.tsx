import { type ReactNode } from "react";
import { Header } from "./header";
import { Footer } from "./footer";

interface MainLayoutProps {
  children: ReactNode;
  hideFooter?: boolean;
}

export function MainLayout({ children, hideFooter = false }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex-1">{children}</div>
      {!hideFooter && <Footer />}
    </div>
  );
}
