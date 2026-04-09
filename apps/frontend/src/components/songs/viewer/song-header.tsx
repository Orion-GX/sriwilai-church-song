"use client";

type SongHeaderProps = {
  title?: string;
  originalKey?: string | null;
  tempo?: number | null;
  timeSignature?: string | null;
};

export function SongHeader({
  title,
  originalKey,
  tempo,
  timeSignature,
}: SongHeaderProps) {
  if (!title && !originalKey && !tempo && !timeSignature) return null;
  const meta: string[] = [];
  if (originalKey) meta.push(`Key ${originalKey}`);
  if (tempo != null) meta.push(`${tempo} BPM`);
  if (timeSignature) meta.push(timeSignature);

  return (
    <header className="mb-4">
      {title ? <h2 className="text-xl font-bold text-foreground">{title}</h2> : null}
      {meta.length > 0 ? (
        <p className="mt-1 text-sm text-muted-foreground">{meta.join(" · ")}</p>
      ) : null}
    </header>
  );
}
