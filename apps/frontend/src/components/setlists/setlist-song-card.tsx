"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SetlistSongItem } from "@/lib/api/types";
import { cn } from "@/lib/utils";

const KEY_OPTIONS = [
  "C",
  "Cm",
  "C#",
  "C#m",
  "D",
  "Dm",
  "Eb",
  "E",
  "Em",
  "F",
  "Fm",
  "F#",
  "G",
  "Gm",
  "Ab",
  "A",
  "Am",
  "Bb",
  "B",
  "Bm",
];

type SetlistSongCardProps = {
  song: SetlistSongItem;
  onChangeKey: (itemId: string, key: string) => void;
  onChangeBpm: (itemId: string, bpm: number | null) => void;
  onSaveTransitionNotes: (itemId: string, notes: string) => void;
  onDeleteSong: (itemId: string) => void;
};

export function SetlistSongCard({
  song,
  onChangeKey,
  onChangeBpm,
  onSaveTransitionNotes,
  onDeleteSong,
}: SetlistSongCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: song.id });
  const [bpmDraft, setBpmDraft] = useState(song.bpm ? String(song.bpm) : "");

  useEffect(() => {
    setBpmDraft(song.bpm ? String(song.bpm) : "");
  }, [song.bpm]);

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "mb-1 rounded-3xl bg-card p-4 shadow-card transition",
        isDragging ? "opacity-70" : "",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="rounded-xl p-2 text-muted-foreground hover:bg-muted"
          aria-label="Drag handle"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="truncate text-xl font-semibold text-foreground">
                {song.title}
              </h3>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {song.artist ?? "Unknown Artist"} • Key:{" "}
              </p>
            </div>
            <div className="mt-1 flex items-center gap-1">
              {/* <Pencil className="h-4 w-4 text-muted-foreground" /> */}
              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                aria-label={`ลบเพลง ${song.title} ออกจากเซ็ตลิสต์`}
                onClick={() => onDeleteSong(song.id)}
                data-testid={`setlist-song-delete-${song.id}`}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </button>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <div className="w-28">
              <Select
                value={song.selectedKey ?? song.originalKey ?? "C"}
                onValueChange={(value) => onChangeKey(song.id, value)}
              >
                <SelectTrigger className="h-8 rounded-xl bg-muted text-xs">
                  <SelectValue placeholder="Key" />
                </SelectTrigger>
                <SelectContent>
                  {KEY_OPTIONS.map((key) => (
                    <SelectItem key={key} value={key}>
                      {key}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-24">
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                max={300}
                value={bpmDraft}
                onChange={(e) => setBpmDraft(e.target.value)}
                onBlur={() => {
                  const parsed = Number.parseInt(bpmDraft, 10);
                  onChangeBpm(
                    song.id,
                    Number.isNaN(parsed) || parsed <= 0 ? null : parsed,
                  );
                }}
                placeholder="Tempo"
                className="h-8 rounded-xl bg-muted text-xs"
                aria-label={`Tempo ของเพลง ${song.title}`}
              />
            </div>
          </div>

          {/* <div className="mt-3">
            <TransitionNotesAccordion
              value={song.transitionNotes}
              onSave={(value) => onSaveTransitionNotes(song.id, value)}
            />
          </div> */}
        </div>
      </div>
    </article>
  );
}
