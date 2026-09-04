const STYLE_ID = 'weight-volume-mode-styles'
const ENHANCED_ATTR = 'data-volume-mode-enhanced'

function ensureStyles() {
  if (document.getElementById(STYLE_ID)) return
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = `
    .volume-mode-switch { margin: 18px 0 14px; }
    .volume-mode-switch > span { display: block; font-weight: 700; margin-bottom: 8px; }
    .volume-mode-buttons { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .volume-mode-buttons button {
      min-height: 44px;
      border: 1px solid #d8d8d8;
      border-radius: 10px;
      background: #fff;
      color: inherit;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      padding: 10px 12px;
    }
    .volume-mode-buttons button.active {
      border-color: #ef6c00;
      background: #fff4ea;
      color: #a94700;
    }
    .dimension-volume-box {
      display: none;
      margin: 0 0 18px;
      padding: 14px;
      border: 1px solid #e7e7e7;
      border-radius: 12px;
      background: #fafafa;
    }
    .dimension-volume-box.active { display: block; }
    .dimension-volume-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 10px;
    }
    .dimension-volume-field { display: flex; flex-direction: column; gap: 6px; }
    .dimension-volume-field span { font-size: .9rem; font-weight: 700; }
    .dimension-volume-field input {
      width: 100%;
      min-height: 44px;
      box-sizing: border-box;
      border: 1px solid #cfcfcf;
      border-radius: 8px;
      background: #fff;
      padding: 10px 11px;
      font: inherit;
    }
    .dimension-volume-result {
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid #e3e3e3;
      display: flex;
      align-items: baseline;
      justify-content: space-between;
      gap: 12px;
    }
    .dimension-volume-result strong { font-size: 1.15rem; }
    .dimension-volume-hint { display: block; margin-top: 6px; color: #666; font-size: .84rem; }
    @media (max-width: 640px) {
      .volume-mode-buttons { grid-template-columns: 1fr; }
      .dimension-volume-grid { grid-template-columns: 1fr; }
    }
  `
  document.head.appendChild(style)
}

function setReactInputValue(input: HTMLInputElement, value: number) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
  setter?.call(input, String(Number(value.toFixed(3))))
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}

function parseDecimal(value: string) {
  const parsed = Number(value.replace(',', '.'))
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function enhanceWeightModal(modal: HTMLElement) {
  if (modal.hasAttribute(ENHANCED_ATTR)) return

  const fields = Array.from(modal.querySelectorAll<HTMLLabelElement>('label.field'))
  const volumeField = fields.find(field => field.querySelector('.label')?.textContent?.trim() === 'Volym (m³)')
  const volumeInput = volumeField?.querySelector<HTMLInputElement>('input')
  const intro = modal.querySelector('.weight-intro')
  const firstGrid = modal.querySelector('.grid.two')

  if (!volumeField || !volumeInput || !intro || !firstGrid) return
  modal.setAttribute(ENHANCED_ATTR, 'true')

  const switchWrap = document.createElement('div')
  switchWrap.className = 'volume-mode-switch'
  switchWrap.innerHTML = `
    <span>Hur vill du ange volymen?</span>
    <div class="volume-mode-buttons">
      <button type="button" class="active" data-volume-mode="direct">Ange volym (m³)</button>
      <button type="button" data-volume-mode="dimensions">Längd × bredd × höjd</button>
    </div>
  `

  const dimensions = document.createElement('div')
  dimensions.className = 'dimension-volume-box'
  dimensions.innerHTML = `
    <div class="dimension-volume-grid">
      <label class="dimension-volume-field"><span>Längd (m)</span><input type="text" inputmode="decimal" placeholder="0" data-dimension="length"></label>
      <label class="dimension-volume-field"><span>Bredd (m)</span><input type="text" inputmode="decimal" placeholder="0" data-dimension="width"></label>
      <label class="dimension-volume-field"><span>Höjd/djup (m)</span><input type="text" inputmode="decimal" placeholder="0" data-dimension="height"></label>
    </div>
    <div class="dimension-volume-result"><span>Beräknad volym</span><strong>0 m³</strong></div>
    <small class="dimension-volume-hint">Volymen räknas automatiskt som längd × bredd × höjd och används sedan för vikt och antal lass.</small>
  `

  intro.insertAdjacentElement('afterend', switchWrap)
  firstGrid.insertAdjacentElement('afterend', dimensions)

  const directButton = switchWrap.querySelector<HTMLButtonElement>('[data-volume-mode="direct"]')!
  const dimensionsButton = switchWrap.querySelector<HTMLButtonElement>('[data-volume-mode="dimensions"]')!
  const dimensionInputs = Array.from(dimensions.querySelectorAll<HTMLInputElement>('input[data-dimension]'))
  const result = dimensions.querySelector<HTMLElement>('.dimension-volume-result strong')!

  const calculateDimensions = () => {
    const [length, width, height] = dimensionInputs.map(input => parseDecimal(input.value))
    const calculatedVolume = length * width * height
    result.textContent = `${calculatedVolume.toLocaleString('sv-SE', { maximumFractionDigits: 3 })} m³`
    setReactInputValue(volumeInput, calculatedVolume)
  }

  const setMode = (mode: 'direct' | 'dimensions') => {
    const isDimensions = mode === 'dimensions'
    directButton.classList.toggle('active', !isDimensions)
    dimensionsButton.classList.toggle('active', isDimensions)
    dimensions.classList.toggle('active', isDimensions)
    volumeField.style.display = isDimensions ? 'none' : ''
    if (isDimensions) {
      calculateDimensions()
      dimensionInputs[0]?.focus()
    } else {
      volumeInput.focus()
      volumeInput.select()
    }
  }

  directButton.addEventListener('click', () => setMode('direct'))
  dimensionsButton.addEventListener('click', () => setMode('dimensions'))
  dimensionInputs.forEach(input => {
    input.addEventListener('focus', () => input.select())
    input.addEventListener('click', () => input.select())
    input.addEventListener('input', calculateDimensions)
  })
}

export function installWeightVolumeModes() {
  ensureStyles()
  const enhanceExisting = () => document.querySelectorAll<HTMLElement>('.weight-modal').forEach(enhanceWeightModal)
  enhanceExisting()
  const observer = new MutationObserver(enhanceExisting)
  observer.observe(document.body, { childList: true, subtree: true })
}
