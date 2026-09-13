import { BASE_URLS, SUBSCRIPTION_KEY_HEADER } from "./endpoints.js";
import type { ChilexpressConfig } from "./config.js";
import { ChilexpressApiError, ChilexpressConfigError } from "./errors.js";

type Method = "GET" | "POST";

interface RequestOptions {
  method: Method;
  path: string;
  /** Subscription key a usar en este request (segun el producto). */
  subscriptionKey: string | undefined;
  /** Nombre del producto, solo para mensajes de error claros. */
  productName: string;
  /** Cuerpo JSON (solo POST). */
  body?: unknown;
  /** Reemplazos para placeholders del path, p.ej. { trackingNumber: "123" }. */
  pathParams?: Record<string, string | number>;
}

function buildUrl(base: string, path: string, pathParams?: Record<string, string | number>): string {
  let resolved = path;
  if (pathParams) {
    for (const [key, value] of Object.entries(pathParams)) {
      resolved = resolved.replace(`{${key}}`, encodeURIComponent(String(value)));
    }
  }
  return `${base}${resolved}`;
}

/** Cliente HTTP minimo, con timeout y manejo de errores homogeneo. */
export class HttpClient {
  constructor(private readonly config: ChilexpressConfig) {}

  async request<T>(opts: RequestOptions): Promise<T> {
    if (!opts.subscriptionKey) {
      throw new ChilexpressConfigError(
        `Falta la subscription key del producto "${opts.productName}". ` +
          `Definela en tu archivo .env o al construir el cliente.`
      );
    }

    const base = BASE_URLS[this.config.environment];
    const url = buildUrl(base, opts.path, opts.pathParams);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.config.timeoutMs);

    let response: Response;
    try {
      response = await fetch(url, {
        method: opts.method,
        headers: {
          [SUBSCRIPTION_KEY_HEADER]: opts.subscriptionKey,
          Accept: "application/json",
          ...(opts.body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        signal: controller.signal,
      });
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        throw new ChilexpressApiError(
          `Timeout tras ${this.config.timeoutMs} ms al llamar a Chilexpress.`,
          { status: 0, url, body: null }
        );
      }
      throw new ChilexpressApiError(
        `Error de red al llamar a Chilexpress: ${(err as Error).message}`,
        { status: 0, url, body: null }
      );
    } finally {
      clearTimeout(timeout);
    }

    const raw = await response.text();
    const parsed = safeJsonParse(raw);

    if (!response.ok) {
      throw new ChilexpressApiError(
        `Chilexpress respondio ${response.status} ${response.statusText} en ${opts.path}`,
        { status: response.status, url, body: parsed ?? raw }
      );
    }

    return (parsed as T) ?? ({} as T);
  }
}

function safeJsonParse(text: string): unknown {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
