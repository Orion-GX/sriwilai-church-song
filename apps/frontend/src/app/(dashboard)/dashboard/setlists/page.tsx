"use client";

import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { SetDashboardTitle } from "@/components/layout/set-dashboard-title";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionHeader } from "@/components/ui/section-header";
import { useSetlistsRepository } from "@/lib/setlists";

export default function DashboardSetlistsPage() {
  const repository = useSetlistsRepository();
  const setlists = repository.listQuery.data ?? [];

  return (
    <>
      <SetDashboardTitle title="Setlists" />
      <PageContainer data-testid="page-setlists">
        <div className="mb-4 flex items-center justify-between gap-3">
          <SectionHeader
            title="Setlists"
            description="Build and manage worship set flow for your team."
          />
          <Button
            type="button"
            onClick={() =>
              repository.createMutation.mutate({
                title: "Sunday Morning",
                location: "Main Sanctuary",
                durationMinutes: 45,
                teamName: "Worship Team",
              })
            }
            disabled={repository.createMutation.isPending}
          >
            New Setlist
          </Button>
        </div>
        <div className="space-y-3">
          {setlists.map((setlist) => (
            <Link key={setlist.id} href={`/dashboard/setlists/${setlist.id}`}>
              <Card className="transition hover:translate-y-[-1px]">
                <CardHeader className="pb-2">
                  <CardTitle>{setlist.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground">
                  {(setlist.serviceDate
                    ? new Date(setlist.serviceDate).toLocaleDateString()
                    : "No date") +
                    ` • ${setlist.location ?? "Main Sanctuary"} • ${setlist.totalItems} songs`}
                </CardContent>
              </Card>
            </Link>
          ))}
          {setlists.length === 0 ? (
            <Card variant="flat">
              <CardContent className="pt-5 text-sm text-muted-foreground">
                No setlists yet. Create your first worship setlist.
              </CardContent>
            </Card>
          ) : null}
        </div>
      </PageContainer>
    </>
  );
}
