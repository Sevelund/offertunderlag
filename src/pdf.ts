import { jsPDF } from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { FormData } from './types'
import { conditions } from './constants'

type Row = [string, string]
const yn = (value: boolean) => value ? 'Ja' : 'Nej'
const text = (value: unknown) => value === '' || value == null ? 'Ej angivet' : String(value)
const titled = (selected: string, custom: string, sentinel = 'Annat') => selected === sentinel || selected.startsWith('Annan') ? custom || selected : selected

export const safeFileName = (value: string) => value
  .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
  .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'projekt'

export const buildStructuredSummary = (d: FormData) => ({
  grunduppgifter: {
    kund: d.customerName, adress: d.address, bedomningsdatum: d.assessmentDate,
    bedomare: d.assessor === 'Annan' ? d.otherAssessor : d.assessor,
    arbetstyper: d.workTypes.map(x => x === 'Annat' ? d.otherWorkType : x),
  },
  omfattning: { arbetsdagar: d.totalDays, personalperioder: d.personnel.map(x => ({ antal_personer: x.people, antal_dagar: x.days })), sakerhet: d.certainty, osakerhet: d.uncertainty },
  maskiner: {
    gravmaskiner: d.needsExcavator ? d.excavators.map(x => ({ storlek: titled(x.size, x.customSize, 'Annan storlek'), maskindagar: x.days, agande: x.ownership, transport_till: x.transportTo, transport_fran: x.transportFrom, kommentar: x.comment })) : [],
    dumper_hjullastare: d.machines.map(x => ({ maskintyp: x.type, storlek_modell: x.size, maskindagar: x.days, agande: x.ownership, transport_till: x.transportTo, transport_fran: x.transportFrom, kommentar: x.comment })),
    liten_padda: d.smallCompactor ? { dagar: d.smallCompactorDays, agande: d.smallCompactorOwnership, kommentar: d.smallCompactorComment } : null,
    stor_padda: d.largeCompactor ? { dagar: d.largeCompactorDays, agande: d.largeCompactorOwnership, kommentar: d.largeCompactorComment } : null,
    ovrig_utrustning: d.equipment.map(x => ({ typ: titled(x.type, x.customType), storlek_modell: x.size, antal: x.quantity, dagar: x.days, agande: x.ownership, transport: x.transport, kommentar: x.comment })),
  },
  material_till: d.materialsIn.map(x => ({ materialtyp: titled(x.type, x.customType), mangd: x.quantity, enhet: x.unit, transporter: x.deliveries, leveranssatt: x.deliveryMethod, placering: x.placement, kommentar: x.comment })),
  massor_fran: d.massesOut.map(x => ({ masstyp: titled(x.type, x.customType), mangd: x.quantity, enhet: x.unit, lass: x.loads, fororening: x.contamination, mottagningsplats: x.destination, kommentar: x.comment })),
  ovrigt_material: d.otherMaterials.map(x => ({ material: titled(x.material, x.customMaterial), mangd: x.quantity, enhet: x.unit, specifikation: x.specification, kommentar: x.comment })),
  syfte: d.purpose,
  genomforande: { arbetsmoment: d.workMoments.map((x, i) => ({ ordning: i + 1, moment: x.description })), overgripande: d.executionOverview },
  forutsattningar: Object.fromEntries(conditions.map(([key, label]) => [key, { fraga: label, svar: d.conditions[key].answer, kommentar: d.conditions[key].comment }])),
  ovrig_information: d.additionalInfo,
  bilder: d.images.map((x, i) => ({ nummer: i + 1, filnamn: x.name, bildtext: x.caption })),
})

