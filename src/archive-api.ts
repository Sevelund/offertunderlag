import type { FormData } from './types'
import { archiveUrl, listArchivedForms, loadArchivedForm, type SavedArchiveSummary } from './archive'

export const ARCHIVE_API_URL = 'https://sevelund-formulararkiv.sevelund.chatgpt.site'
export const LOCAL_MIGRATION_KEY = 'sevelund-offertunderlag-gemensamt-arkiv-v1'

const request = async (path: string, password: string, init: RequestInit = {}) => {
  const response = await fetch(`${ARCHIVE_API_URL}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', 'x-sevelund-password': password, ...init.headers },
  })
  if (!response.ok) {
    let message = 'Den gemensamma lagringen kunde inte nås.'
    try { message = (await response.json() as { error?: string }).error || message } catch { /* Behåll standardtexten. */ }
    throw new Error(message)
  }
  return response
}

export async function listRemoteArchives(password: string, location: Location = window.location): Promise<SavedArchiveSummary[]> {
  const response = await request('/archives', password)
  const forms = await response.json() as Omit<SavedArchiveSummary, 'url'>[]
  return forms.map(form => ({ ...form, url: archiveUrl(form.id, location) }))
}

export async function loadRemoteArchive(id: string, password: string): Promise<FormData> {
  const response = await request(`/archives/${encodeURIComponent(id)}`, password)
  return response.json() as Promise<FormData>
}

export async function saveRemoteArchive(id: string, data: FormData, password: string, onlyIfMissing = false) {
  await request(`/archives/${encodeURIComponent(id)}`, password, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: onlyIfMissing ? { 'x-archive-migration': '1' } : undefined,
  })
}

export async function deleteRemoteArchive(id: string, password: string) {
  await request(`/archives/${encodeURIComponent(id)}`, password, { method: 'DELETE' })
}

export async function migrateLocalArchives(password: string, storage: Storage = localStorage, location: Location = window.location) {
  if (storage.getItem(LOCAL_MIGRATION_KEY) === 'done') return 0
  const localForms = listArchivedForms(storage, location)
  for (const form of localForms) {
    const data = loadArchivedForm(form.id, storage)
    if (data) await saveRemoteArchive(form.id, data, password, true)
  }
  storage.setItem(LOCAL_MIGRATION_KEY, 'done')
  return localForms.length
}
