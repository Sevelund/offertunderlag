import type { HTMLAttributes, ReactNode } from 'react'

export const Field = ({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: ReactNode }) => <label className="field"><span className="label">{label}{required && <b className="required"> *</b>}</span>{hint && <small>{hint}</small>}{children}</label>
export const YesNo = ({ value, onChange, unknown = false }: { value: boolean | string; onChange: (v: boolean | string) => void; unknown?: boolean }) => <div className="segmented">{[...(['Ja', 'Nej'] as const), ...(unknown ? ['Okänt'] : [])].map(x => <button type="button" key={x} className={(typeof value === 'boolean' ? (value ? 'Ja' : 'Nej') : value) === x ? 'active' : ''} onClick={() => onChange(typeof value === 'boolean' ? x === 'Ja' : x)}>{x}</button>)}</div>
export const Section = ({ title, intro, children }: { title: string; intro?: string; children: ReactNode }) => <section className="step-card"><h2>{title}</h2>{intro && <p className="intro">{intro}</p>}{children}</section>
export const RepeaterCard = ({ title, onRemove, children }: { title: string; onRemove: () => void; children: ReactNode }) => <div className="repeater"><div className="repeater-head"><h3>{title}</h3><button type="button" className="danger-link" onClick={onRemove}>Ta bort</button></div>{children}</div>

interface NumberInputProps {
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  step?: number
  inputMode?: HTMLAttributes<HTMLInputElement>['inputMode']
}

export const NumberInput = ({ value, onChange, min = 0, max, step = 1, inputMode = 'numeric' }: NumberInputProps) => {
  const update = (next: number) => {
    const bounded = Math.max(min, max === undefined ? next : Math.min(max, next))
    const decimals = String(step).split('.')[1]?.length || 0
    onChange(Number(bounded.toFixed(decimals)))
  }
  const selectValue = (element: HTMLInputElement) => element.select()

  return <div className="number-control">
    <input
      type="text"
      role="spinbutton"
      aria-valuemin={min}
      aria-valuemax={max}
      aria-valuenow={value}
      pattern={step % 1 ? '[0-9]*[.,]?[0-9]*' : '[0-9]*'}
      inputMode={inputMode}
      value={value}
      onFocus={event => selectValue(event.currentTarget)}
      onClick={event => selectValue(event.currentTarget)}
      onKeyDown={event => {
        if (event.key === 'ArrowUp') { event.preventDefault(); update(value + step) }
        if (event.key === 'ArrowDown') { event.preventDefault(); update(value - step) }
      }}
      onChange={event => onChange(Number(event.target.value.replace(',', '.')) || 0)}
    />
    <span className="number-arrows" aria-hidden="false">
      <button type="button" aria-label="Öka värdet" onClick={() => update(value + step)}>▲</button>
      <button type="button" aria-label="Minska värdet" onClick={() => update(value - step)}>▼</button>
    </span>
  </div>
}
