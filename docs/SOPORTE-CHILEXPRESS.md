# Consulta a Soporte Integraciones Chilexpress

Cuando la operación **"Consulta Individual De Envío"** devuelve
`statusCode -41 "La OT no se encuentra disponible para consultar"` para OT
que **sí existen** (visibles en el panel/web de Chilexpress) y fueron
despachadas con la cuenta de la empresa, el problema es de **permiso/alcance**
del lado de Chilexpress, no de la integración.

## Evidencia concreta

Las OT existen en el panel **"OT DIGITAL – Consulta de Órdenes de Transporte"**
bajo la **TCC 18570793**, con estados vigentes, pero la **Tracking API** las
rechaza con `-41`. Ejemplos verificados:

| Nro. OT | Referencia | Estado en OT Digital | Respuesta API Tracking |
|---|---|---|---|
| 696733747463 | megasalud antofagasta | EN TRANSFERENCIA | statusCode -41 |
| 696733602725 | MINERA ESCONDIDA | EN DESCARGO | statusCode -41 |

Es decir: las OT **pertenecen a la cuenta** y **tienen estado**, pero la API no
las devuelve. Falta que Chilexpress **habilite/asocie la suscripción de la API
(producto Envíos/Tracking) a la cuenta comercial (TCC 18570793)**.

## Cómo se diagnosticó (para adjuntar)

- **Endpoint:** `POST https://services.wschilexpress.com/transport-orders/api/v1.0/tracking`
- **Auth:** header `Ocp-Apim-Subscription-Key` (producto **Envíos**) — autentica OK (no da 401).
- **Body probado** (todas las variantes devuelven lo mismo):
  - `{ "transportOrderNumber": 696733602725 }`
  - `{ "transportOrderNumber": "696733602725" }`
  - `{ "reference": "696733602725" }`
  - `{ "transportOrderNumber": 696733602725, "customerCardNumber": 18570793 }`
  - `{ "transportOrderNumber": 696733602725, "customerCardNumber": 18570793, "informationLevel": 1 }`
- **Respuesta en todos los casos (HTTP 400):**
  ```json
  {"data":null,"statusCode":-41,"statusDescription":"La OT no se encuentra disponible para consultar","errors":null}
  ```

## Correo sugerido a soporteintegraciones@chilexpress.cl

> **Asunto:** Tracking API devuelve statusCode -41 para OT válidas — habilitación de consulta
>
> Estimados,
>
> Estamos integrando la API de **Envíos** (producto suscrito en el Portal
> Developers). La operación **"Consulta Individual De Envío"**
> (`POST /transport-orders/api/v1.0/tracking`) autentica correctamente con
> nuestra Subscription Key, pero devuelve **`statusCode -41 "La OT no se
> encuentra disponible para consultar"`** para OT que **sí existen** en nuestro
> panel **OT Digital** bajo nuestra TCC, con estado vigente.
>
> Creemos que la causa es que la **Subscription Key fue generada desde una
> cuenta personal del Portal Developers**, mientras que las OT pertenecen a la
> **cuenta comercial de la empresa (TCC 18570793)**. Necesitamos que la API
> quede asociada a esa TCC para poder consultar nuestras OT. **¿Deben asociar
> nuestra TCC a la suscripción actual, o debemos crear la suscripción desde la
> cuenta de la empresa?**
>
> - **Empresa / RUT:** [COMPLETAR]
> - **Tarjeta Cliente Chilexpress (TCC):** 18570793
> - **OT de ejemplo (visibles en OT Digital bajo nuestra TCC):**
>   - 696733747463 — estado "EN TRANSFERENCIA"
>   - 696733602725 — estado "EN DESCARGO"
> - **Ambiente:** producción (`services.wschilexpress.com`)
> - **Respuesta recibida:** `{"statusCode":-41,"statusDescription":"La OT no se encuentra disponible para consultar"}`
>
> Consultas:
> 1. ¿Nuestra suscripción al producto de tracking está **aprobada/habilitada
>    para producción**, o requiere certificación previa?
> 2. ¿La consulta por API está **restringida a OT generadas por API** con
>    nuestra TCC, o debería incluir también las generadas por el panel?
> 3. ¿Qué **campo y valor exacto** espera el body para consultar una OT nuestra
>    (número de OT vs. referencia)?
> 4. ¿Hay una **ventana de tiempo/estado** en que la OT deja de ser consultable
>    (p. ej. ya entregada / "en descargo")?
>
> Quedamos atentos. Gracias.

## Cosas para verificar por nuestra cuenta (mientras responden)

- [ ] La suscripción a **Envíos** aparece **activa/aprobada** (no pendiente) en el portal.
- [ ] La OT de prueba fue **generada bajo la TCC 18570793** (no por otra cuenta).
- [ ] Probar una OT **en tránsito** (no entregada) por si las "en descargo" no son consultables.
- [ ] Probar la ruta alternativa `GET /transport-orders/api/v1.0/transport-orders/{ot}` en producción (`npm run probe -- <OT>`).
