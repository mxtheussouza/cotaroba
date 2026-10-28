"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type RefObject,
  type SetStateAction,
} from "react";

import type { observationSchema } from "./schema";

export type ObservationFieldName = keyof typeof observationSchema.shape;
type Values = Record<ObservationFieldName, string>;
export const emptyObservation: Values = {
  periodStart: "",
  periodEnd: "",
  value: "",
  validUntil: "",
};
const ObservationDraft = createContext<{
  values: Values;
  setValues: Dispatch<SetStateAction<Values>>;
  pendingSubmissionRef: RefObject<boolean>;
} | null>(null);

function DraftState({ children }: { children: ReactNode }) {
  const [values, setValues] = useState(emptyObservation);
  const pendingSubmissionRef = useRef(false);
  return (
    <ObservationDraft value={{ values, setValues, pendingSubmissionRef }}>
      {children}
    </ObservationDraft>
  );
}

export function ObservationDraftProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  // A same-path action redirect must not discard fields rejected by the server.
  return <DraftState key={pathname}>{children}</DraftState>;
}

export function useObservationDraft() {
  const draft = useContext(ObservationDraft);
  if (!draft) throw new Error("Registro sem contexto de formulário.");
  return draft;
}
