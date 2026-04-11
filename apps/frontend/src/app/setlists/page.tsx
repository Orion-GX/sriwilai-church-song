"use client";

import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useSetlistsRepository } from "@/lib/setlists";

export default function GuestSetlistsPage() {
  const repository = useSetlistsRepository();
  const setlists = repository.listQuery.data ?? [];

  return (
    <main className="mx-auto min-h-screen max-w-md space-y-4 bg-background px-4 py-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">My Setlists</h1>
        <p className="text-sm text-muted-foreground">
          Guest mode stores up to {5} setlists on this device.
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
        Create Setlist
      </Button>
      <div className="space-y-3">
        {setlists.map((setlist) => (
          <Link key={setlist.id} href={`/setlists/${setlist.id}`}>
            <Card className="rounded-2xl p-4">
              <h2 className="text-lg font-semibold">{setlist.title}</h2>
              <p className="text-sm text-muted-foreground">
                {setlist.totalItems} songs • {setlist.durationMinutes ?? 0} min
              </p>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
