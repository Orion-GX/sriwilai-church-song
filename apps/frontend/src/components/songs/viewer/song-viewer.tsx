"use client";

import {
  SongContentDocument,
  transposeContentDocument,
} from "@/lib/songs/song-content";
import { cn } from "@/lib/utils";
import * as React from "react";
import { SongHeader } from "./song-header";
import { SongSection } from "./song-section";
import { SongViewerToolbar } from "./song-viewer-toolbar";

type SongViewerProps = {
  document: SongContentDocument;
  title?: string;
  originalKey?: string | null;
  tempo?: number | null;
  timeSignature?: string | null;
  className?: string;
  showToolbar?: boolean;
  toolbarLarge?: boolean;
  scrollContainerRef?: React.RefObject<HTMLElement | null>;
};

export function SongViewer({
  document,
  title,
  originalKey,
  tempo,
  timeSignature,
  className,
  showToolbar = true,
  toolbarLarge = false,
  scrollContainerRef,
}: SongViewerProps) {
  const [transpose, setTranspose] = React.useState(0);
  const [showChords, setShowChords] = React.useState(true);
  const [showThai, setShowThai] = React.useState(true);
  const [showEnglish, setShowEnglish] = React.useState(true);
  const [fontScale, setFontScale] = React.useState(1);

  const displayDocument = React.useMemo(
    () => transposeContentDocument(document, transpose),
    [document, transpose],
  );

  return (
    <div className="space-y-4">
      {showToolbar ? (
        <SongViewerToolbar
          originalKey={originalKey ?? ""}
          tempo={tempo ?? 0}
          timeSignature={timeSignature ?? ""}
          transpose={transpose}
          onTransposeChange={setTranspose}
          showChords={showChords}
          onShowChordsChange={setShowChords}
          fontScale={fontScale}
          onFontScaleChange={setFontScale}
          large={toolbarLarge}
        />
      ) : null}

      <div
        ref={scrollContainerRef as React.RefObject<HTMLDivElement>}
        data-testid="chordpro-view"
        className={cn(
          "rounded-lg border bg-card p-4",
          scrollContainerRef
            ? "max-h-[70vh] overflow-y-auto"
            : "max-h-[70vh] overflow-y-auto md:max-h-none md:overflow-visible",
          className,
        )}
      >
        <SongHeader
          title={title ?? displayDocument.title}
          originalKey={originalKey}
          tempo={tempo}
          timeSignature={timeSignature}
        />
        {displayDocument.intro ? (
          <p
            className="mb-4 font-mono leading-relaxed"
            style={{
              fontSize: `${0.92 * fontScale}rem`,
              color: "var(--color-red-500)",
            }}
          >
            <span className="font-bold text-primary">Intro:</span>{" "}
            <span className="font-bold text-primary">
              {displayDocument.intro.display}
            </span>
          </p>
        ) : null}
        {displayDocument.sections.map((section) => (
          <SongSection
            key={section.id}
            section={section}
            showChords={showChords}
            showThai={showThai}
            showEnglish={showEnglish}
            fontScale={fontScale}
          />
        ))}
      </div>
    </div>
  );
}
