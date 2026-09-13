/**
 * Tipos de request/response de Chilexpress.
 *
 * Chilexpress envuelve casi todas sus respuestas en un sobre con
 * `statusCode` + `statusDescription` (0 == OK) y un `data` con el detalle.
 * Los campos exactos pueden variar levemente segun la version de tu
 * suscripcion; por eso los tipos incluyen un indice `[key: string]: unknown`
 * para no romper si Chilexpress agrega campos.
 */

/** Sobre estandar de las respuestas del gateway. */
export interface ChilexpressEnvelope<TData> {
  statusCode: number;
  statusDescription?: string;
  data?: TData;
  errors?: Array<{ code?: string | number; description?: string; [k: string]: unknown }>;
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// TRACKING
// ---------------------------------------------------------------------------

/** Un evento del historial de seguimiento de un envio. */
export interface TrackingEvent {
  /** Fecha/hora del evento (formato segun Chilexpress). */
  date?: string;
  /** Codigo interno del estado/evento. */
  code?: string | number;
  /** Descripcion legible del estado/evento. */
  description?: string;
  /** Sucursal / ubicacion asociada al evento. */
  location?: string;
  [key: string]: unknown;
}

/** Detalle de tracking de un envio. */
export interface TrackingData {
  trackingNumber?: string;
  /** Estado actual (ultimo) del envio. */
  statusCode?: string | number;
  statusDescription?: string;
  /** Historial de eventos, del mas antiguo al mas reciente (o viceversa). */
  statusList?: TrackingEvent[];
  [key: string]: unknown;
}

export type TrackingResponse = ChilexpressEnvelope<TrackingData>;

// ---------------------------------------------------------------------------
// ORDENES DE TRANSPORTE
// ---------------------------------------------------------------------------

/** Direccion (origen o destino). */
export interface Address {
  /** Codigo de cobertura de la comuna (obtenido del producto "Geo"/Coberturas). */
  countyCoverageCode: string;
  streetName: string;
  streetNumber: string;
  /** Depto/oficina/observacion (opcional). */
  supplement?: string;
  [key: string]: unknown;
}

/** Contacto de un envio. */
export interface Contact {
  name: string;
  phoneNumber?: string;
  mail?: string;
  [key: string]: unknown;
}

/** Un bulto/paquete del envio. */
export interface Package {
  weight: string;
  height: string;
  width: string;
  length: string;
  /** Cantidad de bultos con estas dimensiones. */
  serviceDeliveryCode?: string;
  productCode?: string;
  deliveryReference?: string;
  groupReference?: string;
  [key: string]: unknown;
}

/** Detalle de un envio dentro de la orden de transporte. */
export interface TransportOrderDetail {
  addresses: Array<{ addressType: "DEST" | "DEV" | string } & Address>;
  contacts: Array<{ contactType?: string } & Contact>;
  packages: Package[];
  [key: string]: unknown;
}

/** Cuerpo para crear una orden de transporte. */
export interface CreateTransportOrderRequest {
  header: {
    /** Numero de cuenta corriente / tarjeta cliente Chilexpress. */
    customerCardNumber: string;
    /** Codigo de cobertura de la comuna de origen. */
    countyOfOriginCoverageCode: string;
    /** Tipo de etiqueta: 0 = sin etiqueta, 2 = PDF, etc. (ver portal). */
    labelType: number;
    [key: string]: unknown;
  };
  details: TransportOrderDetail[];
  [key: string]: unknown;
}

/** Detalle de una orden creada (numero de OT, etiqueta, etc.). */
export interface CreatedTransportOrderDetail {
  reference?: string;
  transportOrderNumber?: string;
  barcode?: string;
  /** Etiqueta imprimible codificada en base64 (PDF o ZPL segun labelType). */
  printableLabel?: string;
  statusCode?: number;
  statusDescription?: string;
  [key: string]: unknown;
}

export interface CreateTransportOrderData {
  header?: Record<string, unknown>;
  detail?: CreatedTransportOrderDetail[];
  [key: string]: unknown;
}

export type CreateTransportOrderResponse = ChilexpressEnvelope<CreateTransportOrderData>;
