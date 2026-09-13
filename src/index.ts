import { loadConfig, type ChilexpressConfig } from "./config.js";
import { TrackingService } from "./services/tracking.js";
import { TransportOrdersService } from "./services/transportOrders.js";

export * from "./types.js";
export * from "./errors.js";
export { PATHS, BASE_URLS, type Environment } from "./endpoints.js";
export type { ChilexpressConfig } from "./config.js";
export { TrackingService } from "./services/tracking.js";
export { TransportOrdersService } from "./services/transportOrders.js";

/**
 * Cliente de Chilexpress. Agrupa los servicios disponibles.
 *
 * @example
 * ```ts
 * import { ChilexpressClient } from "chilexpress-api";
 *
 * const client = new ChilexpressClient(); // lee las keys desde .env
 * const res = await client.tracking.getByTrackingNumber("990000000001");
 * console.log(res.data?.statusDescription);
 * ```
 */
export class ChilexpressClient {
  readonly config: ChilexpressConfig;
  readonly tracking: TrackingService;
  readonly transportOrders: TransportOrdersService;

  constructor(overrides: Partial<ChilexpressConfig> = {}) {
    this.config = loadConfig(overrides);
    this.tracking = new TrackingService(this.config);
    this.transportOrders = new TransportOrdersService(this.config);
  }
}

export default ChilexpressClient;
