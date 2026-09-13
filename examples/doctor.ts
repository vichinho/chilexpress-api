/**
 * Diagnostico de configuracion. Dice que esta viendo el cliente, sin
 * exponer tus keys (solo muestra los ultimos 4 caracteres).
 *
 * Uso:
 *   npm run doctor
 */
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { loadConfig } from "../src/config.js";

function mask(value: string | undefined): string {
  if (!value) return "❌ NO definida";
  const trimmed = value.trim();
  if (trimmed === "" ) return "❌ vacia";
  if (trimmed.startsWith("tu_key_de_")) return "⚠️  sigue con el texto de ejemplo";
  const last4 = trimmed.slice(-4);
  return `✅ definida (…${last4}, largo ${trimmed.length})`;
}

const envPath = resolve(process.cwd(), ".env");
console.log(`\nCarpeta actual : ${process.cwd()}`);
console.log(`Archivo .env   : ${existsSync(envPath) ? "✅ encontrado" : "❌ NO existe aqui"}  (${envPath})`);

const cfg = loadConfig();
console.log(`\nAmbiente (CHILEXPRESS_ENV)        : ${cfg.environment}`);
console.log(`CHILEXPRESS_ENVIOS_KEY           : ${mask(cfg.enviosKey)}`);
console.log(`CHILEXPRESS_COBERTURAS_KEY       : ${mask(cfg.coberturasKey)}`);
console.log(`Timeout (ms)                     : ${cfg.timeoutMs}\n`);

if (!cfg.enviosKey || cfg.enviosKey.trim().startsWith("tu_key_de_")) {
  console.log("👉 Revisa que tu .env tenga la linea EXACTA:");
  console.log("   CHILEXPRESS_ENVIOS_KEY=tu_primary_key_de_envios\n");
}
