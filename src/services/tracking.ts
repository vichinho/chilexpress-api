import { HttpClient } from "../http.js";
import { PATHS } from "../endpoints.js";
import type { ChilexpressConfig } from "../config.js";
import type { TrackingResponse } from "../types.js";

/**
 * Servicio de Tracking (seguimiento). Usa la operacion oficial
 * "Consulta Individual De Envío": POST /transport-orders/api/v1.0/tracking.
 */
export class TrackingService {
  private readonly http: HttpClient;

  constructor(private readonly config: ChilexpressConfig) {
    this.http = new HttpClient(config);
  }

  /**
   * Consulta el seguimiento de un envio por su numero de OT.
   *
   * @param trackingNumber Numero de orden de transporte (OT).
   */
  async getByTrackingNumber(trackingNumber: string | number): Promise<TrackingResponse> {
    return this.http.request<TrackingResponse>({
      method: "POST",
      path: PATHS.tracking,
      // ⚠️ Cuerpo pendiente de confirmar con "npm run probe-body".
      // Se ajustara al formato exacto que acepte la operacion.
      body: { trackingNumber: String(trackingNumber) },
      subscriptionKey: this.config.enviosKey,
      productName: "Envíos",
    });
  }

  /**
   * Consulta múltiple de envios ("tracking/bulk"): varias OT en un request.
   */
  async getMany(trackingNumbers: Array<string | number>): Promise<TrackingResponse> {
    return this.http.request<TrackingResponse>({
      method: "POST",
      path: PATHS.trackingBulk,
      body: { trackingNumbers: trackingNumbers.map(String) },
      subscriptionKey: this.config.enviosKey,
      productName: "Envíos",
    });
  }
}
