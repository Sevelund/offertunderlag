import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createInitialData } from './defaults'
import { ARCHIVE_API_URL, LOCAL_MIGRATION_KEY, listRemoteArchives, migrateLocalArchives } from './archive-api'
import { saveArchivedForm } from './archive'

describe('gemensamt formulärarkiv', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('hämtar samtliga formulär och skapar lokala öppningslänkar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify([{
      id: '20260902-abcdef12', customerName: 'Anna', address: 'Testvägen 1', assessmentDate: '2026-09-02', savedDate: '2026-09-02', imageCount: 0,
    }]), { status: 200, headers: { 'content-type': 'application/json' } })))
    const forms = await listRemoteArchives('lösenord', { href: 'https://sevelund.github.io/offertunderlag/' } as Location)
    expect(forms[0]).toMatchObject({ address: 'Testvägen 1', url: 'https://sevelund.github.io/offertunderlag/?underlag=20260902-abcdef12' })
    expect(fetch).toHaveBeenCalledWith(`${ARCHIVE_API_URL}/archives`, expect.objectContaining({ headers: expect.objectContaining({ authorization: 'Bearer lösenord' }) }))
  })

  it('för över äldre lokala formulär endast en gång', async () => {
    const data = createInitialData(); data.address = 'Gammalvägen 1'
    saveArchivedForm(data, localStorage, { href: 'https://sevelund.github.io/offertunderlag/' } as Location)
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ id: 'ok' }), { status: 200, headers: { 'content-type': 'application/json' } }))
    vi.stubGlobal('fetch', fetchMock)
    expect(await migrateLocalArchives('lösenord')).toBe(1)
    expect(localStorage.getItem(LOCAL_MIGRATION_KEY)).toBe('done')
    expect(await migrateLocalArchives('lösenord')).toBe(0)
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
