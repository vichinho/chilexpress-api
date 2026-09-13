import { HttpClient } from "../http.js";
import { PATHS } from "../endpoints.js";
import type { ChilexpressConfig } from "../config.js";
import type { TrackingResponse } from "../types.js";

/** Campo por el cual se consulta la OT en el body del tracking. */
export type TrackingField = "reference" | "transportOrderNumber";

/** statusCodes de "no disponible / no encontrada" al consultar una OT. */
const UNAVAILABLE_STATUSES = new Set([-41, -81]);

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
   * Intenta primero por `transportOrderNumber` (el numero de OT) y, si no esta
   * disponible (statusCode -41/-81), reintenta por `reference`. Devuelve la
   * primera respuesta con exito (statusCode 0) o, si ninguna, la primera.
   *
   * @param trackingNumber Numero de orden de transporte (OT).
   */
  async getByTrackingNumber(trackingNumber: string | number): Promise<TrackingResponse> {
    const fields: TrackingField[] = ["transportOrderNumber", "reference"];
    let first: TrackingResponse | undefined;

    for (const field of fields) {
      const res = await this.query(trackingNumber, field);
      first ??= res;
      if (res.statusCode === 0) return res; // encontrada
      if (!UNAVAILABLE_STATUSES.has(Number(res.statusCode))) return res; // otro estado real
    }

    return first!;
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
