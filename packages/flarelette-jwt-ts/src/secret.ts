
export function generateSecret(lengthBytes = 64): string {
  const buf = new Uint8Array(lengthBytes);
  const wcrypto = (globalThis.crypto || (require('crypto').webcrypto));
  wcrypto.getRandomValues(buf);
  const b64 = Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return b64;
}
export function isValidBase64UrlSecret(s: string, minBytes = 64): boolean {
  if (!/^[A-Za-z0-9\-_]+$/.test(s)) return false;
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  try {
    const bytes = Buffer.from(b64, 'base64');
    return bytes.length >= minBytes;
  } catch {
    return false;
  }
}
