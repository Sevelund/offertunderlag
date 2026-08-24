import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import type { FormData, ProjectImage } from './types'
import { conditions, deliveryMethods, equipmentTypes, excavatorSizes, massTypes, materialTypes, otherMaterialTypes, units, workTypes } from './constants'
import { blankEquipment, blankExcavator, blankMachine, blankMassOut, blankMaterialIn, blankOtherMaterial, createInitialData, id } from './defaults'
import { canAdvance, getStepErrors, isComplete } from './validation'
import { compressImage } from './image'
import { generatePdf } from './pdf'
import { Field, RepeaterCard, Section, YesNo } from './components'
import { ACTIVE_STORAGE_KEY, archiveIdFromUrl, archiveKey, deleteArchivedForm, listArchivedForms, loadArchivedForm, saveArchivedForm, type SavedArchive } from './archive'
import { SITE_AUTH_KEY, SITE_PASSWORD_HASH, sessionIsUnlocked, unlockSession, verifyPassword } from './auth'
import { calculateTransport, materialDensities } from './weight'

const stepNames = ['Grunduppgifter', 'Omfattning', 'Grävmaskin', 'Dumper och hjullastare', 'Padda och utrustning', 'Material till platsen', 'Massor från platsen', 'Övrigt material', 'Syfte', 'Genomförande', 'Förutsättningar', 'Övrig information', 'Bilder', 'Sammanställning']
const num = (value: string) => Number(value) || 0

function loadData(): FormData {
  const initial = createInitialData()
  try {
    const archived = archiveIdFromUrl() ? loadArchivedForm(archiveIdFromUrl()) : null
    const saved = archived ? JSON.stringify(archived) : localStorage.getItem(ACTIVE_STORAGE_KEY)
    if (!saved) return initial
    const parsed = JSON.parse(saved) as Partial<FormData>
    const materialsIn = (parsed.materialsIn || initial.materialsIn).map(item => ({
      ...item,
      deliveryMethod: item.deliveryMethod === 'Tippas löst' ? 'Massorna tippas' : item.deliveryMethod === 'Annat sätt' ? 'Annat' : item.deliveryMethod,
    }))
    return { ...initial, ...parsed, materialsIn, conditions: { ...initial.conditions, ...(parsed.conditions || {}) } }
  } catch { return initial }
}

