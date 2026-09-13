import { HttpClient } from "../http.js";
import { PATHS } from "../endpoints.js";
import type { ChilexpressConfig } from "../config.js";
import type {
  CreateTransportOrderRequest,
  CreateTransportOrderResponse,
} from "../types.js";

/**
 * Servicio de Órdenes de Transporte. Permite generar envios y obtener su
 * numero de OT, codigo de barras y etiqueta imprimible.
 */
export class TransportOrdersService {
  private readonly http: HttpClient;

  constructor(private readonly config: ChilexpressConfig) {
    this.http = new HttpClient(config);
  }

  /** Crea una orden de transporte individual. */
  async create(
    request: CreateTransportOrderRequest
  ): Promise<CreateTransportOrderResponse> {
    return this.http.request<CreateTransportOrderResponse>({
      method: "POST",
      path: PATHS.transportOrders,
      body: request,
      subscriptionKey: this.config.enviosKey,
      productName: "Envíos",
    });
  }

  /** Crea varias ordenes de transporte en un solo request. */
  async createMany(
    requests: CreateTransportOrderRequest[]
  ): Promise<CreateTransportOrderResponse> {
    return this.http.request<CreateTransportOrderResponse>({
      method: "POST",
      path: PATHS.transportOrdersMassive,
      body: requests,
      subscriptionKey: this.config.enviosKey,
      productName: "Envíos",
    });
  }
}
