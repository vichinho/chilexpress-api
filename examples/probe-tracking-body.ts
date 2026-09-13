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

  const winners: string[] = [];

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
      const invalido = statusCode === 90;
      const flag = invalido ? "❌" : "🟡/✅";
      console.log(`${flag}  HTTP ${res.status}  statusCode=${String(statusCode)}  ${label}`);
      console.log(`     ${text.slice(0, 300)}\n`);
      if (!invalido && res.status < 500) winners.push(label);
    } catch (err) {
      console.log(`⚠️  ${label}  (${(err as Error).message})\n`);
    }
  }

  console.log("----------------------------------------------------------------");
  if (winners.length) {
    console.log("Forma(s) de body ACEPTADAS por la operacion:");
    for (const w of winners) console.log(`  • ${w}`);
    console.log("\nPasame esta salida y fijo el body exacto en el TrackingService.");
  } else {
    console.log("Ninguna forma fue aceptada. Pasame el 'Request body' de ejemplo");
    console.log("que muestra el portal en la operacion 'Consulta Individual De Envío'.");
  }
}

main();
