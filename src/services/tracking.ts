import { HttpClient } from "../http.js";
import { PATHS } from "../endpoints.js";
import type { ChilexpressConfig } from "../config.js";
import type { TrackingResponse } from "../types.js";

/** Campo por el cual se consulta la OT en el body del tracking. */
export type TrackingField = "reference" | "transportOrderNumber";

/** statusCode que Chilexpress devuelve cuando la OT no existe. */
const NOT_FOUND_STATUS = -81;

/**
 * Servicio de Tracking (seguimiento). Usa la operacion oficial
 * "Consulta Individual De Envío": POST /transport-orders/api/v1.0/tracking.
 */
export class TrackingService {
  private readonly http: HttpClient;

  constructor(private readonly config: ChilexpressConfig) {
    this.http = new HttpClient(config);
  }

  /** Consulta el tracking usando un campo especifico del body. */
  async query(
    trackingNumber: string | number,
    field: TrackingField
  ): Promise<TrackingResponse> {
    return this.http.request<TrackingResponse>({
      method: "POST",
      path: PATHS.tracking,
      body: { [field]: String(trackingNumber) },
      subscriptionKey: this.config.enviosKey,
      productName: "Envíos",
    });
  }

  /**
   * Consulta el seguimiento de un envio por su numero de OT.
   *
   * Intenta primero por `reference` y, si la OT no aparece (statusCode -81),
   * reintenta por `transportOrderNumber`. Asi funciona sin importar cual sea
   * el campo correcto para tu cuenta.
   *
   * @param trackingNumber Numero de orden de transporte (OT).
   */
  async getByTrackingNumber(trackingNumber: string | number): Promise<TrackingResponse> {
    const primary = await this.query(trackingNumber, "reference");
    if (primary.statusCode === NOT_FOUND_STATUS) {
      const fallback = await this.query(trackingNumber, "transportOrderNumber");
      // Si el fallback encuentra la OT, devolvemos ese; si no, el primero.
      if (fallback.statusCode !== NOT_FOUND_STATUS) return fallback;
    }
    return primary;
  }

  /**
   * Consulta múltiple de envios ("tracking/bulk"): varias OT en un request.
   * ⚠️ El formato del body de bulk aun no esta confirmado; ajusta si es necesario.
   */
  async getMany(trackingNumbers: Array<string | number>): Promise<TrackingResponse> {
    return this.http.request<TrackingResponse>({
      method: "POST",
      path: PATHS.trackingBulk,
      body: { references: trackingNumbers.map(String) },
      subscriptionKey: this.config.enviosKey,
      productName: "Envíos",
    });
  }
}