export default function App() {
  const [siteUnlocked, setSiteUnlocked] = useState(() => sessionIsUnlocked(SITE_AUTH_KEY))
  const [data, setData] = useState<FormData>(loadData)
  const [step, setStep] = useState(1)
  const [archiveId, setArchiveId] = useState(archiveIdFromUrl)
  const [lastSaved, setLastSaved] = useState<SavedArchive | null>(null)
  const [savedForms, setSavedForms] = useState(listArchivedForms)
  const [showArchives, setShowArchives] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showStepErrors, setShowStepErrors] = useState(false)
  const [storageError, setStorageError] = useState('')
  const [pdfError, setPdfError] = useState('')
  const [working, setWorking] = useState(false)
  const errors = useMemo(() => getStepErrors(data), [data])
  const set = <K extends keyof FormData>(key: K, value: FormData[K]) => setData(d => ({ ...d, [key]: value }))
  const patchItem = (key: keyof FormData, index: number, patch: Record<string, unknown>) => setData(d => ({ ...d, [key]: (d[key] as unknown[]).map((x, i) => i === index ? { ...(x as object), ...patch } : x) }))
  const removeItem = (key: keyof FormData, index: number) => setData(d => ({ ...d, [key]: (d[key] as unknown[]).filter((_, i) => i !== index) }))
  const addItem = (key: keyof FormData, item: unknown) => setData(d => ({ ...d, [key]: [...(d[key] as unknown[]), item] }))

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try { localStorage.setItem(archiveId ? archiveKey(archiveId) : ACTIVE_STORAGE_KEY, JSON.stringify(data)); setStorageError('') }
      catch { setStorageError('Formuläret är för stort för lokal lagring. Ta bort någon bild innan du stänger sidan.') }
    }, 250)
    return () => window.clearTimeout(timer)
  }, [data, archiveId])

  const go = (next: number) => { setShowStepErrors(false); setStep(Math.max(1, Math.min(stepNames.length, next))); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const nextStep = () => {
    if (!canAdvance(data, step)) { setShowStepErrors(true); window.scrollTo({ top: 0, behavior: 'smooth' }); return }
    go(step + 1)
  }
  const toggleWorkType = (value: string) => set('workTypes', data.workTypes.includes(value) ? data.workTypes.filter(x => x !== value) : [...data.workTypes, value])
  const startNew = () => {
    if (!confirm('Vill du starta ett nytt formulär? Uppgifterna i det pågående formuläret rensas. Sparade formulär påverkas inte.')) return
    if (!archiveId) localStorage.removeItem(ACTIVE_STORAGE_KEY)
    history.replaceState({}, '', `${location.origin}${location.pathname}`)
    setArchiveId(''); setLastSaved(null); setSavedForms(listArchivedForms()); setData(createInitialData()); setStep(1)
  }
  const addImages = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])
    if (!files.length) return
    setWorking(true); setPdfError('')
    try {
      const images: ProjectImage[] = []
      for (const file of files) images.push({ id: id(), dataUrl: await compressImage(file), caption: '', name: file.name })
      set('images', [...data.images, ...images])
    } catch (e) { setPdfError(e instanceof Error ? e.message : 'Bilderna kunde inte läggas till.') }
    finally { setWorking(false); event.target.value = '' }
  }
  const makePdf = async () => {
    if (!isComplete(data)) return
    setWorking(true); setPdfError('')
    try {
      await generatePdf(data)
      let saved: SavedArchive
      if (archiveId) {
        localStorage.setItem(archiveKey(archiveId), JSON.stringify(data))
        const url = new URL(location.href); url.search = ''; url.hash = ''; url.searchParams.set('underlag', archiveId)
        saved = { id: archiveId, url: url.toString() }
      } else {
        const activeBackup = localStorage.getItem(ACTIVE_STORAGE_KEY)
        localStorage.removeItem(ACTIVE_STORAGE_KEY)
        try { saved = saveArchivedForm(data) }
        catch (error) { if (activeBackup) localStorage.setItem(ACTIVE_STORAGE_KEY, activeBackup); throw error }
      }
      history.replaceState({}, '', `${location.origin}${location.pathname}`)
      setArchiveId(''); setLastSaved(saved); setSavedForms(listArchivedForms()); setCopied(false); setData(createInitialData()); setStep(1); setShowStepErrors(false)
    } catch { setPdfError('PDF-filen eller den sparade kopian kunde inte skapas. Prova igen eller ta bort någon stor bild.') }
    finally { setWorking(false) }
  }
  const copySavedUrl = async () => {
    if (!lastSaved) return
    try { await navigator.clipboard.writeText(lastSaved.url); setCopied(true) }
    catch { setPdfError('Webbadressen kunde inte kopieras automatiskt. Öppna länken och kopiera adressen från webbläsaren.') }
  }
  const removeSavedForm = (id: string) => {
    if (!confirm('Vill du radera det sparade formuläret? Detta går inte att ångra.')) return
    deleteArchivedForm(id)
    setSavedForms(listArchivedForms())
    if (lastSaved?.id === id) setLastSaved(null)
  }

  const unlockSite = async (password: string) => {
    if (!await verifyPassword(password, SITE_PASSWORD_HASH)) return false
    unlockSession(SITE_AUTH_KEY); setSiteUnlocked(true); return true
  }
  const openArchives = () => {
    setSavedForms(listArchivedForms()); setShowArchives(true)
  }

  if (!siteUnlocked) return <PasswordGate title="Offertunderlag" description="Ange lösenordet för att öppna sidan." onUnlock={unlockSite} />

  const ownership = (value: string, onChange: (v: string) => void) => <select value={value} onChange={e => onChange(e.target.value)}><option>Egen</option><option>Hyrd</option></select>
  const summaryRows = [
    ['Kund', data.customerName], ['Arbetsplats', data.address],
    ['Arbetstyp', data.workTypes.map(x => x === 'Annat' ? data.otherWorkType : x).join(', ')],
    ['Tid', `${data.totalDays} dagar`], ['Personalperioder', data.personnel.map(x => `${x.people} personer × ${x.days} dagar`).join('; ')],
    ['Grävmaskin', data.needsExcavator ? `${data.excavators.length} st` : 'Nej'], ['Dumper/hjullastare', data.loaderChoice],
    ['Material till platsen', data.materialInNeeded ? `${data.materialsIn.length} rader` : 'Nej'], ['Massor bort', data.massOutNeeded ? `${data.massesOut.length} rader` : 'Nej'],
    ['Arbetsmoment', `${data.workMoments.length} st`], ['Bilder', `${data.images.length} st`],
  ]

  return <>
    <header className="topbar"><div className="brand"><span className="mark">S</span><div><strong>Sevelund AB</strong><small>Offertunderlag</small></div></div><div className="top-actions"><button type="button" className="ghost" onClick={startNew}>Nytt formulär</button><button type="button" className="ghost" onClick={openArchives}>Sparade formulär{savedForms.length ? ` (${savedForms.length})` : ''}</button><button type="button" className="ghost" onClick={() => go(14)}>Gå till sammanställning</button></div></header>
    {showArchives && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setShowArchives(false) }}><section className="archive-modal" role="dialog" aria-modal="true" aria-labelledby="archive-title"><div className="archive-head"><div><h2 id="archive-title">Sparade formulär</h2><p>Formulären finns endast i den här webbläsaren på den här enheten.</p></div><button type="button" aria-label="Stäng" onClick={() => setShowArchives(false)}>×</button></div>{savedForms.length ? <div className="archive-list">{savedForms.map(form => <article className="archive-row" key={form.id}><div><b>{form.address || 'Adress saknas'}</b><span>{form.customerName || 'Kundnamn saknas'} · Bedömning {form.assessmentDate || 'datum saknas'}</span><small>Sparad {form.savedDate || 'okänt datum'}{form.imageCount ? ` · ${form.imageCount} bilder` : ''}</small></div><div className="archive-actions"><a href={form.url}>Öppna</a><button type="button" onClick={() => removeSavedForm(form.id)}>Radera</button></div></article>)}</div> : <div className="archive-empty"><b>Det finns inga sparade formulär.</b><span>En kopia skapas automatiskt när du genererar en PDF.</span></div>}</section></div>}
    <div className="progress-wrap"><div className="progress-meta"><span>Steg {step} av {stepNames.length}</span><b>{stepNames[step - 1]}</b><span>{Math.round(step / stepNames.length * 100)} %</span></div><div className="progress"><span style={{ width: `${step / stepNames.length * 100}%` }} /></div></div>
    <main>
      {archiveId && <div className="alert info">Du arbetar i en sparad kopia. Ändringar sparas automatiskt till kopians webbadress.</div>}
      {lastSaved && <div className="saved-copy"><div><b>PDF-filen är skapad och formuläret har rensats.</b><span>En lokal kopia finns kvar och kan öppnas igen på den här enheten.</span></div><div className="saved-actions"><a href={lastSaved.url}>Öppna sparad kopia</a><button type="button" onClick={copySavedUrl}>{copied ? 'Webbadressen är kopierad' : 'Kopiera webbadress'}</button></div></div>}
      {storageError && <div className="alert error">{storageError}</div>}
      {pdfError && <div className="alert error">{pdfError}</div>}

      {step === 1 && <Section title="Grunduppgifter" intro="Uppgifter om kunden, platsen och bedömningen.">
        <div className="grid two"><Field label="Kundens namn"><input value={data.customerName} onChange={e => set('customerName', e.target.value)} /></Field><Field label="Arbetsplatsens adress" required><input value={data.address} onChange={e => set('address', e.target.value)} /></Field><Field label="Datum för bedömningen" required><input type="date" value={data.assessmentDate} onChange={e => set('assessmentDate', e.target.value)} /></Field></div>
        <Field label="Vem har gjort bedömningen?" required><div className="choice-grid">{['Adam', 'Karl', 'Annan'].map(x => <button type="button" key={x} className={data.assessor === x ? 'choice active' : 'choice'} onClick={() => set('assessor', x)}>{x}</button>)}</div></Field>
        {data.assessor === 'Annan' && <Field label="Namn på bedömare" required><input value={data.otherAssessor} onChange={e => set('otherAssessor', e.target.value)} /></Field>}
        <Field label="Vilken typ av arbete gäller det?" required hint="Flera val är möjliga."><div className="checkbox-grid">{workTypes.map(x => <label className={data.workTypes.includes(x) ? 'check active' : 'check'} key={x}><input type="checkbox" checked={data.workTypes.includes(x)} onChange={() => toggleWorkType(x)} />{x}</label>)}</div></Field>
        {data.workTypes.includes('Annat') && <Field label="Beskriv annat arbete" required><input value={data.otherWorkType} onChange={e => set('otherWorkType', e.target.value)} /></Field>}
      </Section>}

      {step === 2 && <Section title="Arbetets omfattning" intro="Ange beräknad tid och hur personalbehovet fördelas.">
        <Field label="Hur många arbetsdagar beräknas arbetet ta?" required hint="Ange antal hela dagar."><input type="number" min="1" step="1" inputMode="numeric" value={data.totalDays} onChange={e => set('totalDays', num(e.target.value))} /></Field>
        <h3>Personalperioder</h3>{data.personnel.map((x, i) => <RepeaterCard key={x.id} title={`Period ${i + 1}`} onRemove={() => removeItem('personnel', i)}><div className="grid two"><Field label="Antal personer"><input type="number" min="1" step="1" value={x.people} onChange={e => patchItem('personnel', i, { people: num(e.target.value) })} /></Field><Field label="Antal dagar"><input type="number" min="1" step="1" inputMode="numeric" value={x.days} onChange={e => patchItem('personnel', i, { days: num(e.target.value) })} /></Field></div></RepeaterCard>)}
        <button type="button" className="add" onClick={() => addItem('personnel', { id: id(), people: 1, days: 1 })}>+ Lägg till personalperiod</button>
        <Field label="Hur säker är tidsuppskattningen?" required><select value={data.certainty} onChange={e => set('certainty', e.target.value)}><option value="">Välj</option><option>Relativt säker</option><option>Något osäker</option><option>Mycket osäker</option></select></Field>
        {data.certainty && data.certainty !== 'Relativt säker' && <Field label="Vad beror osäkerheten på?" required><textarea value={data.uncertainty} onChange={e => set('uncertainty', e.target.value)} /></Field>}
      </Section>}

      {step === 3 && <Section title="Grävmaskin"><Field label="Behövs grävmaskin?"><YesNo value={data.needsExcavator} onChange={v => { const yes = Boolean(v); setData(d => ({ ...d, needsExcavator: yes, excavators: yes && !d.excavators.length ? [blankExcavator()] : d.excavators })) }} /></Field>
        {data.needsExcavator && <>{data.excavators.map((x, i) => <RepeaterCard key={x.id} title={`Grävmaskin ${i + 1}`} onRemove={() => removeItem('excavators', i)}><div className="grid two"><Field label="Storlek" required><select value={x.size} onChange={e => patchItem('excavators', i, { size: e.target.value })}><option value="">Välj</option>{excavatorSizes.map(v => <option key={v}>{v}</option>)}</select></Field>{x.size === 'Annan storlek' && <Field label="Ange storlek" required><input value={x.customSize} onChange={e => patchItem('excavators', i, { customSize: e.target.value })} /></Field>}<Field label="Antal dagar"><input type="number" min="1" step="1" inputMode="numeric" value={x.days} onChange={e => patchItem('excavators', i, { days: num(e.target.value) })} /></Field><Field label="Egen eller hyrd">{ownership(x.ownership, v => patchItem('excavators', i, { ownership: v }))}</Field><Field label="Transport till arbetsplatsen"><YesNo value={x.transportTo} onChange={v => patchItem('excavators', i, { transportTo: v })} /></Field><Field label="Transport från arbetsplatsen"><YesNo value={x.transportFrom} onChange={v => patchItem('excavators', i, { transportFrom: v })} /></Field></div><Field label="Kommentar"><textarea value={x.comment} onChange={e => patchItem('excavators', i, { comment: e.target.value })} /></Field></RepeaterCard>)}<button type="button" className="add" onClick={() => addItem('excavators', blankExcavator())}>+ Lägg till grävmaskin</button></>}
      </Section>}

      {step === 4 && <Section title="Dumper och hjullastare"><Field label="Behövs dumper eller hjullastare?"><select value={data.loaderChoice} onChange={e => { const choice = e.target.value; let machines = data.machines; if (choice !== 'Nej' && !machines.length) machines = choice === 'Både dumper och hjullastare' ? [blankMachine('Dumper'), blankMachine('Hjullastare')] : [blankMachine(choice)]; setData(d => ({ ...d, loaderChoice: choice, machines })) }}><option>Nej</option><option>Dumper</option><option>Hjullastare</option><option>Både dumper och hjullastare</option></select></Field>
        {data.loaderChoice !== 'Nej' && <>{data.machines.map((x, i) => <RepeaterCard key={x.id} title={`Maskin ${i + 1}`} onRemove={() => removeItem('machines', i)}><div className="grid two"><Field label="Typ"><select value={x.type} onChange={e => patchItem('machines', i, { type: e.target.value })}><option value="">Välj</option><option>Dumper</option><option>Hjullastare</option></select></Field><Field label="Storlek eller modell" required><input value={x.size} onChange={e => patchItem('machines', i, { size: e.target.value })} /></Field><Field label="Antal dagar"><input type="number" min="1" step="1" inputMode="numeric" value={x.days} onChange={e => patchItem('machines', i, { days: num(e.target.value) })} /></Field><Field label="Egen eller hyrd">{ownership(x.ownership, v => patchItem('machines', i, { ownership: v }))}</Field><Field label="Transport till"><YesNo value={x.transportTo} onChange={v => patchItem('machines', i, { transportTo: v })} /></Field><Field label="Transport från"><YesNo value={x.transportFrom} onChange={v => patchItem('machines', i, { transportFrom: v })} /></Field></div><Field label="Kommentar"><textarea value={x.comment} onChange={e => patchItem('machines', i, { comment: e.target.value })} /></Field></RepeaterCard>)}<button type="button" className="add" onClick={() => addItem('machines', blankMachine())}>+ Lägg till maskin</button></>}
      </Section>}

      {step === 5 && <Section title="Padda och övrig utrustning">
        <Compactor title="Liten padda" active={data.smallCompactor} setActive={v => set('smallCompactor', v)} days={data.smallCompactorDays} setDays={v => set('smallCompactorDays', v)} ownershipValue={data.smallCompactorOwnership} setOwnership={v => set('smallCompactorOwnership', v)} comment={data.smallCompactorComment} setComment={v => set('smallCompactorComment', v)} />
        <Compactor title="Stor padda" active={data.largeCompactor} setActive={v => set('largeCompactor', v)} days={data.largeCompactorDays} setDays={v => set('largeCompactorDays', v)} ownershipValue={data.largeCompactorOwnership} setOwnership={v => set('largeCompactorOwnership', v)} comment={data.largeCompactorComment} setComment={v => set('largeCompactorComment', v)} />
        <Field label="Behövs någon annan maskin eller utrustning?"><YesNo value={data.needsEquipment} onChange={v => { const yes = Boolean(v); setData(d => ({ ...d, needsEquipment: yes, equipment: yes && !d.equipment.length ? [blankEquipment()] : d.equipment })) }} /></Field>
        {data.needsEquipment && <>{data.equipment.map((x, i) => <RepeaterCard key={x.id} title={`Utrustning ${i + 1}`} onRemove={() => removeItem('equipment', i)}><div className="grid two"><Field label="Typ"><select value={x.type} onChange={e => patchItem('equipment', i, { type: e.target.value })}><option value="">Välj</option>{equipmentTypes.map(v => <option key={v}>{v}</option>)}</select></Field>{x.type === 'Annat' && <Field label="Beskriv utrustningen"><input value={x.customType} onChange={e => patchItem('equipment', i, { customType: e.target.value })} /></Field>}<Field label="Storlek eller modell"><input value={x.size} onChange={e => patchItem('equipment', i, { size: e.target.value })} /></Field><Field label="Antal"><input type="number" min="1" value={x.quantity} onChange={e => patchItem('equipment', i, { quantity: num(e.target.value) })} /></Field><Field label="Antal dagar"><input type="number" min="1" step="1" inputMode="numeric" value={x.days} onChange={e => patchItem('equipment', i, { days: num(e.target.value) })} /></Field><Field label="Egen eller hyrd">{ownership(x.ownership, v => patchItem('equipment', i, { ownership: v }))}</Field><Field label="Behövs transport?"><YesNo value={x.transport} onChange={v => patchItem('equipment', i, { transport: v })} /></Field></div><Field label="Kommentar"><textarea value={x.comment} onChange={e => patchItem('equipment', i, { comment: e.target.value })} /></Field></RepeaterCard>)}<button type="button" className="add" onClick={() => addItem('equipment', blankEquipment())}>+ Lägg till utrustning</button></>}
      </Section>}

      {step === 6 && <Section title="Material och massor till arbetsplatsen"><WeightCalculator /><Field label="Ska material eller massor transporteras till arbetsplatsen?"><YesNo value={data.materialInNeeded} onChange={v => { const yes = Boolean(v); setData(d => ({ ...d, materialInNeeded: yes, materialsIn: yes && !d.materialsIn.length ? [blankMaterialIn()] : d.materialsIn })) }} /></Field>{data.materialInNeeded && <>{data.materialsIn.map((x, i) => <RepeaterCard key={x.id} title={`Material ${i + 1}`} onRemove={() => removeItem('materialsIn', i)}><div className="grid two"><Field label="Materialtyp"><select value={x.type} onChange={e => patchItem('materialsIn', i, { type: e.target.value })}><option value="">Välj</option>{materialTypes.map(v => <option key={v}>{v}</option>)}</select></Field>{x.type === 'Annat' && <Field label="Beskriv materialet"><input value={x.customType} onChange={e => patchItem('materialsIn', i, { customType: e.target.value })} /></Field>}<Field label="Mängd"><input type="number" min="0" step="0.1" value={x.quantity} onChange={e => patchItem('materialsIn', i, { quantity: num(e.target.value) })} /></Field><Field label="Enhet"><select value={x.unit} onChange={e => patchItem('materialsIn', i, { unit: e.target.value })}>{units.map(v => <option key={v}>{v}</option>)}</select></Field><Field label="Antal lass eller leveranser"><input type="number" min="0" step="1" value={x.deliveries} onChange={e => patchItem('materialsIn', i, { deliveries: num(e.target.value) })} /></Field><Field label="Leveranssätt"><select value={x.deliveryMethod} onChange={e => patchItem('materialsIn', i, { deliveryMethod: e.target.value })}>{deliveryMethods.map(v => <option key={v}>{v}</option>)}</select></Field><Field label="Önskad placering"><input value={x.placement} onChange={e => patchItem('materialsIn', i, { placement: e.target.value })} /></Field></div><Field label="Kommentar"><textarea value={x.comment} onChange={e => patchItem('materialsIn', i, { comment: e.target.value })} /></Field></RepeaterCard>)}<button type="button" className="add" onClick={() => addItem('materialsIn', blankMaterialIn())}>+ Lägg till material</button></>}
      </Section>}

      {step === 7 && <Section title="Massor från arbetsplatsen"><Field label="Ska massor transporteras bort från arbetsplatsen?"><YesNo value={data.massOutNeeded} onChange={v => { const yes = Boolean(v); setData(d => ({ ...d, massOutNeeded: yes, massesOut: yes && !d.massesOut.length ? [blankMassOut()] : d.massesOut })) }} /></Field>{data.massOutNeeded && <>{data.massesOut.map((x, i) => <RepeaterCard key={x.id} title={`Massor ${i + 1}`} onRemove={() => removeItem('massesOut', i)}><div className="grid two"><Field label="Typ av massor"><select value={x.type} onChange={e => patchItem('massesOut', i, { type: e.target.value })}><option value="">Välj</option>{massTypes.map(v => <option key={v}>{v}</option>)}</select></Field>{x.type === 'Annat' && <Field label="Beskriv massorna"><input value={x.customType} onChange={e => patchItem('massesOut', i, { customType: e.target.value })} /></Field>}<Field label="Uppskattad mängd"><input type="number" min="0" step="0.1" value={x.quantity} onChange={e => patchItem('massesOut', i, { quantity: num(e.target.value) })} /></Field><Field label="Enhet"><select value={x.unit} onChange={e => patchItem('massesOut', i, { unit: e.target.value })}>{units.map(v => <option key={v}>{v}</option>)}</select></Field><Field label="Uppskattat antal lass"><input type="number" min="0" step="1" value={x.loads} onChange={e => patchItem('massesOut', i, { loads: num(e.target.value) })} /></Field><Field label="Känd eller misstänkt förorening"><select value={x.contamination} onChange={e => patchItem('massesOut', i, { contamination: e.target.value })}><option>Nej</option><option>Ja</option><option>Okänt</option></select></Field><Field label="Känd mottagningsplats"><input value={x.destination} onChange={e => patchItem('massesOut', i, { destination: e.target.value })} /></Field></div><Field label="Kommentar"><textarea value={x.comment} onChange={e => patchItem('massesOut', i, { comment: e.target.value })} /></Field></RepeaterCard>)}<button type="button" className="add" onClick={() => addItem('massesOut', blankMassOut())}>+ Lägg till massor</button></>}
      </Section>}

      {step === 8 && <Section title="Övrigt material"><Field label="Behövs något annat material för arbetet?"><YesNo value={data.otherMaterialNeeded} onChange={v => { const yes = Boolean(v); setData(d => ({ ...d, otherMaterialNeeded: yes, otherMaterials: yes && !d.otherMaterials.length ? [blankOtherMaterial()] : d.otherMaterials })) }} /></Field>{data.otherMaterialNeeded && <>{data.otherMaterials.map((x, i) => <RepeaterCard key={x.id} title={`Material ${i + 1}`} onRemove={() => removeItem('otherMaterials', i)}><div className="grid two"><Field label="Material"><select value={x.material} onChange={e => patchItem('otherMaterials', i, { material: e.target.value })}><option value="">Välj</option>{otherMaterialTypes.map(v => <option key={v}>{v}</option>)}</select></Field>{x.material === 'Annat' && <Field label="Beskriv materialet"><input value={x.customMaterial} onChange={e => patchItem('otherMaterials', i, { customMaterial: e.target.value })} /></Field>}<Field label="Mängd"><input type="number" min="0" step="0.1" value={x.quantity} onChange={e => patchItem('otherMaterials', i, { quantity: num(e.target.value) })} /></Field><Field label="Enhet"><select value={x.unit} onChange={e => patchItem('otherMaterials', i, { unit: e.target.value })}>{units.map(v => <option key={v}>{v}</option>)}</select></Field><Field label="Dimension eller specifikation"><input value={x.specification} onChange={e => patchItem('otherMaterials', i, { specification: e.target.value })} /></Field></div><Field label="Kommentar"><textarea value={x.comment} onChange={e => patchItem('otherMaterials', i, { comment: e.target.value })} /></Field></RepeaterCard>)}<button type="button" className="add" onClick={() => addItem('otherMaterials', blankOtherMaterial())}>+ Lägg till material</button></>}
      </Section>}

      {step === 9 && <Section title="Syftet med arbetet"><Field label="Vad är syftet med arbetet och vilket färdigt resultat ska uppnås?" required hint="Beskriv det färdiga resultatet. Exempel: Finplanering av cirka 300 m² inför anläggning av gräsmatta."><textarea className="large" value={data.purpose} onChange={e => set('purpose', e.target.value)} /></Field></Section>}

      {step === 10 && <Section title="Genomförande" intro="Arbetsmoment är frivilliga. Lägg till dem i den ordning som arbetet ska utföras om du vill ha med dem i underlaget.">{data.workMoments.map((x, i) => <RepeaterCard key={x.id} title={`Arbetsmoment ${i + 1}`} onRemove={() => removeItem('workMoments', i)}><Field label="Beskriv arbetsmomentet"><textarea value={x.description} onChange={e => patchItem('workMoments', i, { description: e.target.value })} /></Field><div className="move"><button type="button" disabled={i === 0} onClick={() => set('workMoments', move(data.workMoments, i, i - 1))}>↑ Flytta upp</button><button type="button" disabled={i === data.workMoments.length - 1} onClick={() => set('workMoments', move(data.workMoments, i, i + 1))}>↓ Flytta ned</button></div></RepeaterCard>)}<button type="button" className="add" onClick={() => addItem('workMoments', { id: id(), description: '' })}>+ Lägg till arbetsmoment</button><Field label="Övergripande beskrivning (frivillig)"><textarea className="large" value={data.executionOverview} onChange={e => set('executionOverview', e.target.value)} /></Field></Section>}

      {step === 11 && <Section title="Förutsättningar på arbetsplatsen" intro="Besvara samtliga frågor. Kommentar visas vid Ja eller Okänt."><div className="conditions">{conditions.map(([key, label]) => { const condition = data.conditions[key]; return <div className="condition" key={key}><Field label={label} required><YesNo unknown value={condition.answer} onChange={v => setData(d => ({ ...d, conditions: { ...d.conditions, [key]: { ...condition, answer: String(v) as typeof condition.answer } } }))} /></Field>{condition.answer && condition.answer !== 'Nej' && <Field label="Kommentar"><textarea value={condition.comment} onChange={e => setData(d => ({ ...d, conditions: { ...d.conditions, [key]: { ...condition, comment: e.target.value } } }))} /></Field>}</div>})}</div></Section>}

      {step === 12 && <Section title="Övrig viktig information"><Field label="Finns det någon annan information som är viktig för arbetets genomförande?" hint="Exempel: Vi behöver hyra in en 3,5 tons grävmaskin under en dag. Transportvägen är smal och måste mätas innan arbetet påbörjas."><textarea className="large" value={data.additionalInfo} onChange={e => set('additionalInfo', e.target.value)} /></Field></Section>}

      {step === 13 && <Section title="Bilder" intro="Bilderna komprimeras och behandlas endast lokalt i webbläsaren."><label className="upload"><input type="file" accept="image/*" multiple onChange={addImages} disabled={working} /><span>{working ? 'Bearbetar bilder…' : '+ Lägg till bilder'}</span></label><div className="image-grid">{data.images.map((x, i) => <div className="image-card" key={x.id}><img src={x.dataUrl} alt={x.caption || x.name} /><Field label={`Bildtext ${i + 1}`}><input value={x.caption} onChange={e => patchItem('images', i, { caption: e.target.value })} /></Field><div className="move"><button type="button" disabled={i === 0} onClick={() => set('images', move(data.images, i, i - 1))}>←</button><button type="button" disabled={i === data.images.length - 1} onClick={() => set('images', move(data.images, i, i + 1))}>→</button><button type="button" className="danger-link" onClick={() => removeItem('images', i)}>Ta bort</button></div></div>)}</div></Section>}

      {step === 14 && <Section title="Sammanställning" intro="Kontrollera uppgifterna innan PDF-filen skapas."><div className="summary">{summaryRows.map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</div>{Object.keys(errors).length > 0 ? <div className="missing"><h3>Obligatoriska uppgifter saknas</h3>{Object.entries(errors).map(([s, list]) => <button type="button" key={s} onClick={() => go(Number(s))}><b>Steg {s}: {stepNames[Number(s) - 1]}</b><span>{list.join('. ')}</span></button>)}</div> : <div className="alert success">Alla obligatoriska uppgifter är ifyllda.</div>}<button type="button" className="pdf" disabled={!isComplete(data) || working} onClick={makePdf}>{working ? 'Skapar PDF…' : 'Generera PDF'}</button><p className="privacy">PDF-filen skapas lokalt på enheten. Inga formulärsvar eller bilder skickas till någon extern tjänst.</p></Section>}

      {showStepErrors && errors[step]?.length > 0 && step < 14 && <div className="step-errors"><b>Fyll i följande innan du går vidare:</b><ul>{errors[step].map(x => <li key={x}>{x}</li>)}</ul></div>}
      <nav className="nav"><button type="button" className="secondary" disabled={step === 1} onClick={() => go(step - 1)}>← Föregående</button>{step < stepNames.length && <button type="button" className="primary" onClick={nextStep}>Nästa →</button>}</nav>
    </main>
    <footer>Sevelund AB · Uppgifterna sparas endast i denna webbläsare</footer>
  </>
}

