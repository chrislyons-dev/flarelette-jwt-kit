
export function parse(token: string): { header: any; payload: any } {
  const [hb, pb] = token.split('.')
  const dec = (s: string) => JSON.parse(Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8'))
  return { header: dec(hb), payload: dec(pb) }
}
export function isExpiringSoon(payload: Record<string, any>, seconds: number): boolean {
  const now = Math.floor(Date.now() / 1000)
  return (payload.exp ?? 0) - now <= seconds
}
export function mapScopesToPermissions(scopes: string[]): string[] { return scopes }
