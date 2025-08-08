import { describe, it, expect } from 'vitest'
import { cn } from './utils'

describe('cn utility function', () => {
  it('should merge simple class names', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2')
  })

  it('should handle undefined and null values', () => {
    expect(cn('class1', undefined, 'class2', null)).toBe('class1 class2')
  })

  it('should handle empty strings', () => {
    expect(cn('class1', '', 'class2')).toBe('class1 class2')
  })

  it('should handle conditional classes', () => {
    const conditional = true
    const hidden = false
    expect(cn('base', conditional && 'conditional', hidden && 'hidden')).toBe('base conditional')
  })

  it('should merge Tailwind classes and resolve conflicts', () => {
    // twMerge should handle conflicting Tailwind classes
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4')
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500')
  })

  it('should handle arrays of classes', () => {
    expect(cn(['class1', 'class2'], 'class3')).toBe('class1 class2 class3')
  })

  it('should handle objects with conditional classes', () => {
    expect(
      cn({
        'base-class': true,
        'conditional-class': true,
        'hidden-class': false,
      }),
    ).toBe('base-class conditional-class')
  })

  it('should handle complex combinations', () => {
    const result = cn(
      'base-class',
      {
        'conditional-true': true,
        'conditional-false': false,
      },
      ['array-class1', 'array-class2'],
      undefined,
      'final-class',
    )
    expect(result).toBe('base-class conditional-true array-class1 array-class2 final-class')
  })

  it('should handle Tailwind responsive classes', () => {
    expect(cn('w-full', 'md:w-1/2', 'lg:w-1/3')).toBe('w-full md:w-1/2 lg:w-1/3')
  })

  it('should handle Tailwind state variants', () => {
    expect(cn('bg-blue-500', 'hover:bg-blue-600', 'focus:bg-blue-700')).toBe(
      'bg-blue-500 hover:bg-blue-600 focus:bg-blue-700',
    )
  })

  it('should resolve conflicting margin/padding classes', () => {
    expect(cn('m-2', 'm-4')).toBe('m-4')
    // twMerge keeps all padding classes when they don't conflict
    expect(cn('p-2', 'px-4', 'py-2')).toBe('p-2 px-4 py-2')
  })

  it('should handle empty input', () => {
    expect(cn()).toBe('')
  })

  it('should handle only falsy values', () => {
    expect(cn(false, null, undefined, '')).toBe('')
  })

  it('should preserve non-Tailwind classes', () => {
    expect(cn('custom-class', 'another-custom', 'text-red-500')).toBe(
      'custom-class another-custom text-red-500',
    )
  })

  it('should handle duplicate classes', () => {
    // clsx preserves order and doesn't deduplicate non-conflicting classes
    expect(cn('class1', 'class2', 'class1')).toBe('class1 class2 class1')
  })

  it('should work with component variants pattern', () => {
    const buttonVariants = {
      primary: 'bg-blue-500 text-white',
      secondary: 'bg-gray-500 text-white',
      size: {
        sm: 'px-2 py-1 text-sm',
        md: 'px-4 py-2',
        lg: 'px-6 py-3 text-lg',
      },
    }

    expect(
      cn('base-button', buttonVariants.primary, buttonVariants.size.md, 'hover:opacity-90'),
    ).toBe('base-button bg-blue-500 text-white px-4 py-2 hover:opacity-90')
  })
})