function PasswordGate({ title, description, onUnlock }: { title: string; description: string; onUnlock: (password: string) => Promise<boolean> }) {
  return <div className="password-page"><PasswordCard title={title} description={description} onUnlock={onUnlock} /></div>
}

function PasswordCard({ title, description, onUnlock, onClose }: { title: string; description: string; onUnlock: (password: string) => Promise<boolean>; onClose?: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [working, setWorking] = useState(false)
  const submit = async (event: FormEvent) => {
    event.preventDefault(); setWorking(true); setError('')
    const accepted = await onUnlock(password)
    if (!accepted) { setError('Fel lösenord. Försök igen.'); setPassword('') }
    setWorking(false)
  }
  return <section className="password-card" role={onClose ? 'dialog' : undefined} aria-modal={onClose ? 'true' : undefined} aria-labelledby="password-title">
    {onClose && <button type="button" className="password-close" aria-label="Stäng" onClick={onClose}>×</button>}
    <div className="password-brand"><span className="mark">S</span><strong>Sevelund AB</strong></div>
    <h1 id="password-title">{title}</h1><p>{description}</p>
    <form onSubmit={submit}><label htmlFor="password">Lösenord</label><input id="password" type="password" autoComplete="current-password" autoFocus value={password} onChange={e => setPassword(e.target.value)} />
      {error && <div className="password-error" role="alert">{error}</div>}
      <button type="submit" disabled={!password || working}>{working ? 'Kontrollerar…' : 'Öppna'}</button>
    </form>
  </section>
}

function Compactor({ title, active, setActive, days, setDays, ownershipValue, setOwnership, comment, setComment }: { title: string; active: boolean; setActive: (v: boolean) => void; days: number; setDays: (v: number) => void; ownershipValue: string; setOwnership: (v: string) => void; comment: string; setComment: (v: string) => void }) {
  return <div className="equipment-block"><Field label={`Behövs ${title.toLowerCase()}?`}><YesNo value={active} onChange={v => setActive(Boolean(v))} /></Field>{active && <div className="grid two"><Field label="Antal dagar"><input type="number" min="1" step="1" inputMode="numeric" value={days} onChange={e => setDays(num(e.target.value))} /></Field><Field label="Egen eller hyrd"><select value={ownershipValue} onChange={e => setOwnership(e.target.value)}><option>Egen</option><option>Hyrd</option></select></Field><Field label="Kommentar"><textarea value={comment} onChange={e => setComment(e.target.value)} /></Field></div>}</div>
}

function WeightCalculator() {
  const [open, setOpen] = useState(false)
  const [material, setMaterial] = useState(materialDensities[0].name as string)
  const [volume, setVolume] = useState(10)
  const [density, setDensity] = useState(materialDensities[0].density as number)
  const [minLoad, setMinLoad] = useState(10)
  const [maxLoad, setMaxLoad] = useState(12)
  const result = calculateTransport(volume, density, minLoad, maxLoad)
  const number = (value: number) => value.toLocaleString('sv-SE', { maximumFractionDigits: 2 })
  const loads = result.minLoads === result.maxLoads ? `${result.minLoads} lass` : `${result.minLoads}–${result.maxLoads} lass`
  const selectMaterial = (name: string) => {
    setMaterial(name)
    const selected = materialDensities.find(x => x.name === name)
    if (selected) setDensity(selected.density)
  }
  return <>
    <button type="button" className="weight-trigger" onClick={() => setOpen(true)}><span aria-hidden="true">⚖</span><span><b>Viktgenerator</b><small>Räkna ut ton och antal lastbilslass</small></span></button>
    {open && <div className="modal-backdrop" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) setOpen(false) }}><section className="weight-modal" role="dialog" aria-modal="true" aria-labelledby="weight-title"><button type="button" className="weight-close" aria-label="Stäng" onClick={() => setOpen(false)}>×</button><h2 id="weight-title">Vikt- och lassgenerator</h2><p className="weight-intro">Räkna om volym till ungefärlig vikt och antal lastbilslass. Generatorn kan användas för material både till och från arbetsplatsen.</p>
      <div className="grid two"><Field label="Material"><select value={material} onChange={e => selectMaterial(e.target.value)}>{materialDensities.map(x => <option key={x.name}>{x.name}</option>)}</select></Field><Field label="Volym (m³)"><input type="number" min="0" step="0.1" inputMode="decimal" value={volume} onChange={e => setVolume(num(e.target.value))} /></Field><Field label="Densitet (ton/m³)" hint="Ungefärligt värde som kan ändras."><input type="number" min="0.1" step="0.1" inputMode="decimal" value={density} onChange={e => setDensity(num(e.target.value))} /></Field></div>
      <h3>Lastbilens kapacitet</h3><div className="grid two"><Field label="Minst ton per lass"><input type="number" min="1" step="0.5" inputMode="decimal" value={minLoad} onChange={e => setMinLoad(num(e.target.value))} /></Field><Field label="Högst ton per lass"><input type="number" min="1" step="0.5" inputMode="decimal" value={maxLoad} onChange={e => setMaxLoad(num(e.target.value))} /></Field></div>
      <div className="weight-result"><span>Ungefärlig totalvikt</span><strong>{number(result.weight)} ton</strong><span>Beräknat transportbehov</span><strong>{result.weight ? loads : '0 lass'}</strong></div>
      <p className="weight-note">Beräkningen är vägledande. Verklig vikt påverkas bland annat av materialets fukthalt, sammansättning och packningsgrad.</p><button type="button" className="weight-done" onClick={() => setOpen(false)}>Klar</button>
    </section></div>}
  </>
}

function move<T>(items: T[], from: number, to: number) { const copy = [...items]; const [item] = copy.splice(from, 1); copy.splice(to, 0, item); return copy }
