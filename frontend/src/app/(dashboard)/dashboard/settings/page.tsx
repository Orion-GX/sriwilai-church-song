import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function DashboardSettingsPage() {
  return (
    <>
      <SetDashboardTitle title="Settings" />
      <div className="mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Profile and app preferences.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Scaffold page—add forms and API calls as needed.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
