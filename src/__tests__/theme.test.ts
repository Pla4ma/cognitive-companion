// ══════════════════════════════════════════════════════════════
// INTENT — Theme Color Validation Tests
// Ensures no oklch() values remain (React Native crash fix)
// Validates all color values are hex or rgba
// ══════════════════════════════════════════════════════════════

import { colors } from '../theme'

// ── Helpers ─────────────────────────────────────────────────

/** Recursively extract all string values from a nested object */
function extractAllStrings(obj: any, path = ''): { value: string; path: string }[] {
  const results: { value: string; path: string }[] = []
  if (typeof obj === 'string') {
    results.push({ value: obj, path })
  } else if (Array.isArray(obj)) {
    obj.forEach((item, i) => {
      results.push(...extractAllStrings(item, `${path}[${i}]`))
    })
  } else if (obj && typeof obj === 'object') {
    for (const key of Object.keys(obj)) {
      results.push(...extractAllStrings(obj[key], path ? `${path}.${key}` : key))
    }
  }
  return results
}

/** Valid hex color pattern: #RGB, #RRGGBB, or #RRGGBBAA */
const HEX_PATTERN = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/

/** Valid rgba() pattern */
const RGBA_PATTERN = /^rgba\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*(0|1|0?\.\d+)\s*\)$/

/** Check if a color string is a valid hex or rgba value */
function isValidColor(value: string): boolean {
  return HEX_PATTERN.test(value) || RGBA_PATTERN.test(value)
}

// ── Tests ───────────────────────────────────────────────────

describe('Theme Color Safety (OKLCH guard)', () => {
  const allColors = extractAllStrings(colors)

  test('no color value contains oklch(', () => {
    const oklchColors = allColors.filter(({ value }) => value.includes('oklch('))
    expect(oklchColors).toEqual([])
    // Also verify at least some colors exist
    expect(allColors.length).toBeGreaterThan(50)
  })

  test('no color value contains hsl(', () => {
    const hslColors = allColors.filter(({ value }) => value.includes('hsl('))
    expect(hslColors).toEqual([])
  })

  test('no color value contains lab(', () => {
    const labColors = allColors.filter(({ value }) => value.includes('lab('))
    expect(labColors).toEqual([])
  })

  test('all color values match valid hex or rgba pattern', () => {
    const invalidColors = allColors.filter(({ value }) => !isValidColor(value))
    expect(invalidColors).toEqual([])
  })

  test('all hex colors are properly formatted', () => {
    const hexColors = allColors.filter(({ value }) => value.startsWith('#'))
    hexColors.forEach(({ value, path }) => {
      expect(value).toMatch(HEX_PATTERN)
    })
    expect(hexColors.length).toBeGreaterThan(0)
  })

  test('all rgba colors have valid alpha values', () => {
    const rgbaColors = allColors.filter(({ value }) => value.startsWith('rgba'))
    rgbaColors.forEach(({ value, path }) => {
      expect(value).toMatch(RGBA_PATTERN)
    })
    expect(rgbaColors.length).toBeGreaterThan(0)
  })

  test('gradient color arrays contain valid colors', () => {
    const gradientKeys = Object.keys(colors.gradients)
    gradientKeys.forEach(key => {
      const gradient = colors.gradients[key as keyof typeof colors.gradients]
      gradient.forEach(color => {
        expect(isValidColor(color)).toBe(true)
      })
    })
  })

  test('specific critical colors are hex (not oklch)', () => {
    // These are the ones that were specifically converted from oklch
    expect(colors.text.secondary).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(colors.text.tertiary).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(colors.text.disabled).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(colors.brand[400]).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(colors.successBg).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(colors.warningBg).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(colors.errorBg).toMatch(/^#[0-9a-fA-F]{6}$/)
    expect(colors.infoBg).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  test('border colors are valid', () => {
    expect(isValidColor(colors.border.subtle)).toBe(true)
    expect(isValidColor(colors.border.default)).toBe(true)
    expect(isValidColor(colors.border.strong)).toBe(true)
    expect(isValidColor(colors.border.focus)).toBe(true)
  })

  test('glass effect colors are valid rgba', () => {
    expect(isValidColor(glass.light.backgroundColor)).toBe(true)
    expect(isValidColor(glass.light.border)).toBe(true)
    expect(isValidColor(glass.medium.backgroundColor)).toBe(true)
    expect(isValidColor(glass.strong.backgroundColor)).toBe(true)
  })
})

// Import glass here to avoid issues with extractAllStrings
import { glass } from '../theme'
