/**
 * Probador de endpoints de tracking. Prueba varias rutas candidatas con tu
 * key de "Envios" y reporta el status HTTP de cada una, para descubrir cual
 * es la correcta (la que NO devuelve 404).
 *
 * Uso:
 *   npm run probe -- 696733670636
 *
 * Interpretacion de los status:
 *   200      -> ✅ ruta correcta (mira el cuerpo)
 *   400/422  -> 🟡 ruta correcta pero faltan/erran parametros (vamos bien)
 *   401/403  -> 🔒 la key no aplica a esa ruta/producto
 *   404      -> ❌ esa ruta no existe
 */
import { loadConfig } from "../src/config.js";
import { BASE_URLS, SUBSCRIPTION_KEY_HEADER } from "../src/endpoints.js";

interface Candidate {
  method: "GET" | "POST";
  path: string; // usa {ot}
  body?: (ot: string) => unknown;
}

const candidates: Candidate[] = [
  { method: "GET", path: "/transport-orders/api/v1.0/tracking/{ot}" },
  { method: "GET", path: "/transport-orders/api/v1.0/transport-orders/{ot}" },
  { method: "GET", path: "/transport-orders/api/v1.0/transport-orders/{ot}/tracking" },
  { method: "GET", path: "/transport-orders/api/v1.0/orders/{ot}/tracking" },
  { method: "GET", path: "/transport-orders/api/v2.0/tracking/{ot}" },
  { method: "GET", path: "/tracking/api/v1.0/tracking/{ot}" },
  { method: "GET", path: "/tracking/api/v1.0/transport-orders/{ot}" },
  {
    method: "POST",
    path: "/transport-orders/api/v1.0/tracking",
    body: (ot) => ({ trackingNumber: ot }),
  },
  {
    method: "POST",
    path: "/transport-orders/api/v1.0/transport-orders/tracking",
    body: (ot) => ({ trackingNumber: ot }),
  },
];

async function main() {
  const ot = process.argv[2] ?? process.env.TRACKING_NUMBER;
  if (!ot) {
    console.error("Falta la OT. Uso: npm run probe -- <numero de OT>");
    process.exit(1);
  }

  const cfg = loadConfig();
  if (!cfg.enviosKey) {
    console.error('Falta CHILEXPRESS_ENVIOS_KEY en tu .env. Corre "npm run doctor".');
    process.exit(1);
  }

  const base = BASE_URLS[cfg.environment];
  console.log(`\nAmbiente: ${cfg.environment}  (${base})`);
  console.log(`OT de prueba: ${ot}\n`);
  console.log("METODO  STATUS  RUTA");
  console.log("------  ------  ----------------------------------------------");

  const winners: string[] = [];

  for (const c of candidates) {
    const path = c.path.replace("{ot}", encodeURIComponent(ot));
    const url = `${base}${path}`;
    const hasBody = c.method === "POST" && c.body;
    try {
      const res = await fetch(url, {
        method: c.method,
        headers: {
          [SUBSCRIPTION_KEY_HEADER]: cfg.enviosKey,
          Accept: "application/json",
          ...(hasBody ? { "Content-Type": "application/json" } : {}),
        },
        body: hasBody ? JSON.stringify(c.body!(ot)) : undefined,
      });

      const flag = res.status === 200 ? "✅" : res.status === 404 ? "❌" : "🟡";
      console.log(`${c.method.padEnd(6)}  ${String(res.status).padEnd(6)}  ${flag} ${c.path}`);

      if (res.status !== 404 && res.status !== 401 && res.status !== 403) {
        winners.push(`${c.method} ${c.path}`);
        const text = (await res.text()).slice(0, 600);
        console.log(`        ↳ respuesta: ${text}\n`);
      }
    } catch (err) {
      console.log(`${c.method.padEnd(6)}  ERR     ⚠️  ${c.path}  (${(err as Error).message})`);
    }
  }

  console.log("\n----------------------------------------------------------------");
  if (winners.length) {
    console.log("Rutas que respondieron (candidatas correctas):");
    for (const w of winners) console.log(`  • ${w}`);
    console.log("\nPasa esta salida y ajusto src/endpoints.ts con la ruta correcta.");
  } else {
    console.log("Ninguna ruta respondio distinto de 404/401. Probablemente el path");
    console.log("real es otro: mira en el portal el API de 'Envios' -> la operacion");
    console.log("de tracking -> 'Request URL', y pasame esa URL.");
  }
}

main();
