import { describe, expect, it } from 'vitest'
import { calculateTransport } from './weight'

describe('vikt- och lassgenerator', () => {
  it('räknar 10 m³ fast berg till 26 ton och 3 lass', () => {
    expect(calculateTransport(10, 2.6, 10, 12)).toEqual({ weight: 26, minLoads: 3, maxLoads: 3 })
  })

  it('visar ett intervall när lastkapaciteten påverkar antalet lass', () => {
    expect(calculateTransport(20, 1.8, 10, 12)).toEqual({ weight: 36, minLoads: 3, maxLoads: 4 })
  })
})
