const esProduccion = import.meta.env.PROD;

export const logger = {
  debug: (mensaje: string, ...datos: unknown[]) => {
    if (!esProduccion) {
      console.log(`%c[DEBUG] ${mensaje}`, 'color: #94e2d5;', ...datos);
    }
  },
  info: (mensaje: string, ...datos: unknown[]) => {
    console.log(`%c[INFO] ${mensaje}`, 'color: #89b4fa;', ...datos);
  },
  warn: (mensaje: string, ...datos: unknown[]) => {
    console.warn(`%c[WARN] ${mensaje}`, 'color: #f9e2af;', ...datos);
  },
  error: (mensaje: string, ...datos: unknown[]) => {
    console.error(`%c[ERROR] ${mensaje}`, 'color: #f38ba8; font-weight: bold;', ...datos);
  }
};
