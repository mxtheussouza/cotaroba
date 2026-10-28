import type { ReactNode } from "react";

import { SeriesDraftProvider } from "@/features/external-data/series-draft";

export default function ExternalDataLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <SeriesDraftProvider>{children}</SeriesDraftProvider>;
}
