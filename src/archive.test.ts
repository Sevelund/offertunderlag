import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialData } from './defaults'
import { archiveIdFromUrl, loadArchivedForm, saveArchivedForm } from './archive'

describe('sparade formulärkopior', () => {
  beforeEach(() => localStorage.clear())

  it('sparar en kopia och skapar en öppningsbar webbadress', () => {
    const data = createInitialData(); data.customerName = 'Testkund'
    const location = { href: 'https://sevelund.github.io/offertunderlag/' } as Location
    const saved = saveArchivedForm(data, localStorage, location)
    expect(saved.url).toContain('?underlag=')
    expect(loadArchivedForm(saved.id, localStorage)?.customerName).toBe('Testkund')
  })

  it('läser kopians id ur webbadressen', () => {
    expect(archiveIdFromUrl({ search: '?underlag=abc-123' } as Location)).toBe('abc-123')
  })
})
