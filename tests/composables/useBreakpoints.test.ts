import { describe, it, expect } from 'vitest'
import { defineComponent } from 'vue'
import { mount } from '@vue/test-utils'

// useBreakpoints utilise onMounted pour lire window.innerWidth.
// On doit monter un vrai composant pour que le lifecycle hook s'exécute.

const { useBreakpoints } = await import('~/composables/useBreakpoints')

function withWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: width })
  let result: ReturnType<typeof useBreakpoints>
  const Comp = defineComponent({
    setup() {
      result = useBreakpoints()
      return () => null
    },
  })
  mount(Comp)
  return result!
}

// ═════════════════════════════════════════════════════════════════════════════
// isMobile / isTablet / isDesktop
// ═════════════════════════════════════════════════════════════════════════════

describe('useBreakpoints — isMobile / isTablet / isDesktop', () => {
  it('isMobile est true en dessous de 768px', () => {
    const { isMobile } = withWidth(375)
    expect(isMobile.value).toBe(true)
  })

  it('isMobile est false à 768px', () => {
    const { isMobile } = withWidth(768)
    expect(isMobile.value).toBe(false)
  })

  it('isTablet est true entre 768px et 1023px', () => {
    const { isTablet } = withWidth(900)
    expect(isTablet.value).toBe(true)
  })

  it('isTablet est false à 1024px', () => {
    const { isTablet } = withWidth(1024)
    expect(isTablet.value).toBe(false)
  })

  it('isDesktop est true à partir de 1024px', () => {
    const { isDesktop } = withWidth(1024)
    expect(isDesktop.value).toBe(true)
  })

  it('isLargeDesktop est true à partir de 1280px', () => {
    const { isLargeDesktop } = withWidth(1280)
    expect(isLargeDesktop.value).toBe(true)
  })

  it('isXLargeDesktop est true à partir de 1536px', () => {
    const { isXLargeDesktop } = withWidth(1536)
    expect(isXLargeDesktop.value).toBe(true)
  })
})

// ═════════════════════════════════════════════════════════════════════════════
// breakpoint nommé
// ═════════════════════════════════════════════════════════════════════════════

describe('useBreakpoints — breakpoint nommé', () => {
  const cases: [number, string][] = [
    [320,  'xs'],
    [639,  'xs'],
    [640,  'sm'],
    [767,  'sm'],
    [768,  'md'],
    [1023, 'md'],
    [1024, 'lg'],
    [1279, 'lg'],
    [1280, 'xl'],
    [1535, 'xl'],
    [1536, '2xl'],
    [1920, '2xl'],
  ]

  for (const [width, expected] of cases) {
    it(`retourne "${expected}" pour ${width}px`, () => {
      const { breakpoint } = withWidth(width)
      expect(breakpoint.value).toBe(expected)
    })
  }
})

// ═════════════════════════════════════════════════════════════════════════════
// isSmallerThan / isGreaterThan / isBetween
// ═════════════════════════════════════════════════════════════════════════════

describe('useBreakpoints — helpers dynamiques', () => {
  it('isSmallerThan(1000) est true pour 999px', () => {
    expect(withWidth(999).isSmallerThan(1000).value).toBe(true)
  })

  it('isSmallerThan(1000) est false pour 1000px', () => {
    expect(withWidth(1000).isSmallerThan(1000).value).toBe(false)
  })

  it('isGreaterThan(768) est true pour 769px', () => {
    expect(withWidth(769).isGreaterThan(768).value).toBe(true)
  })

  it('isBetween(768, 1024) est true pour 900px', () => {
    expect(withWidth(900).isBetween(768, 1024).value).toBe(true)
  })

  it('isBetween(768, 1024) est false pour 1024px (borne exclue)', () => {
    expect(withWidth(1024).isBetween(768, 1024).value).toBe(false)
  })
})
