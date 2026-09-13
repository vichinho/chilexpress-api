/**
 * Rutas y bases de la API de Chilexpress (Azure API Management).
 *
 * ⚠️ IMPORTANTE — VERIFICAR CONTRA TU PORTAL
 * Chilexpress publica los endpoints exactos y su "API version" dentro del
 * portal Developers, en la ficha de cada producto suscrito
 * (https://developers.wschilexpress.com -> APIs -> "Try it").
 *
 * Las bases y versiones de abajo corresponden a la estructura estandar de
 * Chilexpress. Si tu suscripcion muestra un path o version distinta, este
 * es el UNICO archivo que debes tocar.
 */

export type Environment = "test" | "production";

/** Bases del gateway segun ambiente. */
export const BASE_URLS: Record<Environment, string> = {
  test: "https://testservices.wschilexpress.com",
  production: "https://services.wschilexpress.com",
};

/**
 * Paths relativos a la base. Usa `{trackingNumber}` como placeholder donde
 * corresponda; el cliente lo reemplaza con el valor real (URL-encoded).
 */
export const PATHS = {
  /** "Generar envío" — crear una orden de transporte. (POST) */
  transportOrders: "/transport-orders/api/v1.0/transport-orders",

  /** "Reimpresión de etiquetas". (POST) */
  reprintLabels: "/transport-orders/api/v1.0/transport-orders-labels",

  /**
   * "Consulta Individual De Envío" — tracking de UNA OT. (POST)
   * Ruta oficial del portal (producto "Envíos"). El cuerpo esperado se
   * resuelve en TrackingService.
   */
  tracking: "/transport-orders/api/v1.0/tracking",

  /** "Consulta múltiple de envíos" — tracking de varias OT. (POST) */
  trackingBulk: "/transport-orders/api/v1.0/tracking/bulk",
} as const;

/** Nombre del header de autenticacion usado por el gateway de Chilexpress. */
export const SUBSCRIPTION_KEY_HEADER = "Ocp-Apim-Subscription-Key";
