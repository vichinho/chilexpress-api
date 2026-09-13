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
  /** Órdenes de Transporte — crear una orden individual. */
  transportOrders: "/transport-orders/api/v1.0/transport-orders",

  /** Órdenes de Transporte — crear varias ordenes en un solo request. */
  transportOrdersMassive: "/transport-orders/api/v1.0/transport-orders/massive",

  /**
   * Tracking — consultar el estado (y datos) de un envio por su numero de OT.
   * Verificado contra el gateway: GET devuelve el sobre estandar; statusCode 0
   * == OK, y -81 == "No se encontraron coincidencias" (OT inexistente en ese
   * ambiente).
   */
  tracking: "/transport-orders/api/v1.0/transport-orders/{trackingNumber}",
} as const;

/** Nombre del header de autenticacion usado por el gateway de Chilexpress. */
export const SUBSCRIPTION_KEY_HEADER = "Ocp-Apim-Subscription-Key";
