import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { NumberInput } from './components'

describe('NumberInput', () => {
  it('markerar hela det förvalda värdet vid tryck', () => {
    render(<NumberInput min={1} value={1} onChange={() => undefined} />)
    const input = screen.getByRole('spinbutton') as HTMLInputElement
    fireEvent.click(input)
    expect(input.selectionStart).toBe(0)
    expect(input.selectionEnd).toBe(1)
  })

  it('har synliga knappar som ökar och minskar värdet', () => {
    const onChange = vi.fn()
    const { rerender } = render(<NumberInput min={1} value={1} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Öka värdet' }))
    expect(onChange).toHaveBeenLastCalledWith(2)

    rerender(<NumberInput min={1} value={2} onChange={onChange} />)
    fireEvent.click(screen.getByRole('button', { name: 'Minska värdet' }))
    expect(onChange).toHaveBeenLastCalledWith(1)
  })

  it('låter ett nytt tal ersätta det markerade värdet', () => {
    const onChange = vi.fn()
    render(<NumberInput min={1} value={1} onChange={onChange} />)
    const input = screen.getByRole('spinbutton')
    fireEvent.click(input)
    fireEvent.change(input, { target: { value: '3' } })
    expect(onChange).toHaveBeenCalledWith(3)
  })
})
