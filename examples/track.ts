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

    // El sobre trae statusCode top-level: 0 == OK; negativo == error de negocio
    // (p.ej. -81 == OT no encontrada). El detalle viene en `data`.
    if (res.statusCode !== 0 || !res.data) {
      console.log(`Chilexpress: [${res.statusCode}] ${res.statusDescription ?? "(sin descripcion)"}`);
      if (res.statusCode === -81) {
        console.log("→ La OT no existe en este ambiente. Si es un envio real, usa CHILEXPRESS_ENV=production.");
      } else if (res.statusCode === -41) {
        console.log("→ La OT existe pero no esta disponible para consultar (muy antigua, de otra cuenta, o aun sin movimientos). Prueba con una OT reciente.");
      }
      return;
    }

    const eventos = res.data.statusList ?? [];
    if (eventos.length > 0) {
      console.log(`Estado actual: ${res.data.statusDescription ?? eventos[eventos.length - 1]?.description ?? "(sin dato)"}`);
      console.log("\nHistorial:");
      for (const ev of eventos) {
        const fecha = ev.date ?? "";
        const desc = ev.description ?? "";
        const lugar = ev.location ? ` — ${ev.location}` : "";
        console.log(`  [${fecha}] ${desc}${lugar}`);
      }
    } else {
      // OT encontrada pero con un formato de datos que aun no mapeamos:
      // mostramos el JSON crudo para ajustar los tipos a lo que devuelve.
      console.log("Datos de la OT (revisa la forma para afinar los tipos):");
      console.log(JSON.stringify(res.data, null, 2));
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
