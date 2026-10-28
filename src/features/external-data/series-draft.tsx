"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useContext,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";

import type { seriesSchema } from "./schema";

export type SeriesFieldName = keyof typeof seriesSchema.shape;
type SeriesValues = Record<SeriesFieldName, string>;
const initialValues: SeriesValues = {
  name: "",
  metric: "USD_BRL",
  frequency: "DAILY",
  geography: "",
  sourceName: "",
  sourceUrl: "",
  staleAfterDays: "7",
};
const SeriesDraft = createContext<{
  values: SeriesValues;
  setValues: Dispatch<SetStateAction<SeriesValues>>;
  step: number;
  setStep: Dispatch<SetStateAction<number>>;
} | null>(null);

function DraftState({ children }: { children: ReactNode }) {
  const [values, setValues] = useState<SeriesValues>(initialValues);
  const [step, setStep] = useState(0);
  return (
    <SeriesDraft value={{ values, setValues, step, setStep }}>
      {children}
    </SeriesDraft>
  );
}

export function SeriesDraftProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  // Error redirects change only the query. Leaving this page discards the draft,
  // including after a successful creation redirects to the new series history.
  return <DraftState key={pathname}>{children}</DraftState>;
}

export function useSeriesDraft() {
  const draft = useContext(SeriesDraft);
  if (!draft) throw new Error("Cadastro de série sem contexto de formulário.");
  return draft;
}
