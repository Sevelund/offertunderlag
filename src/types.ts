export type Choice = 'Ja' | 'Nej' | 'Okänt' | ''

export interface PersonPeriod { id: string; people: number; days: number }
export interface Excavator { id: string; size: string; customSize: string; days: number; ownership: string; transportTo: boolean; transportFrom: boolean; comment: string }
export interface Machine { id: string; type: string; size: string; days: number; ownership: string; transportTo: boolean; transportFrom: boolean; comment: string }
export interface Equipment { id: string; type: string; customType: string; size: string; quantity: number; days: number; ownership: string; transport: boolean; comment: string }
export interface MaterialIn { id: string; type: string; customType: string; quantity: number; unit: string; deliveries: number; deliveryMethod: string; placement: string; comment: string }
export interface MassOut { id: string; type: string; customType: string; quantity: number; unit: string; loads: number; contamination: string; destination: string; comment: string }
export interface OtherMaterial { id: string; material: string; customMaterial: string; quantity: number; unit: string; specification: string; comment: string }
export interface WorkMoment { id: string; description: string }
export interface SiteCondition { answer: Choice; comment: string }
export interface ProjectImage { id: string; dataUrl: string; caption: string; name: string }

export interface FormData {
  customerName: string; address: string; projectName: string; assessmentDate: string;
  assessor: string; otherAssessor: string; workTypes: string[]; otherWorkType: string;
  totalDays: number; personnel: PersonPeriod[]; certainty: string; uncertainty: string;
  needsExcavator: boolean; excavators: Excavator[];
  loaderChoice: string; machines: Machine[];
  smallCompactor: boolean; smallCompactorDays: number; smallCompactorOwnership: string; smallCompactorComment: string;
  largeCompactor: boolean; largeCompactorDays: number; largeCompactorOwnership: string; largeCompactorComment: string;
  needsEquipment: boolean; equipment: Equipment[];
  materialInNeeded: boolean; materialsIn: MaterialIn[];
  massOutNeeded: boolean; massesOut: MassOut[];
  otherMaterialNeeded: boolean; otherMaterials: OtherMaterial[];
  purpose: string; workMoments: WorkMoment[]; executionOverview: string;
  conditions: Record<string, SiteCondition>;
  additionalInfo: string; images: ProjectImage[];
}
