"use client";

import { FavoriteButton } from "@/components/songs/favorite-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { SongListItem } from "@/lib/api/types";
import { Music2 } from "lucide-react";
import Link from "next/link";

type SongResultCardProps = {
  song: SongListItem;
  handleClick: () => void;
};

export function SongResultCard({ song, handleClick }: SongResultCardProps) {
  return (
    <Card className="bg-card transition-colors hover:bg-muted/80">
      <CardContent
        className="relative p-4 md:p-5"
        data-testid="song-result-card"
        onClick={handleClick}
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex min-w-0 items-start gap-3 pr-10 md:gap-4 md:pr-0">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary-container text-secondary">
              <Music2 className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0">
              <Link
                href={`/songs/${song.id}`}
                className="block truncate font-display text-base font-semibold tracking-tight text-foreground hover:underline md:text-[1.05rem]"
              >
                {song.title}
              </Link>
              {/* <p className="mt-1 text-sm text-muted-foreground">
                คีย์{" "}
                <span className="font-semibold text-foreground">
                  {song.originalKey ?? "-"}
                </span>
              </p> */}
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-[10px] tracking-normal md:text-xs"
                >
                  คีย์: {song.originalKey ?? "-"}
                </Badge>
                {/* <Badge
                  variant="outline"
                  className="text-[10px] uppercase tracking-normal md:text-xs"
                >
                  Views: {song.viewCount}
                </Badge> */}
                {/* {song.category ? (
                  <Badge
                    variant="secondary"
                    className="text-[10px] uppercase tracking-normal md:text-xs"
                  >
                    {song.category.name}
                  </Badge>
                ) : null}
                {song.tags.slice(0, 2).map((tag) => (
                  <Badge
                    key={tag.id}
                    variant="outline"
                    className="text-[10px] uppercase tracking-normal md:text-xs"
                  >
                    {tag.name}
                  </Badge>
                ))} */}
              </div>
            </div>
          </div>

          <div
            className="absolute right-4 top-4 flex items-center gap-2 md:static shadow-card"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <FavoriteButton songId={song.id} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
