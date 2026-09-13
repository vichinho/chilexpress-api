import { HttpClient } from "../http.js";
import { PATHS } from "../endpoints.js";
import type { ChilexpressConfig } from "../config.js";
import type { TrackingResponse } from "../types.js";

/**
 * Servicio de Tracking (seguimiento). Permite consultar el estado actual y
 * el historial de eventos de un envio por su numero de seguimiento
 * (transportOrderNumber / OT).
 */
export class TrackingService {
  private readonly http: HttpClient;

  constructor(private readonly config: ChilexpressConfig) {
    this.http = new HttpClient(config);
  }

  /**
   * Consulta el seguimiento de un envio.
   *
   * @param trackingNumber Numero de orden de transporte (OT) a consultar.
   * @returns Sobre estandar de Chilexpress con el estado y el historial.
   */
  async getByTrackingNumber(trackingNumber: string | number): Promise<TrackingResponse> {
    return this.http.request<TrackingResponse>({
      method: "GET",
      path: PATHS.tracking,
      pathParams: { trackingNumber },
      subscriptionKey: this.config.enviosKey,
      productName: "Envíos",
    });
  }
}
