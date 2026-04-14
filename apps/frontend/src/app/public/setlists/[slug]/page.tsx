"use client";

import { PresentationModeButton } from "@/components/setlists/presentation-mode-button";
import { PresentationModeScreen } from "@/components/setlists/presentation-mode-screen";
import { usePublicSetlist } from "@/lib/setlists";
import { usePresentationMode } from "@/lib/setlists/hooks";

export default function PublicSetlistPage({
  params,
}: {
  params: { slug: string };
}) {
  const query = usePublicSetlist(params.slug);
  const presentation = usePresentationMode(
    query.data?.presentationLayout ?? "vertical",
  );

  if (query.isLoading) {
    return (
      <main className="mx-auto max-w-3xl p-6 text-sm text-muted-foreground">
        Loading public setlist...
      </main>
    );
  }

  if (query.isError || !query.data) {
    return (
      <main className="mx-auto max-w-3xl p-6">
        <h1 className="text-2xl font-semibold">Setlist unavailable</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This setlist is private, disabled, or the link is invalid.
        </p>
      </main>
    );
  }

  const setlist = query.data;
  const songs = [...setlist.songs].sort((a, b) => a.order - b.order);
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-5">
      <header>
        <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">
          Public Setlist
        </p>
        <h1 className="text-3xl font-bold">{setlist.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {(setlist.serviceDate
            ? new Date(setlist.serviceDate).toLocaleDateString()
            : "Upcoming service") +
            ` • ${setlist.location ?? "Main Sanctuary"}`}
        </p>
      </header>
      <PresentationModeButton onClick={presentation.open} />
      <section className="space-y-3">
        {songs.map((song, idx) => (
          <article key={song.id} className="rounded-2xl bg-card p-4 shadow-card">
            <p className="text-xs font-semibold uppercase text-muted-foreground">
              Song {idx + 1}
            </p>
            <h2 className="mt-1 text-xl font-semibold">{song.title}</h2>
            <p className="text-sm text-muted-foreground">
              {song.artist ?? "Unknown Artist"} • Key:{" "}
              {song.selectedKey ?? song.originalKey ?? "-"} • {song.bpm ?? "--"} BPM
            </p>
            {song.transitionNotes ? (
              <p className="mt-2 rounded-xl bg-muted p-3 text-sm italic text-muted-foreground">
                {song.transitionNotes}
              </p>
            ) : null}
          </article>
        ))}
      </section>
      <PresentationModeScreen
        open={presentation.isOpen}
        setlist={setlist}
        layout={presentation.layout}
        allowReorder={false}
        showMetadata={presentation.showMetadata}
        showChords={presentation.showChords}
        fontScale={presentation.fontScale}
        onClose={presentation.close}
        onLayoutChange={presentation.setLayout}
        onToggleMetadata={presentation.toggleMetadata}
        onToggleChords={presentation.toggleChords}
        onFontScaleChange={presentation.setFontScale}
      />
    </main>
  );
}
