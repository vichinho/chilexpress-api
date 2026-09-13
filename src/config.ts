import "dotenv/config";
import type { Environment } from "./endpoints.js";

/** Opciones para construir el cliente de Chilexpress. */
export interface ChilexpressConfig {
  /** Ambiente: "test" (pruebas) o "production". */
  environment: Environment;
  /** Subscription Key del producto "Transport Orders" (Órdenes de Transporte). */
  transportOrdersKey?: string;
  /** Subscription Key del producto "Tracking". */
  trackingKey?: string;
  /** Timeout por request en milisegundos. */
  timeoutMs: number;
}

function parseEnvironment(value: string | undefined): Environment {
  return value?.toLowerCase() === "production" ? "production" : "test";
}

/**
 * Carga la configuracion desde variables de entorno (.env). Puedes sobre-
 * escribir cualquier valor pasando `overrides`.
 */
export function loadConfig(
  overrides: Partial<ChilexpressConfig> = {}
): ChilexpressConfig {
  const timeoutRaw = process.env.CHILEXPRESS_TIMEOUT_MS;
  const timeoutMs = timeoutRaw ? Number(timeoutRaw) : 15_000;

  return {
    environment: parseEnvironment(process.env.CHILEXPRESS_ENV),
    transportOrdersKey: process.env.CHILEXPRESS_TRANSPORT_ORDERS_KEY,
    trackingKey: process.env.CHILEXPRESS_TRACKING_KEY,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 15_000,
    ...overrides,
  };
}
