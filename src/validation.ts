import type { FormData } from './types'
import { conditions } from './constants'

export const getStepErrors = (data: FormData): Record<number, string[]> => {
  const e: Record<number, string[]> = {}
  const add = (step: number, message: string) => { (e[step] ||= []).push(message) }
  const validDays = (value: number) => Number.isInteger(value) && value >= 1
  if (!data.address.trim()) add(1, 'Arbetsplatsens adress saknas')
  if (!data.assessmentDate) add(1, 'Datum för bedömningen saknas')
  if (!data.assessor) add(1, 'Vem som gjort bedömningen saknas')
  if (data.assessor === 'Annan' && !data.otherAssessor.trim()) add(1, 'Ange vem som gjort bedömningen')
  if (!data.workTypes.length) add(1, 'Välj minst en typ av arbete')
  if (data.workTypes.includes('Annat') && !data.otherWorkType.trim()) add(1, 'Beskriv annan typ av arbete')
  if (!validDays(data.totalDays)) add(2, 'Beräknad arbetstid måste anges i hela dagar')
  if (!data.personnel.length || data.personnel.some(p => p.people <= 0 || !validDays(p.days))) add(2, 'Personalperioderna måste anges med hela dagar')
  if (!data.certainty) add(2, 'Välj hur säker tidsuppskattningen är')
  if (data.certainty !== 'Relativt säker' && !data.uncertainty.trim()) add(2, 'Beskriv osäkerheten')
  if (data.needsExcavator && (!data.excavators.length || data.excavators.some(x => !x.size || !validDays(x.days) || (x.size === 'Annan storlek' && !x.customSize.trim())))) add(3, 'Fyll i alla grävmaskiner och ange hela dagar')
  if (data.loaderChoice !== 'Nej' && (!data.machines.length || data.machines.some(x => !x.type || !x.size.trim() || !validDays(x.days)))) add(4, 'Fyll i alla dumprar/hjullastare och ange hela dagar')
  if ((data.smallCompactor && !validDays(data.smallCompactorDays)) || (data.largeCompactor && !validDays(data.largeCompactorDays))) add(5, 'Antal dagar för padda måste anges i hela dagar')
  if (data.needsEquipment && (!data.equipment.length || data.equipment.some(x => !x.type || x.quantity <= 0 || !validDays(x.days)))) add(5, 'Fyll i all övrig utrustning och ange hela dagar')
  if (data.materialInNeeded && (!data.materialsIn.length || data.materialsIn.some(x => !x.type || x.quantity <= 0 || !x.unit))) add(6, 'Fyll i allt material till arbetsplatsen')
  if (data.massOutNeeded && (!data.massesOut.length || data.massesOut.some(x => !x.type || x.quantity <= 0 || !x.unit))) add(7, 'Fyll i alla massor som ska köras bort')
  if (data.otherMaterialNeeded && (!data.otherMaterials.length || data.otherMaterials.some(x => !x.material || x.quantity <= 0 || !x.unit))) add(8, 'Fyll i allt övrigt material')
  if (!data.purpose.trim()) add(9, 'Beskriv syftet och det färdiga resultatet')
  if (data.workMoments.some(x => !x.description.trim())) add(10, 'Fyll i eller ta bort tomma arbetsmoment')
  conditions.forEach(([key, label]) => { if (!data.conditions[key]?.answer) add(11, `Besvara: ${label}`) })
  return e
}

export const isComplete = (data: FormData) => Object.keys(getStepErrors(data)).length === 0

export const canAdvance = (data: FormData, step: number) => !(getStepErrors(data)[step]?.length)
