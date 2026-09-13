/** Error base de la libreria. */
export class ChilexpressError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ChilexpressError";
  }
}

/** Error de configuracion (por ejemplo, falta una subscription key). */
export class ChilexpressConfigError extends ChilexpressError {
  constructor(message: string) {
    super(message);
    this.name = "ChilexpressConfigError";
  }
}

/**
 * Error devuelto por la API de Chilexpress (respuesta HTTP no exitosa o
 * cuerpo con codigo de error). Incluye el status HTTP y el cuerpo crudo
 * para facilitar el diagnostico.
 */
export class ChilexpressApiError extends ChilexpressError {
  readonly status: number;
  readonly url: string;
  readonly body: unknown;

  constructor(message: string, params: { status: number; url: string; body: unknown }) {
    super(message);
    this.name = "ChilexpressApiError";
    this.status = params.status;
    this.url = params.url;
    this.body = params.body;
  }
}
