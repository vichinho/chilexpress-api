# chilexpress-api

Cliente en **Node.js + TypeScript** para conectar con la API de **Chilexpress**
(portal Developers, sobre Azure API Management).

Está enfocado en el caso de uso de Dosimet: **generar órdenes de transporte**
para despachar productos (dosímetros) a clientes en todo Chile y, sobre todo,
**consultar los estados de seguimiento (tracking)** de cada envío.

> ⚠️ **Sobre los endpoints:** las rutas y versiones exactas de la API se
> publican dentro del portal (en la ficha de cada producto suscrito, botón
> *"Try it"*). Este proyecto usa la estructura estándar de Chilexpress, pero
> **debes confirmar cada ruta contra tu suscripción**. Todo está centralizado
> en un único archivo: [`src/endpoints.ts`](src/endpoints.ts).

---

## 1. Requisitos

- Node.js 18 o superior (usa `fetch` nativo; probado en Node 22).
- Una cuenta de empresa en <https://developers.wschilexpress.com>.

## 2. Obtener las credenciales (Subscription Keys)

Chilexpress autentica con una **Subscription Key** por header
(`Ocp-Apim-Subscription-Key`). Cada *producto* que suscribes entrega su
propia key:

1. Entra a <https://developers.wschilexpress.com> con tu cuenta de empresa.
2. En el **desplegable de productos**, suscribe:
   - **Envíos** → genera órdenes de transporte y entrega el tracking.
   - **Coberturas** → comunas y códigos de cobertura (para origen/destino).
   - *(opcional para más adelante)* **Cotizador**.
3. En **"Tus Suscripciones"**, copia la **Primary Key** de cada una.

## 3. Configuración

```bash
npm install
cp .env.example .env
```

Edita `.env` con tus keys reales:

```env
CHILEXPRESS_ENV=test                # "test" o "production"
CHILEXPRESS_ENVIOS_KEY=...          # key del producto "Envíos" (OT + tracking)
CHILEXPRESS_COBERTURAS_KEY=...      # key del producto "Coberturas"
CHILEXPRESS_CARD_NUMBER=...         # TCC (Tarjeta Cliente Chilexpress) de la empresa
```

El archivo `.env` está en `.gitignore` — **nunca** se commitean las keys.

### Diagnóstico rápido

Si al consultar te dice *"Falta la subscription key…"*, corre el diagnóstico
(no muestra tus keys, solo si las detecta):

```bash
npm run doctor
```

Te dirá si el `.env` está en la carpeta correcta y si cada variable está
bien definida.

## 4. Uso

### Consultar seguimiento de un envío (caso principal)

```bash
npm run track -- 990000000001
```

O desde código:

```ts
import { ChilexpressClient } from "./src/index.js";

const client = new ChilexpressClient(); // lee las keys desde .env

const res = await client.tracking.getByTrackingNumber("990000000001");
console.log(res.data?.statusDescription); // estado actual
for (const ev of res.data?.statusList ?? []) {
  console.log(ev.date, ev.description, ev.location);
}
```

### Web de seguimiento

Una interfaz simple para consultar OT y llevar un registro de los envíos:

```bash
npm run web            # abre http://localhost:3000
```

- **Consulta individual:** ingresa una OT y ve su estado y eventos.
- **Envíos registrados:** agrega las OT que te interesan; el servidor las guarda
  en `data/ots.json` y puedes refrescar el estado de todas con un botón.

> La API de Chilexpress **no** ofrece "listar todos los envíos por RUT": solo se
> pueden consultar OT conocidas (individual o en lote). Por eso la web mantiene
> un registro de las OT de la empresa. Lo ideal es registrar la OT
> automáticamente al generar cada envío por API.

Las subscription keys se usan solo en el servidor; el navegador nunca las recibe.

### Crear una orden de transporte + etiqueta

```bash
npm run create-order   # revisa/ajusta los datos en examples/create-order.ts
```

```ts
const res = await client.transportOrders.create({
  header: {
    customerCardNumber: "TU_CUENTA",
    countyOfOriginCoverageCode: "STGO",
    labelType: 2, // 2 = PDF
  },
  details: [ /* direcciones, contactos, bultos */ ],
});

const ot = res.data?.detail?.[0];
console.log(ot?.transportOrderNumber);
// ot?.printableLabel viene en base64 (guárdalo como .pdf)
```

## 5. Estructura del proyecto

```
src/
  index.ts            -> ChilexpressClient (punto de entrada)
  endpoints.ts        -> ⭐ bases y rutas (AJUSTA AQUÍ si difieren)
  config.ts           -> carga de .env / opciones
  http.ts             -> cliente HTTP (fetch + timeout + errores)
  types.ts            -> tipos de request/response
  errors.ts           -> ChilexpressError / ...ApiError / ...ConfigError
  services/
    tracking.ts       -> seguimiento de envíos
    transportOrders.ts-> generación de órdenes
examples/
  track.ts            -> ejemplo de tracking
  create-order.ts     -> ejemplo de creación de OT
```

## 6. Manejo de errores

- `ChilexpressConfigError` → falta una key u otra configuración.
- `ChilexpressApiError` → la API respondió con error (incluye `status`,
  `url` y `body` para diagnóstico).

```ts
import { ChilexpressApiError } from "./src/index.js";

try {
  await client.tracking.getByTrackingNumber("...");
} catch (e) {
  if (e instanceof ChilexpressApiError) {
    console.error(e.status, e.body);
  }
}
```

## 7. Cómo integrarlo a tu software actual

Este paquete es un **cliente desacoplado**: expone `ChilexpressClient` y no
asume framework. Para enchufarlo a tu backend:

- **Node/Express/Nest, etc.:** importa `ChilexpressClient` y llama
  `client.tracking.getByTrackingNumber(ot)` desde tu servicio/controlador.
- Compila a JS con `npm run build` (sale en `dist/`) o consúmelo directo con
  `tsx`/`ts-node` en desarrollo.

## 8. Pendientes a confirmar contra tu portal

- [ ] Ruta y método exactos del **Tracking** (`src/endpoints.ts` → `PATHS.tracking`).
- [ ] Valores válidos de `labelType`, `serviceDeliveryCode` y `productCode`.
- [ ] Códigos de cobertura de comunas (producto **Geo**) para origen/destino.
- [ ] Tabla de **códigos de estado** que Chilexpress devuelve en el tracking.

Soporte de integraciones Chilexpress: `soporteintegraciones@chilexpress.cl`.
