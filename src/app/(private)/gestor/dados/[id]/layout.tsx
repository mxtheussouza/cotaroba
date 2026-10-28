import type { ReactNode } from "react";

import { ObservationDraftProvider } from "@/features/external-data/observation-draft";

export default function ExternalHistoryLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <ObservationDraftProvider>{children}</ObservationDraftProvider>;
}
