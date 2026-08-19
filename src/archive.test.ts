import { beforeEach, describe, expect, it } from 'vitest'
import { createInitialData } from './defaults'
import { archiveIdFromUrl, deleteArchivedForm, listArchivedForms, loadArchivedForm, saveArchivedForm } from './archive'

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

  it('listar och raderar tidigare sparade formulär', () => {
    const location = { href: 'https://sevelund.github.io/offertunderlag/' } as Location
    const first = createInitialData(); first.address = 'Första vägen 1'; first.customerName = 'Anna'
    const second = createInitialData(); second.address = 'Andra vägen 2'; second.images = [{ id: 'bild', dataUrl: 'data:image/jpeg;base64,AA', caption: '', name: 'bild.jpg' }]
    const savedFirst = saveArchivedForm(first, localStorage, location)
    const savedSecond = saveArchivedForm(second, localStorage, location)
    const forms = listArchivedForms(localStorage, location)
    expect(forms).toHaveLength(2)
    expect(forms.find(x => x.id === savedFirst.id)).toMatchObject({ address: 'Första vägen 1', customerName: 'Anna' })
    expect(forms.find(x => x.id === savedSecond.id)?.imageCount).toBe(1)
    deleteArchivedForm(savedFirst.id, localStorage)
    expect(listArchivedForms(localStorage, location)).toHaveLength(1)
  })
})
