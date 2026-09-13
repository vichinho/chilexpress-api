/**
 * Probador del CUERPO (body) para POST /transport-orders/api/v1.0/tracking
 * ("Consulta Individual De Envío"). Prueba varias formas de JSON y reporta la
 * respuesta de cada una, para descubrir el formato exacto que acepta.
 *
 * Uso:
 *   npm run probe-body -- 696733670636
 *
 * Interpretacion:
 *   statusCode 90  -> ❌ "JSON invalido": esa forma NO es la correcta.
 *   statusCode -81 -> 🟡 body ACEPTADO, pero la OT no existe en este ambiente.
 *   statusCode 0   -> ✅ body correcto Y OT encontrada.
 *   otro           -> revisar el mensaje.
 */
import { loadConfig } from "../src/config.js";
import { BASE_URLS, PATHS, SUBSCRIPTION_KEY_HEADER } from "../src/endpoints.js";

function bodies(ot: string, card?: string): Array<{ label: string; body: unknown }> {
  const n = Number(ot);
  const c = card ? Number(card) : undefined;
  const list: Array<{ label: string; body: unknown }> = [
    { label: "{ transportOrderNumber: <number> }", body: { transportOrderNumber: n } },
    { label: "{ transportOrderNumber: <string> }", body: { transportOrderNumber: ot } },
    { label: "{ reference: <string> }", body: { reference: ot } },
    { label: "{ reference: <number> }", body: { reference: n } },
  ];

  // Variantes con la Tarjeta Cliente (customerCardNumber) — sospechoso del -41.
  if (card) {
    list.push(
      { label: "{ transportOrderNumber:<num>, customerCardNumber:<num> }", body: { transportOrderNumber: n, customerCardNumber: c } },
      { label: "{ transportOrderNumber:<str>, customerCardNumber:<str> }", body: { transportOrderNumber: ot, customerCardNumber: card } },
      { label: "{ reference:<str>, customerCardNumber:<num> }", body: { reference: ot, customerCardNumber: c } },
      { label: "{ transportOrderNumber:<num>, customerCardNumber:<num>, informationLevel:1 }", body: { transportOrderNumber: n, customerCardNumber: c, informationLevel: 1 } },
    );
  }
  return list;
}

async function main() {
  const ot = process.argv[2] ?? process.env.TRACKING_NUMBER;
  if (!ot) {
    console.error("Falta la OT. Uso: npm run probe-body -- <numero de OT>");
    process.exit(1);
  }

  const cfg = loadConfig();
  if (!cfg.enviosKey) {
    console.error('Falta CHILEXPRESS_ENVIOS_KEY en tu .env. Corre "npm run doctor".');
    process.exit(1);
  }

  const url = `${BASE_URLS[cfg.environment]}${PATHS.tracking}`;
  console.log(`\nPOST ${url}`);
  console.log(`OT de prueba: ${ot}  (ambiente: ${cfg.environment})\n`);

  const found: string[] = []; // statusCode 0 -> OT ENCONTRADA
  const accepted: string[] = []; // schema valido pero no encontrada (-41/-81)

  if (cfg.cardNumber) console.log(`TCC (customerCardNumber): ${cfg.cardNumber}\n`);

  for (const { label, body } of bodies(ot, cfg.cardNumber)) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          [SUBSCRIPTION_KEY_HEADER]: cfg.enviosKey,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      const text = await res.text();
      let statusCode: unknown;
      try {
        statusCode = JSON.parse(text)?.statusCode;
      } catch {
        statusCode = "?";
      }
      const flag = statusCode === 0 ? "✅ ENCONTRADA" : statusCode === 90 ? "❌ JSON invalido" : "🟡 aceptada";
      console.log(`${flag}  HTTP ${res.status}  statusCode=${String(statusCode)}  ${label}`);
      console.log(`     ${text.slice(0, 400)}\n`);
      if (statusCode === 0) found.push(label);
      else if (statusCode !== 90 && res.status < 500) accepted.push(label);
    } catch (err) {
      console.log(`⚠️  ${label}  (${(err as Error).message})\n`);
    }
  }

  console.log("================================================================");
  if (found.length) {
    console.log("✅ Forma(s) que ENCONTRARON la OT (statusCode 0):");
    for (const w of found) console.log(`  • ${w}`);
    console.log("\n¡Esa es la buena! Pasame la salida completa (con el JSON) y fijo el body + los tipos.");
  } else if (accepted.length) {
    console.log("🟡 Ninguna encontro la OT (todas -41/-81), pero el formato es valido.");
    console.log("   El bloqueo NO es el body: es de permiso/alcance sobre esa OT.");
    console.log("   Pasame la salida completa y vemos el siguiente paso con Chilexpress.");
  } else {
    console.log("❌ Ninguna forma fue aceptada. Pasame el 'Request body' de ejemplo");
    console.log("   que muestra el portal en 'Consulta Individual De Envío'.");
  }
}

main();
