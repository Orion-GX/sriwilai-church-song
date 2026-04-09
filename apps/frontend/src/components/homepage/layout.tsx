import { SiteHeader } from "@/components/layout/site-header";

type LayoutProps = {
  children: React.ReactNode;
};

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <SiteHeader />
      {children}
    </div>
  );
}
