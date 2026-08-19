export const SITE_AUTH_KEY = 'sevelund-offertunderlag-site-auth'

export const SITE_PASSWORD_HASH = '36639c32351b36ee920219578afa34e2743f2a10065bf42297fbccc75b29f10f'

export async function verifyPassword(password: string, expectedHash: string) {
  const bytes = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  const actualHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
  return actualHash === expectedHash
}

export function sessionIsUnlocked(key: string) {
  try { return sessionStorage.getItem(key) === 'unlocked' }
  catch { return false }
}

export function unlockSession(key: string) {
  try { sessionStorage.setItem(key, 'unlocked') }
  catch { /* Lösenordet får anges igen om sessionslagring är blockerad. */ }
}
