import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardSetlistsPage() {
  return (
    <>
      <SetDashboardTitle title="Setlists" />
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Your setlists</CardTitle>
            <CardDescription>
              Placeholder—fetch from{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                NEXT_PUBLIC_API_URL
              </code>{" "}
              when wired.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No data yet. Add a data layer (e.g. TanStack Query + fetch with
              Bearer token) in a follow-up.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
