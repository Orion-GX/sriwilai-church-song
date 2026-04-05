import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function HomePage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 py-16" data-testid="page-home">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Plan worship setlists with clarity
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Next.js shell with auth pages and a dashboard layout—wire it to your
          Nest API when you are ready.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/login" className={buttonClassName()}>
            Sign in
          </Link>
          <Link href="/register" className={buttonClassName("outline")}>
            Create account
          </Link>
        </div>
      </div>

      <div className="mx-auto mt-20 grid max-w-4xl gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>App Router</CardTitle>
            <CardDescription>
              Route groups for marketing, auth, and the dashboard shell.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Tailwind, dark mode, and small UI primitives live under{" "}
            <code className="rounded bg-muted px-1 py-0.5">src/components</code>
            .
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>
              Sidebar navigation with a responsive drawer on small screens.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard" className={buttonClassName("secondary")}>
              Open dashboard
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
