/**
 * Ejemplo: crear una orden de transporte y guardar la etiqueta (PDF).
 *
 * ⚠️ Reemplaza los datos de ejemplo (cuenta, comunas, direccion) por los
 * reales antes de ejecutar. Los codigos de cobertura de comuna se obtienen
 * del producto "Geo"/Coberturas del portal.
 *
 * Uso:
 *   npm run create-order
 */
import { writeFile } from "node:fs/promises";
import {
  ChilexpressClient,
  ChilexpressApiError,
  ChilexpressError,
  type CreateTransportOrderRequest,
} from "../src/index.js";

async function main() {
  const client = new ChilexpressClient();

  const request: CreateTransportOrderRequest = {
    header: {
      customerCardNumber: "18578680", // <- tu numero de cuenta Chilexpress
      countyOfOriginCoverageCode: "STGO", // <- comuna de origen (codigo de cobertura)
      labelType: 2, // 2 = etiqueta PDF (ver opciones en el portal)
    },
    details: [
      {
        addresses: [
          {
            addressType: "DEST",
            countyCoverageCode: "PLCE", // comuna destino
            streetName: "Calle Falsa",
            streetNumber: "123",
            supplement: "Depto 4B",
          },
        ],
        contacts: [
          {
            name: "Cliente Dosimet",
            phoneNumber: "912345678",
            mail: "cliente@ejemplo.cl",
          },
        ],
        packages: [
          {
            weight: "1",
            height: "10",
            width: "10",
            length: "10",
            serviceDeliveryCode: "3", // tipo de servicio (ver portal)
            productCode: "3",
            deliveryReference: "Dosimetro #001",
            groupReference: "DOSIMET",
          },
        ],
      },
    ],
  };

  try {
    const res = await client.transportOrders.create(request);
    const detalle = res.data?.detail?.[0];

    console.log(`Estado: ${res.statusDescription ?? res.statusCode}`);
    console.log(`OT: ${detalle?.transportOrderNumber ?? "(no generada)"}`);
    console.log(`Codigo de barras: ${detalle?.barcode ?? "-"}`);

    if (detalle?.printableLabel) {
      const pdf = Buffer.from(detalle.printableLabel, "base64");
      const file = `etiqueta-${detalle.transportOrderNumber ?? "envio"}.pdf`;
      await writeFile(file, pdf);
      console.log(`Etiqueta guardada en ${file}`);
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
