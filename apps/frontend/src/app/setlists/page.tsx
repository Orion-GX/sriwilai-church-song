"use client";

import Link from "next/link";

import { PageContainer } from "@/components/layout/page-container";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSetlistsRepository } from "@/lib/setlists";

export default function GuestSetlistsPage() {
  const repository = useSetlistsRepository();
  const setlists = repository.listQuery.data ?? [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <PageContainer maxWidth="layout" className="py-5 md:py-8">
          <div className="mx-auto max-w-md space-y-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold">เซ็ตลิสต์เพลง</h1>
              <p className="text-sm text-muted-foreground">
                ยังไม่เข้าสู่ระบบ: เซ็ตลิสต์จะถูกเก็บในเครื่องนี้เท่านั้น
                (สูงสุด {5} รายการ)
              </p>
            </div>
            <Button
              type="button"
              className="w-full"
              onClick={() =>
                repository.createMutation.mutate({
                  title: "Guest Setlist",
                  location: "Main Sanctuary",
                  durationMinutes: 45,
                })
              }
              disabled={!repository.canCreateGuestSetlist}
            >
              สร้างเซ็ตลิสต์เพลง
            </Button>
            <div className="space-y-3">
              {setlists.map((setlist) => (
                <Link key={setlist.id} href={`/setlists/${setlist.id}`}>
                  <Card className="mb-2 rounded-2xl p-4">
                    <h2 className="text-lg font-semibold">{setlist.title}</h2>
                    <p className="text-sm text-muted-foreground">
                      {setlist.totalItems} เพลง • {setlist.durationMinutes ?? 0}{" "}
                      นาที
                    </p>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </PageContainer>
      </main>
    </div>
  );
}
