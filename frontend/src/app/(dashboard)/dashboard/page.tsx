import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardHomePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">Welcome back</p>
        <h2 className="text-2xl font-semibold tracking-tight">
          Dashboard overview
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Setlists</CardTitle>
            <CardDescription>Personal setlists from the API.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Navigate via the sidebar or open{" "}
            <code className="rounded bg-muted px-1 py-0.5">/dashboard/setlists</code>
            .
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Theme</CardTitle>
            <CardDescription>Light, dark, or system.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Use the toggle in the top bar. Preference is stored by{" "}
            <code className="rounded bg-muted px-1 py-0.5">next-themes</code>.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
