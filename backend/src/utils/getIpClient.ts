import { Context } from "hono";
import { getConnInfo } from "hono/bun";

export const getClientIP = (c: Context) => {
  // 1. Intentar obtener de encabezados de Proxy (Producción)
  const forwarded = c.req.header('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0];

  // 2. Intentar obtener de Cloudflare
  const cf = c.req.header('cf-connecting-ip');
  if (cf) return cf;

  // 3. Respaldo para Bun local
  const info = getConnInfo(c);
  return info.remote.address || '127.0.0.1';
}