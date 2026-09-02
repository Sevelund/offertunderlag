import { ARCHIVE_API_URL } from './archive-api'

export const SITE_AUTH_KEY = 'sevelund-offertunderlag-site-auth'

export async function verifyPassword(password: string) {
  try {
    const response = await fetch(`${ARCHIVE_API_URL}/auth`, { headers: { 'x-sevelund-password': password } })
    return response.ok
  } catch { return false }
}

export function sessionIsUnlocked(key: string) {
  try { return Boolean(sessionStorage.getItem(`${key}-password`)) }
  catch { return false }
}

export function sessionPassword(key: string) {
  try { return sessionStorage.getItem(`${key}-password`) || '' }
  catch { return '' }
}

export function unlockSession(key: string, password: string) {
  try { sessionStorage.setItem(`${key}-password`, password) }
  catch { /* Lösenordet får anges igen om sessionslagring är blockerad. */ }
}
