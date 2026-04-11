"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";

import type { SetlistSongItem } from "@/lib/api/types";

import { SetlistSongCard } from "./setlist-song-card";

type SetlistSongListProps = {
  songs: SetlistSongItem[];
  onReorder: (orderedSongIds: string[]) => void;
  onChangeKey: (itemId: string, key: string) => void;
  onSaveTransitionNotes: (itemId: string, notes: string) => void;
};

export function SetlistSongList({
  songs,
  onReorder,
  onChangeKey,
  onSaveTransitionNotes,
}: SetlistSongListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 6,
      },
    }),
  );

  const orderedSongs = [...songs].sort((a, b) => a.order - b.order);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = orderedSongs.findIndex((song) => song.id === active.id);
    const newIndex = orderedSongs.findIndex((song) => song.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    const reordered = arrayMove(orderedSongs, oldIndex, newIndex);
    onReorder(reordered.map((song) => song.id));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext
        items={orderedSongs.map((song) => song.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-4 px-4 pt-4">
          {orderedSongs.map((song) => (
            <SetlistSongCard
              key={song.id}
              song={song}
              onChangeKey={onChangeKey}
              onSaveTransitionNotes={onSaveTransitionNotes}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
