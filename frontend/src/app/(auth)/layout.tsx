import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center bg-background px-4 py-8"
      data-testid="page-auth-shell"
    >
      <Link
        href="/"
        className="absolute left-4 top-4 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        ← Home
      </Link>
      {children}
    </div>
  );
}
