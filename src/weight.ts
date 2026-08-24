export const materialDensities = [
  { name: 'Fast berg', density: 2.6 },
  { name: 'Spräckt berg', density: 1.8 },
  { name: 'Bergkross', density: 1.7 },
  { name: 'Blandade schaktmassor', density: 1.8 },
  { name: 'Jordmassor', density: 1.6 },
  { name: 'Lera', density: 1.7 },
  { name: 'Sand', density: 1.6 },
  { name: 'Grus / makadam', density: 1.7 },
  { name: 'Betong', density: 2.4 },
  { name: 'Asfalt', density: 2.4 },
  { name: 'Annat', density: 1 },
] as const

export function calculateTransport(volume: number, density: number, minLoad: number, maxLoad: number) {
  const weight = Math.max(0, volume) * Math.max(0, density)
  if (!weight || minLoad <= 0 || maxLoad <= 0) return { weight, minLoads: 0, maxLoads: 0 }
  const lowerCapacity = Math.min(minLoad, maxLoad)
  const upperCapacity = Math.max(minLoad, maxLoad)
  return {
    weight,
    minLoads: Math.ceil(weight / upperCapacity),
    maxLoads: Math.ceil(weight / lowerCapacity),
  }
}