export function createPdfDocument(d: FormData) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true })
  const margin = 15
  let y = 18
  const ensure = (height = 15) => { if (y + height > 282) { doc.addPage(); y = 18 } }
  const heading = (title: string, level = 1) => {
    ensure(level === 1 ? 18 : 12)
    doc.setTextColor(level === 1 ? 32 : 228, level === 1 ? 32 : 99, level === 1 ? 32 : 0)
    doc.setFont('helvetica', 'bold'); doc.setFontSize(level === 1 ? 15 : 11)
    doc.text(title, margin, y); y += level === 1 ? 8 : 6
    doc.setTextColor(35, 40, 38)
  }
  const paragraph = (value: string) => {
    const lines = doc.splitTextToSize(value || 'Ej angivet', 180)
    ensure(lines.length * 5 + 3); doc.setFont('helvetica', 'normal'); doc.setFontSize(9.5)
    doc.text(lines, margin, y); y += lines.length * 4.5 + 4
  }
  const table = (rows: Row[], headers: [string, string] = ['Uppgift', 'Svar']) => {
    autoTable(doc, { startY: y, head: [headers], body: rows, margin: { left: margin, right: margin },
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: 2.3, overflow: 'linebreak' },
      headStyles: { fillColor: [32, 32, 32], textColor: 255 }, alternateRowStyles: { fillColor: [246, 246, 246] },
      rowPageBreak: 'avoid', showHead: 'everyPage' })
    y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || y) + 6
  }
  const dataTable = (headers: string[], rows: string[][]) => {
    autoTable(doc, { startY: y, head: [headers], body: rows.length ? rows : [['Ej aktuellt', ...headers.slice(1).map(() => '')]], margin: { left: margin, right: margin },
      styles: { font: 'helvetica', fontSize: 7.8, cellPadding: 2.1, overflow: 'linebreak' },
      headStyles: { fillColor: [228, 99, 0], textColor: 0 }, alternateRowStyles: { fillColor: [246, 246, 246] },
      rowPageBreak: 'avoid', showHead: 'everyPage' })
    y = ((doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY || y) + 6
  }

  doc.setFillColor(32, 32, 32); doc.rect(0, 0, 210, 36, 'F')
  doc.setFillColor(228, 99, 0); doc.rect(0, 36, 210, 3, 'F')
  doc.setTextColor(255); doc.setFont('helvetica', 'bold'); doc.setFontSize(19); doc.text('OFFERTUNDERLAG – SEVELUND AB', margin, 18)
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.text('Tekniskt och praktiskt underlag – inga priser', margin, 26)
  y = 45; doc.setTextColor(35, 40, 38)

  heading('1. Grunduppgifter')
  table([['Kund', text(d.customerName)], ['Arbetsplats', text(d.address)], ['Bedömningsdatum', text(d.assessmentDate)], ['Bedömare', d.assessor === 'Annan' ? text(d.otherAssessor) : text(d.assessor)], ['Typ av arbete', d.workTypes.map(x => x === 'Annat' ? d.otherWorkType : x).join(', ')]])
  heading('2. Arbetets omfattning')
  table([['Beräknad total tid', `${d.totalDays} arbetsdagar`], ['Tidsuppskattning', text(d.certainty)], ['Osäkerhet', d.uncertainty || 'Ingen angiven']])
  heading('3. Personal och beräknad tidsåtgång')
  table(d.personnel.map((x, i) => [`Period ${i + 1}`, `${x.people} personer i ${x.days} dagar`]))
  heading('4. Maskiner och utrustning')
  const machineRows: Row[] = []
  if (!d.needsExcavator) machineRows.push(['Grävmaskin', 'Nej'])
  d.excavators.forEach((x, i) => machineRows.push([`Grävmaskin ${i + 1}`, `${titled(x.size, x.customSize, 'Annan storlek')}; ${x.days} dagar; ${x.ownership}; transport till: ${yn(x.transportTo)}; från: ${yn(x.transportFrom)}${x.comment ? `; ${x.comment}` : ''}`]))
  if (d.loaderChoice === 'Nej') machineRows.push(['Dumper/hjullastare', 'Nej'])
  d.machines.forEach((x, i) => machineRows.push([`${x.type} ${i + 1}`, `${x.size}; ${x.days} dagar; ${x.ownership}; transport till: ${yn(x.transportTo)}; från: ${yn(x.transportFrom)}${x.comment ? `; ${x.comment}` : ''}`]))
  machineRows.push(['Liten padda', d.smallCompactor ? `${d.smallCompactorDays} dagar; ${d.smallCompactorOwnership}${d.smallCompactorComment ? `; ${d.smallCompactorComment}` : ''}` : 'Nej'])
  machineRows.push(['Stor padda', d.largeCompactor ? `${d.largeCompactorDays} dagar; ${d.largeCompactorOwnership}${d.largeCompactorComment ? `; ${d.largeCompactorComment}` : ''}` : 'Nej'])
  if (!d.needsEquipment) machineRows.push(['Övrig utrustning', 'Nej'])
  d.equipment.forEach((x, i) => machineRows.push([`Utrustning ${i + 1}`, `${titled(x.type, x.customType)}; ${x.size || 'ingen modell'}; antal ${x.quantity}; ${x.days} dagar; ${x.ownership}; transport: ${yn(x.transport)}${x.comment ? `; ${x.comment}` : ''}`]))
  table(machineRows)
  heading('5. Massor från arbetsplatsen')
  table(d.massOutNeeded ? d.massesOut.map((x, i) => [`${i + 1}. ${titled(x.type, x.customType)}`, `${x.quantity} ${x.unit}; ${x.loads} lass; förorening: ${x.contamination}; mottagning: ${x.destination || 'ej angiven'}${x.comment ? `; ${x.comment}` : ''}`]) : [['Borttransport', 'Nej']])
  heading('6. Material och massor till arbetsplatsen')
  table(d.materialInNeeded ? d.materialsIn.map((x, i) => [`${i + 1}. ${titled(x.type, x.customType)}`, `${x.quantity} ${x.unit}; ${x.deliveries} leveranser; ${x.deliveryMethod}; placering: ${x.placement || 'ej angiven'}${x.comment ? `; ${x.comment}` : ''}`]) : [['Material till arbetsplatsen', 'Nej']])
  heading('7. Övrigt material')
  table(d.otherMaterialNeeded ? d.otherMaterials.map((x, i) => [`${i + 1}. ${titled(x.material, x.customMaterial)}`, `${x.quantity} ${x.unit}; ${x.specification || 'ingen specifikation'}${x.comment ? `; ${x.comment}` : ''}`]) : [['Övrigt material', 'Nej']])
  heading('8. Syftet med arbetet'); paragraph(d.purpose)
  heading('9. Planerat genomförande')
  table(d.workMoments.length ? d.workMoments.map((x, i) => [`${i + 1}`, x.description]) : [['-', 'Inga arbetsmoment angivna']], ['Ordning', 'Arbetsmoment'])
  if (d.executionOverview) { heading('Övergripande beskrivning', 2); paragraph(d.executionOverview) }
  heading('10. Förutsättningar på arbetsplatsen')
  table(conditions.map(([key, label]) => [label, `${d.conditions[key].answer}${d.conditions[key].comment ? ` – ${d.conditions[key].comment}` : ''}`]))
  heading('11. Övrig viktig information'); paragraph(d.additionalInfo || 'Ej aktuellt')
  heading('12. Bilder')
  if (!d.images.length) paragraph('Inga bilder bifogade.')
  for (let i = 0; i < d.images.length; i++) {
    ensure(95)
    const img = d.images[i]
    try {
      const props = doc.getImageProperties(img.dataUrl)
      const maxW = 180, maxH = 78, ratio = Math.min(maxW / props.width, maxH / props.height)
      const w = props.width * ratio, h = props.height * ratio
      doc.addImage(img.dataUrl, 'JPEG', margin, y, w, h, undefined, 'FAST'); y += h + 4
      paragraph(`Bild ${i + 1}: ${img.caption || img.name}`)
    } catch { paragraph(`Bild ${i + 1} kunde inte infogas: ${img.caption || img.name}`) }
  }
  heading('STRUKTURERAD SAMMANSTÄLLNING FÖR OFFERTGENERERING')
  paragraph('Samtliga uppgifter presenteras nedan i ett konsekvent och lättläst format. Avsnittet kan användas som underlag när kundofferten skapas.')
  heading('Grunddata och tidsåtgång', 2)
  table([
    ['Kund', text(d.customerName)], ['Adress', text(d.address)],
    ['Arbetstyper', d.workTypes.map(x => x === 'Annat' ? d.otherWorkType : x).join(', ')],
    ['Beräknade arbetsdagar', text(d.totalDays)], ['Bedömningens säkerhet', text(d.certainty)],
    ['Osäkerheter', d.uncertainty || 'Inga angivna'],
  ])
  heading('Personal', 2)
  dataTable(['Period', 'Antal personer', 'Antal dagar'], d.personnel.map((x, i) => [String(i + 1), String(x.people), String(x.days)]))
  heading('Grävmaskiner', 2)
  dataTable(['Maskin', 'Storlek', 'Dagar', 'Egen/hyrd', 'Transport'], d.needsExcavator ? d.excavators.map((x, i) => [`Grävmaskin ${i + 1}`, titled(x.size, x.customSize, 'Annan storlek'), String(x.days), x.ownership, `Till: ${yn(x.transportTo)}, från: ${yn(x.transportFrom)}${x.comment ? `. ${x.comment}` : ''}`]) : [])
  heading('Dumper och hjullastare', 2)
  dataTable(['Typ', 'Storlek/modell', 'Dagar', 'Egen/hyrd', 'Transport'], d.machines.map(x => [x.type, x.size, String(x.days), x.ownership, `Till: ${yn(x.transportTo)}, från: ${yn(x.transportFrom)}${x.comment ? `. ${x.comment}` : ''}`]))
  heading('Paddor och övrig utrustning', 2)
  const equipmentSummary: string[][] = []
  if (d.smallCompactor) equipmentSummary.push(['Liten padda', '-', String(d.smallCompactorDays), d.smallCompactorOwnership, d.smallCompactorComment])
  if (d.largeCompactor) equipmentSummary.push(['Stor padda', '-', String(d.largeCompactorDays), d.largeCompactorOwnership, d.largeCompactorComment])
  d.equipment.forEach(x => equipmentSummary.push([titled(x.type, x.customType), x.size || '-', String(x.days), x.ownership, `Antal: ${x.quantity}. Transport: ${yn(x.transport)}${x.comment ? `. ${x.comment}` : ''}`]))
  dataTable(['Utrustning', 'Storlek/modell', 'Dagar', 'Egen/hyrd', 'Kommentar'], equipmentSummary)
  heading('Massor från arbetsplatsen', 2)
  dataTable(['Typ', 'Mängd', 'Enhet', 'Lass', 'Förorening och mottagning'], d.massesOut.map(x => [titled(x.type, x.customType), String(x.quantity), x.unit, String(x.loads), `Förorening: ${x.contamination}. Mottagning: ${x.destination || 'ej angiven'}${x.comment ? `. ${x.comment}` : ''}`]))
  heading('Material till arbetsplatsen', 2)
  dataTable(['Material', 'Mängd', 'Enhet', 'Leveranser', 'Leverans och placering'], d.materialsIn.map(x => [titled(x.type, x.customType), String(x.quantity), x.unit, String(x.deliveries), `${x.deliveryMethod}. ${x.placement || 'Placering ej angiven'}${x.comment ? `. ${x.comment}` : ''}`]))
  heading('Övrigt material', 2)
  dataTable(['Material', 'Mängd', 'Enhet', 'Specifikation', 'Kommentar'], d.otherMaterials.map(x => [titled(x.material, x.customMaterial), String(x.quantity), x.unit, x.specification || '-', x.comment || '-']))
  heading('Arbetsmoment', 2)
  dataTable(['Ordning', 'Beskrivning'], d.workMoments.map((x, i) => [String(i + 1), x.description]))
  heading('Förutsättningar och osäkerheter', 2)
  dataTable(['Förutsättning', 'Svar', 'Kommentar'], conditions.map(([key, label]) => [label, d.conditions[key].answer, d.conditions[key].comment || '-']))
  heading('Syfte och övrig information', 2)
  table([['Färdigt resultat', d.purpose], ['Övergripande genomförande', d.executionOverview || 'Ej angivet'], ['Övrig viktig information', d.additionalInfo || 'Ej angivet'], ['Bilder', d.images.length ? d.images.map((x, i) => `Bild ${i + 1}: ${x.caption || x.name}`).join('; ') : 'Inga bilder']])

  const pageCount = doc.getNumberOfPages()
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p); doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(100)
    doc.text(`Skapad ${new Date().toLocaleString('sv-SE')}`, margin, 291)
    doc.text(`Sida ${p} av ${pageCount}`, 195, 291, { align: 'right' })
  }
  const slug = safeFileName(d.address)
  return { doc, filename: `offertunderlag-${slug}-${new Date().toISOString().slice(0, 10)}.pdf` }
}

export async function generatePdf(d: FormData) {
  const { doc, filename } = createPdfDocument(d)
  doc.save(filename)
}
