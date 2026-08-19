import type { FormData } from './types'

export const ACTIVE_STORAGE_KEY = 'sevelund-offertunderlag-v1'
export const ARCHIVE_PREFIX = 'sevelund-offertunderlag-arkiv-'

export interface SavedArchive { id: string; url: string }
export interface SavedArchiveSummary extends SavedArchive {
  customerName: string
  address: string
  assessmentDate: string
  savedDate: string
  imageCount: number
}

export const archiveKey = (id: string) => `${ARCHIVE_PREFIX}${id}`

const archiveUrl = (id: string, location: Location) => {
  const url = new URL(location.href)
  url.search = ''
  url.hash = ''
  url.searchParams.set('underlag', id)
  return url.toString()
}

const savedDateFromId = (id: string) => {
  const compact = id.split('-')[0]
  return /^\d{8}$/.test(compact) ? `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}` : ''
}

export function createArchiveId() {
  const date = new Date().toISOString().slice(0, 10).replaceAll('-', '')
  return `${date}-${crypto.randomUUID().slice(0, 8)}`
}

export function saveArchivedForm(data: FormData, storage: Storage = localStorage, location: Location = window.location): SavedArchive {
  const id = createArchiveId()
  storage.setItem(archiveKey(id), JSON.stringify(data))
  return { id, url: archiveUrl(id, location) }
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

export function listArchivedForms(storage: Storage = localStorage, location: Location = window.location): SavedArchiveSummary[] {
  const forms: SavedArchiveSummary[] = []
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index)
    if (!key?.startsWith(ARCHIVE_PREFIX)) continue
    const id = key.slice(ARCHIVE_PREFIX.length)
    const data = loadArchivedForm(id, storage)
    if (!data) continue
    forms.push({
      id,
      url: archiveUrl(id, location),
      customerName: data.customerName || '',
      address: data.address || '',
      assessmentDate: data.assessmentDate || '',
      savedDate: savedDateFromId(id),
      imageCount: data.images?.length || 0,
    })
  }
  return forms.sort((a, b) => b.id.localeCompare(a.id))
}

export function deleteArchivedForm(id: string, storage: Storage = localStorage) {
  storage.removeItem(archiveKey(id))
}
