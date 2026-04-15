"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import { SongSection } from "@/components/songs/viewer/song-section";
import { fetchSongById } from "@/lib/api/songs";
import type { SetlistSongItem } from "@/lib/api/types";
import { transposeChordSymbol } from "@/lib/chordpro/transpose";
import {
  buildDisplayDocument,
  transposeContentDocument,
} from "@/lib/songs/song-content";

const KEY_TO_INDEX: Record<string, number> = {
  C: 0,
  "C#": 1,
  Db: 1,
  D: 2,
  "D#": 3,
  Eb: 3,
  E: 4,
  F: 5,
  "F#": 6,
  Gb: 6,
  G: 7,
  "G#": 8,
  Ab: 8,
  A: 9,
  "A#": 10,
  Bb: 10,
  B: 11,
};

function extractRootKey(key: string | null | undefined): string | null {
  if (!key) return null;
  const match = key.trim().match(/^([A-G])([#b]?)/);
  if (!match) return null;
  return `${match[1]}${match[2] ?? ""}`;
}

function getSemitoneDelta(
  fromKey: string | null | undefined,
  toKey: string | null | undefined,
): number {
  const fromRoot = extractRootKey(fromKey);
  const toRoot = extractRootKey(toKey);
  if (!fromRoot || !toRoot) return 0;
  const from = KEY_TO_INDEX[fromRoot];
  const to = KEY_TO_INDEX[toRoot];
  if (from == null || to == null) return 0;
  const diff = to - from;
  if (diff > 6) return diff - 12;
  if (diff < -6) return diff + 12;
  return diff;
}

type PresentationSongPanelProps = {
  song: SetlistSongItem;
  fontScale: number;
  showMetadata: boolean;
  showChords: boolean;
};

export function PresentationSongPanel({
  song,
  fontScale,
  showMetadata,
  showChords,
}: PresentationSongPanelProps) {
  const [localTranspose, setLocalTranspose] = useState(0);

  useEffect(() => {
    setLocalTranspose(0);
  }, [song.id]);

  const {
    data: songDetail,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["song", song.songId],
    queryFn: () => fetchSongById(song.songId),
    enabled: Boolean(song.songId),
  });
  const document = useMemo(() => {
    if (!songDetail) return null;
    const sourceDocument = buildDisplayDocument(songDetail);
    const sourceKey = song.originalKey ?? songDetail.originalKey;
    const targetKey = song.selectedKey ?? sourceKey;
    const semitoneDelta =
      getSemitoneDelta(sourceKey, targetKey) + localTranspose;
    return transposeContentDocument(sourceDocument, semitoneDelta);
  }, [localTranspose, song.originalKey, song.selectedKey, songDetail]);

  const displayKey = useMemo(() => {
    const baseKey =
      song.selectedKey ?? song.originalKey ?? songDetail?.originalKey ?? null;
    if (!baseKey) return "-";
    return transposeChordSymbol(baseKey, localTranspose);
  }, [
    localTranspose,
    song.originalKey,
    song.selectedKey,
    songDetail?.originalKey,
  ]);

  return (
    <section
      className="rounded-3xl bg-card p-5 shadow-soft"
      style={{ fontSize: `${fontScale}rem` }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-2xl font-bold">{song.title}</h3>
        <div className="inline-flex items-center rounded-lg border border-input bg-background shadow-sm">
          <button
            type="button"
            className="rounded-l-lg border-r border-input px-2 py-1 text-xs font-semibold hover:bg-muted"
            onClick={() => setLocalTranspose((v) => Math.max(v - 1, -12))}
            aria-label="Transpose down one semitone"
          >
            -
          </button>
          <button
            type="button"
            className="border-r border-input px-2 py-1 text-xs font-semibold hover:bg-muted"
            onClick={() => setLocalTranspose(0)}
            aria-label="Reset transpose"
          >
            {localTranspose > 0 ? `+${localTranspose}` : localTranspose}
          </button>
          <button
            type="button"
            className="rounded-r-lg px-2 py-1 text-xs font-semibold hover:bg-muted"
            onClick={() => setLocalTranspose((v) => Math.min(v + 1, 12))}
            aria-label="Transpose up one semitone"
          >
            +
          </button>
        </div>
      </div>
      {showMetadata ? (
        <p className="mt-1 text-sm text-muted-foreground">
          {song.artist ?? "Unknown Artist"} • Key {displayKey} •{" "}
          {song.tempo ?? "--"} BPM
        </p>
      ) : null}
      <div className="mt-4 rounded-2xl bg-muted p-4">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">
            Loading song content...
          </p>
        ) : null}
        {isError ? (
          <p className="text-sm text-destructive">
            Unable to load song content. Please try again.
          </p>
        ) : null}
        {document ? (
          <div>
            {document.intro ? (
              <p
                className="mb-4 font-mono leading-relaxed"
                style={{ fontSize: `${0.92 * fontScale}rem` }}
              >
                <span className="font-bold text-primary">Intro:</span>{" "}
                <span className="font-bold text-primary">
                  {showChords ? document.intro.display : "..."}
                </span>
              </p>
            ) : null}
            {document.sections.map((section) => (
              <SongSection
                key={section.id}
                section={section}
                showChords={showChords}
                showThai
                showEnglish
                fontScale={fontScale}
              />
            ))}
          </div>
        ) : song.notes ? (
          <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
            {song.notes}
          </p>
        ) : null}
      </div>
      {song.transitionNotes ? (
        <blockquote className="mt-4 rounded-xl bg-secondary-container p-3 text-sm italic text-secondary">
          {song.transitionNotes}
        </blockquote>
      ) : null}
    </section>
  );
}
