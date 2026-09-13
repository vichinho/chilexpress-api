/**
 * Ejemplo: consultar el estado de seguimiento de un envio.
 *
 * Uso:
 *   npm run track -- 990000000001
 *   (o define TRACKING_NUMBER en tu entorno)
 */
import {
  ChilexpressClient,
  ChilexpressApiError,
  ChilexpressError,
} from "../src/index.js";

async function main() {
  const trackingNumber = process.argv[2] ?? process.env.TRACKING_NUMBER;

  if (!trackingNumber) {
    console.error("Falta el numero de seguimiento. Uso: npm run track -- <OT>");
    process.exit(1);
  }

  const client = new ChilexpressClient();

  try {
    const res = await client.tracking.getByTrackingNumber(trackingNumber);

    console.log(`\nEnvio ${trackingNumber}`);
    console.log(`Estado actual: ${res.data?.statusDescription ?? "(sin dato)"}`);

    const eventos = res.data?.statusList ?? [];
    if (eventos.length > 0) {
      console.log("\nHistorial:");
      for (const ev of eventos) {
        const fecha = ev.date ?? "";
        const desc = ev.description ?? "";
        const lugar = ev.location ? ` — ${ev.location}` : "";
        console.log(`  [${fecha}] ${desc}${lugar}`);
      }
    } else {
      console.log("\n(Sin eventos en el historial o formato distinto — revisa la respuesta cruda abajo)");
      console.log(JSON.stringify(res, null, 2));
    }
  } catch (err) {
    if (err instanceof ChilexpressApiError) {
      console.error(`Error ${err.status} desde Chilexpress:`);
      console.error(JSON.stringify(err.body, null, 2));
    } else if (err instanceof ChilexpressError) {
      console.error(err.message);
    } else {
      console.error(err);
    }
    process.exit(1);
  }
}

main();
