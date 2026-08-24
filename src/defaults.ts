import type { FormData, SiteCondition } from './types'
import { conditions } from './constants'

export const id = () => crypto.randomUUID()
const blankConditions = Object.fromEntries(conditions.map(([key]) => [key, { answer: '', comment: '' }])) as Record<string, SiteCondition>

export const createInitialData = (): FormData => ({
  customerName: '', address: '', projectName: '', assessmentDate: new Date().toISOString().slice(0, 10),
  assessor: '', otherAssessor: '', workTypes: [], otherWorkType: '',
  totalDays: 1, personnel: [{ id: id(), people: 1, days: 1 }], certainty: '', uncertainty: '',
  needsExcavator: false, excavators: [], loaderChoice: 'Nej', machines: [],
  smallCompactor: false, smallCompactorDays: 1, smallCompactorOwnership: 'Hyrd', smallCompactorComment: '',
  largeCompactor: false, largeCompactorDays: 1, largeCompactorOwnership: 'Hyrd', largeCompactorComment: '',
  needsEquipment: false, equipment: [], materialInNeeded: false, materialsIn: [], massOutNeeded: false, massesOut: [],
  otherMaterialNeeded: false, otherMaterials: [], purpose: '', workMoments: [], executionOverview: '',
  conditions: blankConditions, additionalInfo: '', images: [],
})

export const blankExcavator = () => ({ id: id(), size: '', customSize: '', days: 1, ownership: 'Egen', transportTo: true, transportFrom: true, comment: '' })
export const blankMachine = (type = '') => ({ id: id(), type, size: '', days: 1, ownership: 'Hyrd', transportTo: true, transportFrom: true, comment: '' })
export const blankEquipment = () => ({ id: id(), type: '', customType: '', size: '', quantity: 1, days: 1, ownership: 'Hyrd', transport: false, comment: '' })
export const blankMaterialIn = () => ({ id: id(), type: '', customType: '', quantity: 1, unit: 'Ton', deliveries: 1, deliveryMethod: 'Massorna tippas', placement: '', comment: '' })
export const blankMassOut = () => ({ id: id(), type: '', customType: '', quantity: 1, unit: 'Ton', loads: 1, contamination: 'Nej', destination: '', comment: '' })
export const blankOtherMaterial = () => ({ id: id(), material: '', customMaterial: '', quantity: 1, unit: 'Styck', specification: '', comment: '' })
