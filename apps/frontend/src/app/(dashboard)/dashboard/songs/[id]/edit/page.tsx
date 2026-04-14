"use client";

import { useParams, useRouter } from "next/navigation";
import * as React from "react";

export default function EditSongPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  React.useEffect(() => {
    if (!id) return;
    router.replace(`/dashboard/songs/${id}?mode=edit`);
  }, [id, router]);

  return null;
}
