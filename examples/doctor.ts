/**
 * Diagnostico de configuracion. Dice que esta viendo el cliente, sin
 * exponer tus keys (solo muestra los ultimos 4 caracteres).
 *
 * Uso:
 *   npm run doctor
 */
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { loadConfig } from "../src/config.js";

function mask(value: string | undefined): string {
  if (!value) return "❌ NO definida";
  const trimmed = value.trim();
  if (trimmed === "") return "❌ vacia";
  if (trimmed.startsWith("tu_key_de_")) return "⚠️  sigue con el texto de ejemplo";
  const last4 = trimmed.slice(-4);
  return `✅ definida (…${last4}, largo ${trimmed.length})`;
}

const envPath = resolve(process.cwd(), ".env");
console.log(`\nCarpeta actual : ${process.cwd()}`);
console.log(`Archivo .env   : ${existsSync(envPath) ? "✅ encontrado" : "❌ NO existe aqui"}  (${envPath})`);

// --- Analisis del archivo crudo (para detectar codificacion / nombres) ---
if (existsSync(envPath)) {
  const buf = readFileSync(envPath);

  // Deteccion de codificacion problematica
  const hasUtf8Bom = buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf;
  const hasUtf16Bom =
    buf.length >= 2 && ((buf[0] === 0xff && buf[1] === 0xfe) || (buf[0] === 0xfe && buf[1] === 0xff));
  // muchos bytes nulos => UTF-16 aunque no tenga BOM
  let nulls = 0;
  for (let i = 0; i < Math.min(buf.length, 200); i++) if (buf[i] === 0x00) nulls++;

  if (hasUtf16Bom || nulls > 5) {
    console.log(
      "\n🔴 El .env parece estar en UTF-16 (lo guardo asi el Bloc de notas)." +
        "\n   dotenv NO puede leerlo. Vuelve a guardarlo como UTF-8:" +
        "\n   - VS Code: abajo a la derecha click en la codificacion -> 'Save with Encoding' -> 'UTF-8'." +
        "\n   - Bloc de notas: Archivo -> Guardar como -> Codificacion: UTF-8."
    );
  } else if (hasUtf8Bom) {
    console.log(
      "\n🟠 El .env tiene un BOM UTF-8 al inicio; puede afectar la primera linea." +
        "\n   Guardalo como 'UTF-8' (sin BOM)."
    );
  }

  // Nombres de variables encontrados (SOLO nombres, nunca valores)
  let text = buf.toString("utf8");
  if (hasUtf16Bom || nulls > 5) text = buf.toString("utf16le");
  const nombres = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l.includes("="))
    .map((l) => l.slice(0, l.indexOf("=")).trim());

  console.log(`\nVariables encontradas en el .env (solo nombres): ${nombres.length ? nombres.join(", ") : "(ninguna)"}`);

  const esperadas = ["CHILEXPRESS_ENVIOS_KEY", "CHILEXPRESS_COBERTURAS_KEY", "CHILEXPRESS_ENV"];
  for (const e of esperadas) {
    if (!nombres.includes(e)) {
      const parecida = nombres.find((n) => n.toUpperCase() === e || n.replace(/\s/g, "") === e);
      if (parecida) console.log(`   ⚠️  "${parecida}" deberia llamarse EXACTAMENTE "${e}"`);
    }
  }
}

const cfg = loadConfig();
console.log(`\nAmbiente (CHILEXPRESS_ENV)        : ${cfg.environment}`);
console.log(`CHILEXPRESS_ENVIOS_KEY           : ${mask(cfg.enviosKey)}`);
console.log(`CHILEXPRESS_COBERTURAS_KEY       : ${mask(cfg.coberturasKey)}`);
console.log(`Timeout (ms)                     : ${cfg.timeoutMs}\n`);

if (!cfg.enviosKey || cfg.enviosKey.trim().startsWith("tu_key_de_")) {
  console.log("👉 Revisa que tu .env tenga la linea EXACTA:");
  console.log("   CHILEXPRESS_ENVIOS_KEY=tu_primary_key_de_envios\n");
}
