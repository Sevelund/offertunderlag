import type { FormData } from './types'

export const ACTIVE_STORAGE_KEY = 'sevelund-offertunderlag-v1'
export const ARCHIVE_PREFIX = 'sevelund-offertunderlag-arkiv-'

export interface SavedArchive { id: string; url: string }

export const archiveKey = (id: string) => `${ARCHIVE_PREFIX}${id}`

export function createArchiveId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  return `${date}-${crypto.randomUUID().slice(0, 8)}`
}

export function saveArchivedForm(data: FormData, storage: Storage = localStorage, location: Location = window.location): SavedArchive {
  const id = createArchiveId()
  storage.setItem(archiveKey(id), JSON.stringify(data))
  const url = new URL(location.href)
  url.search = ''
  url.hash = ''
  url.searchParams.set('underlag', id)
  return { id, url: url.toString() }
}

export function loadArchivedForm(id: string, storage: Storage = localStorage): FormData | null {
  try {
    const raw = storage.getItem(archiveKey(id))
    return raw ? JSON.parse(raw) as FormData : null
  } catch { return null }
}

export function archiveIdFromUrl(location: Location = window.location) {
  return new URLSearchParams(location.search).get('underlag') || ''
}
