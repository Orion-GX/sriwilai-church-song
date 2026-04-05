import { LoginForm } from "@/components/auth/login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  const raw = searchParams.next;
  const redirectTo =
    typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : undefined;

  return <LoginForm redirectTo={redirectTo} />;
}
