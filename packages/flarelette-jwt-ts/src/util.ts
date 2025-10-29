export function parse(token: string): {
  header: Record<string, unknown>
  payload: Record<string, unknown>
} {
  const [hb, pb] = token.split('.')
  const dec = (s: string) =>
    JSON.parse(
      Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8')
    ) as Record<string, unknown>
  return { header: dec(hb), payload: dec(pb) }
}

export function isExpiringSoon(
  payload: Record<string, unknown>,
  seconds: number
): boolean {
  const now = Math.floor(Date.now() / 1000)
  const exp = typeof payload.exp === 'number' ? payload.exp : 0
  return exp - now <= seconds
}

export function mapScopesToPermissions(scopes: string[]): string[] {
  return scopes
}
