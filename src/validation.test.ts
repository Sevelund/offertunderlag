import { describe, expect, it } from 'vitest'
import { createInitialData } from './defaults'
import { canAdvance, getStepErrors, isComplete } from './validation'
import { conditions } from './constants'
import { buildStructuredSummary, safeFileName } from './pdf'

const completeData = () => {
  const data = createInitialData()
  data.customerName = 'Testkund'; data.address = 'Testvägen 1'; data.assessor = 'Adam'; data.workTypes = ['Markarbete']
  data.certainty = 'Relativt säker'; data.purpose = 'Färdig yta'; data.workMoments = [{ id: '1', description: 'Schakta ytan' }]
  conditions.forEach(([key]) => { data.conditions[key] = { answer: 'Nej', comment: '' } })
  return data
}

describe('formulärvalidering', () => {
  it('visar obligatoriska fel för ett nytt formulär', () => { expect(Object.keys(getStepErrors(createInitialData())).length).toBeGreaterThan(0) })
  it('godkänner ett komplett minimiunderlag', () => { expect(isComplete(completeData())).toBe(true) })
  it('kräver kommentar när tidsuppskattningen är osäker', () => { const d = completeData(); d.certainty = 'Mycket osäker'; expect(getStepErrors(d)[2]).toContain('Beskriv osäkerheten') })
  it('stoppar nästa steg när aktuellt steg har fel', () => { const d = completeData(); d.address = ''; expect(canAdvance(d, 1)).toBe(false); expect(canAdvance(d, 2)).toBe(true) })
  it('tillåter att kundens namn lämnas tomt', () => { const d = completeData(); d.customerName = ''; expect(getStepErrors(d)[1]).toBeUndefined() })
})

describe('PDF-underlag', () => {
  it('skapar säkert filnamn med svenska tecken', () => { expect(safeFileName('Älvsjö / Ny yta!')).toBe('alvsjo-ny-yta') })
  it('separerar mängd och enhet i strukturerad data', () => { const d = completeData(); d.materialsIn = [{ id: '1', type: 'Makadam 8/16', customType: '', quantity: 12, unit: 'Ton', deliveries: 1, deliveryMethod: 'Tippas löst', placement: 'Uppfart', comment: '' }]; const summary = buildStructuredSummary(d); expect(summary.material_till[0]).toMatchObject({ mangd: 12, enhet: 'Ton' }) })
})
