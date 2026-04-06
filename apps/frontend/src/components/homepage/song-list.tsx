import { SongItem, type SongItemProps } from "@/components/homepage/song-item";

type SongListProps = {
  heading: string;
  songs: SongItemProps[];
};

export function SongList({ heading, songs }: SongListProps) {
  return (
    <section aria-labelledby="song-list-heading">
      <h3
        id="song-list-heading"
        className="mb-4 text-left text-sm font-bold text-red-600 sm:text-base"
      >
        {heading}
      </h3>
      <ul className="space-y-0.5">
        {songs.map((song) => (
          <SongItem key={`${song.title}-${song.meta}`} {...song} />
        ))}
      </ul>
    </section>
  );
}
