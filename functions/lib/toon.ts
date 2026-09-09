import { decode, encode } from '@toon-format/toon';

export const TOON_CONTENT_TYPE = 'text/toon; charset=utf-8';

export function toonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(encode(body), {
    status,
    headers: { 'Content-Type': TOON_CONTENT_TYPE, ...extraHeaders },
  });
}

export async function readToonBody<T = Record<string, unknown>>(request: Request): Promise<T> {
  const text = await request.text();
  if (!text) return {} as T;
  return decode(text) as T;
}
