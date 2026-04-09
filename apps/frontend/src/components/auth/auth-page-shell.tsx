import { SiteHeader } from "@/components/layout/site-header";

type AuthPageShellProps = {
  children: React.ReactNode;
};

/**
 * Shell สำหรับหน้า login/register — ใช้แถบนำทางเดียวกับหน้าเพลง
 */
export function AuthPageShell({ children }: AuthPageShellProps) {
  return (
    <div
      className="flex min-h-screen flex-col bg-background"
      data-testid="page-auth-shell"
    >
      <SiteHeader />
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-8">
        {children}
      </div>
    </div>
  );
}
