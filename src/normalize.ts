import type { TrackingEvent, TrackingResponse } from "./types.js";

/** Forma simple y estable para pintar en la UI, sin depender del JSON crudo. */
export interface NormalizedTracking {
  ot: string;
  /** true si Chilexpress respondio statusCode 0. */
  ok: boolean;
  statusCode: number | null;
  /** Descripcion del estado (o del error de negocio). */
  statusText: string;
  /** Estado actual legible (ultimo evento si existe). */
  currentStatus: string;
  events: TrackingEvent[];
  /** Respuesta cruda por si se necesita algun campo extra. */
  raw: unknown;
}

/** Busca de forma tolerante un arreglo de eventos dentro del `data`. */
function extractEvents(data: unknown): TrackingEvent[] {
  if (!data || typeof data !== "object") return [];
  const d = data as Record<string, unknown>;
  const candidateKeys = ["statusList", "events", "eventos", "history", "movimientos", "tracking"];
  for (const key of candidateKeys) {
    const val = d[key];
    if (Array.isArray(val)) return val as TrackingEvent[];
  }
  return [];
}

/** Convierte el sobre de tracking a una forma simple para la UI. */
export function normalizeTracking(ot: string, res: TrackingResponse): NormalizedTracking {
  const statusCode = typeof res.statusCode === "number" ? res.statusCode : null;
  const ok = statusCode === 0;
  const events = extractEvents(res.data);
  const last = events[events.length - 1];

  const currentStatus =
    (res.data && typeof res.data === "object" && (res.data as Record<string, unknown>).statusDescription as string) ||
    last?.description ||
    (ok ? "Sin eventos" : res.statusDescription ?? "Sin informacion");

  return {
    ot,
    ok,
    statusCode,
    statusText: res.statusDescription ?? "",
    currentStatus: String(currentStatus),
    events,
    raw: res,
  };
}
