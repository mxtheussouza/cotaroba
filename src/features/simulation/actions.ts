"use server";

import { headers } from "next/headers";

import { parseAuthConfig } from "@/features/auth/schema";

import { calculateSimulation } from "./calculate";
import {
  initialSimulationState,
  simulationSchema,
  type SimulationState,
  type SimulationValues,
} from "./schema";

export async function simulateAction(
  _previous: SimulationState,
  form: FormData,
): Promise<SimulationState> {
  if ((await headers()).get("origin") !== parseAuthConfig(process.env).baseURL)
    return {
      ...initialSimulationState,
      error:
        "Origem não permitida. Reabra o simulador pelo endereço oficial do site.",
    };
  // Only bounded, allowlisted strings are returned to the form; no persistence or logs.
  const input = Object.fromEntries(
    Object.keys(initialSimulationState.values).map((key) => [
      key,
      form.get(key),
    ]),
  );
  const parsed = simulationSchema.safeParse(input);
  if (!parsed.success) {
    const values = Object.fromEntries(
      Object.keys(initialSimulationState.values).map((key) => [
        key,
        typeof input[key] === "string" ? input[key].slice(0, 18) : "",
      ]),
    ) as SimulationValues;
    return {
      values,
      result: null,
      error:
        "Confira os campos: peso até 2.000 kg (três casas), rendimento maior que zero e até 100%, preço positivo até R$ 1.000.000 e custo de zero a R$ 10.000.000. Use até duas casas para percentuais e dinheiro, sem separador de milhar.",
    };
  }
  return {
    values: parsed.data,
    result: calculateSimulation(parsed.data),
    error: null,
  };
}
