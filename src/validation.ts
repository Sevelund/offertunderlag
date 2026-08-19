import type { FormData } from './types'
import { conditions } from './constants'

export const getStepErrors = (data: FormData): Record<number, string[]> => {
  const e: Record<number, string[]> = {}
  const add = (step: number, message: string) => { (e[step] ||= []).push(message) }
  if (!data.address.trim()) add(1, 'Arbetsplatsens adress saknas')
  if (!data.assessmentDate) add(1, 'Datum för bedömningen saknas')
  if (!data.assessor) add(1, 'Vem som gjort bedömningen saknas')
  if (data.assessor === 'Annan' && !data.otherAssessor.trim()) add(1, 'Ange vem som gjort bedömningen')
  if (!data.workTypes.length) add(1, 'Välj minst en typ av arbete')
  if (data.workTypes.includes('Annat') && !data.otherWorkType.trim()) add(1, 'Beskriv annan typ av arbete')
  if (data.totalDays <= 0) add(2, 'Beräknad arbetstid måste vara större än noll')
  if (!data.personnel.length || data.personnel.some(p => p.people <= 0 || p.days <= 0)) add(2, 'Personalperioderna måste vara komplett ifyllda')
  if (!data.certainty) add(2, 'Välj hur säker tidsuppskattningen är')
  if (data.certainty !== 'Relativt säker' && !data.uncertainty.trim()) add(2, 'Beskriv osäkerheten')
  if (data.needsExcavator && (!data.excavators.length || data.excavators.some(x => !x.size || x.days <= 0 || (x.size === 'Annan storlek' && !x.customSize.trim())))) add(3, 'Fyll i alla grävmaskiner')
  if (data.loaderChoice !== 'Nej' && (!data.machines.length || data.machines.some(x => !x.type || !x.size.trim() || x.days <= 0))) add(4, 'Fyll i alla dumprar/hjullastare')
  if (data.needsEquipment && (!data.equipment.length || data.equipment.some(x => !x.type || x.quantity <= 0 || x.days <= 0))) add(5, 'Fyll i all övrig utrustning')
  if (data.materialInNeeded && (!data.materialsIn.length || data.materialsIn.some(x => !x.type || x.quantity <= 0 || !x.unit))) add(6, 'Fyll i allt material till arbetsplatsen')
  if (data.massOutNeeded && (!data.massesOut.length || data.massesOut.some(x => !x.type || x.quantity <= 0 || !x.unit))) add(7, 'Fyll i alla massor som ska köras bort')
  if (data.otherMaterialNeeded && (!data.otherMaterials.length || data.otherMaterials.some(x => !x.material || x.quantity <= 0 || !x.unit))) add(8, 'Fyll i allt övrigt material')
  if (!data.purpose.trim()) add(9, 'Beskriv syftet och det färdiga resultatet')
  if (!data.workMoments.length || data.workMoments.some(x => !x.description.trim())) add(10, 'Lägg till minst ett komplett arbetsmoment')
  conditions.forEach(([key, label]) => { if (!data.conditions[key]?.answer) add(11, `Besvara: ${label}`) })
  return e
}

export const isComplete = (data: FormData) => Object.keys(getStepErrors(data)).length === 0

export const canAdvance = (data: FormData, step: number) => !(getStepErrors(data)[step]?.length)
