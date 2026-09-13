import "dotenv/config";
import type { Environment } from "./endpoints.js";

/** Opciones para construir el cliente de Chilexpress. */
export interface ChilexpressConfig {
  /** Ambiente: "test" (pruebas) o "production". */
  environment: Environment;
  /**
   * Subscription Key del producto "Envíos".
   * Cubre la generación de órdenes de transporte y el tracking.
   */
  enviosKey?: string;
  /** Subscription Key del producto "Coberturas" (comunas / códigos de cobertura). */
  coberturasKey?: string;
  /**
   * Tarjeta Cliente Chilexpress (TCC / customerCardNumber) de la empresa.
   * La usa la generación de envíos y (según la cuenta) la consulta de tracking.
   */
  cardNumber?: string;
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
    enviosKey: process.env.CHILEXPRESS_ENVIOS_KEY,
    coberturasKey: process.env.CHILEXPRESS_COBERTURAS_KEY,
    cardNumber: process.env.CHILEXPRESS_CARD_NUMBER,
    timeoutMs: Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 15_000,
    ...overrides,
  };
}
