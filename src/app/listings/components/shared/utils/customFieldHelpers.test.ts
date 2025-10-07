import { describe, expect, it } from 'vitest'
import { isCustomFieldValueEmpty } from './customFieldHelpers'

describe('isCustomFieldValueEmpty', () => {
  it('treats nullish values as empty', () => {
    expect(isCustomFieldValueEmpty(null)).toBe(true)
    expect(isCustomFieldValueEmpty(undefined)).toBe(true)
  })

  it('considers numeric zero as a filled value', () => {
    expect(isCustomFieldValueEmpty(0)).toBe(false)
  })

  it('considers booleans as filled values', () => {
    expect(isCustomFieldValueEmpty(false)).toBe(false)
    expect(isCustomFieldValueEmpty(true)).toBe(false)
  })

  it('treats whitespace-only strings as empty', () => {
    expect(isCustomFieldValueEmpty('   ')).toBe(true)
  })

  it('treats populated arrays and objects as filled', () => {
    expect(isCustomFieldValueEmpty(['value'])).toBe(false)
    expect(isCustomFieldValueEmpty({ key: 'value' })).toBe(false)
  })
})
