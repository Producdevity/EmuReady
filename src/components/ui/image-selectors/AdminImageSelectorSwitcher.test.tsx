import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AdminImageSelectorSwitcher } from './AdminImageSelectorSwitcher'

vi.mock('./providers/IGDBImageSelector', () => ({ IGDBImageSelector: () => null }))
vi.mock('./providers/RawgImageSelector', () => ({ RawgImageSelector: () => null }))
vi.mock('./providers/TGDBImageSelector', () => ({ TGDBImageSelector: () => null }))

describe('AdminImageSelectorSwitcher manual URL', () => {
  it('resumes external synchronization after applying whitespace as an empty URL', () => {
    const onImageSelect = vi.fn()
    const view = render(
      <AdminImageSelectorSwitcher
        selectedImageUrl="https://example.com/original.jpg"
        onImageSelect={onImageSelect}
      />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(onImageSelect).toHaveBeenCalledWith('')
    view.rerender(<AdminImageSelectorSwitcher selectedImageUrl="" onImageSelect={onImageSelect} />)
    view.rerender(
      <AdminImageSelectorSwitcher
        selectedImageUrl="https://example.com/next.jpg"
        onImageSelect={onImageSelect}
      />,
    )
    expect(screen.getByRole('textbox')).toHaveValue('https://example.com/next.jpg')
  })

  it('preserves an in-progress draft when the selected image changes', () => {
    const onImageSelect = vi.fn()
    const view = render(
      <AdminImageSelectorSwitcher
        selectedImageUrl="https://example.com/original.jpg"
        onImageSelect={onImageSelect}
      />,
    )
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'https://example.com/draft.jpg' },
    })

    view.rerender(
      <AdminImageSelectorSwitcher
        selectedImageUrl="https://example.com/refreshed.jpg"
        onImageSelect={onImageSelect}
      />,
    )

    expect(screen.getByRole('textbox')).toHaveValue('https://example.com/draft.jpg')
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(onImageSelect).toHaveBeenCalledWith('https://example.com/draft.jpg')
  })

  it('accepts external changes when the input has not been edited', () => {
    const onImageSelect = vi.fn()
    const view = render(<AdminImageSelectorSwitcher onImageSelect={onImageSelect} />)

    view.rerender(
      <AdminImageSelectorSwitcher
        selectedImageUrl="https://example.com/selected.jpg"
        onImageSelect={onImageSelect}
      />,
    )

    expect(screen.getByRole('textbox')).toHaveValue('https://example.com/selected.jpg')
    expect(screen.getByRole('button', { name: 'Apply' })).toBeEnabled()
  })

  it('keeps validation tied to an invalid draft during an external update', () => {
    const view = render(<AdminImageSelectorSwitcher onImageSelect={vi.fn()} />)
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'http://example.com/draft.jpg' },
    })

    view.rerender(
      <AdminImageSelectorSwitcher
        selectedImageUrl="https://example.com/selected.jpg"
        onImageSelect={vi.fn()}
      />,
    )

    expect(screen.getByRole('textbox')).toHaveValue('http://example.com/draft.jpg')
    expect(screen.getByText('Image URL must use HTTPS.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled()
  })

  it('resumes synchronization after the parent accepts the applied URL', () => {
    const onImageSelect = vi.fn()
    const view = render(<AdminImageSelectorSwitcher onImageSelect={onImageSelect} />)
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: '  https://example.com/applied.jpg  ' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
    expect(onImageSelect).toHaveBeenCalledWith('https://example.com/applied.jpg')
    expect(screen.getByRole('textbox')).toHaveValue('https://example.com/applied.jpg')

    view.rerender(
      <AdminImageSelectorSwitcher
        selectedImageUrl="https://example.com/applied.jpg"
        onImageSelect={onImageSelect}
      />,
    )
    view.rerender(
      <AdminImageSelectorSwitcher
        selectedImageUrl="https://example.com/next.jpg"
        onImageSelect={onImageSelect}
      />,
    )

    expect(screen.getByRole('textbox')).toHaveValue('https://example.com/next.jpg')
  })
})
