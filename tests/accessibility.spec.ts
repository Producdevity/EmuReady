import { test, expect } from '@playwright/test'
import { GamesPage } from './pages/GamesPage'
import { HomePage } from './pages/HomePage'
import { ListingsPage } from './pages/ListingsPage'

test.describe('Accessibility Tests', () => {
  test('should have proper heading hierarchy', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBeGreaterThanOrEqual(1)
    expect(h1Count).toBeLessThanOrEqual(1)

    const headingLevels = await page
      .locator('h1, h2, h3, h4, h5, h6')
      .evaluateAll((elements) => elements.map((el) => parseInt(el.tagName.substring(1))))

    for (let i = 1; i < headingLevels.length; i++) {
      expect(headingLevels[i] - headingLevels[i - 1]).toBeLessThanOrEqual(2)
    }
  })

  test('should have proper ARIA labels for interactive elements', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    const buttonData = await page.locator('button').evaluateAll((elements) =>
      elements.slice(0, 5).map((el) => ({
        ariaLabel: el.getAttribute('aria-label'),
        text: el.textContent,
        title: el.getAttribute('title'),
      })),
    )

    for (const btn of buttonData) {
      const name = btn.ariaLabel || btn.text || btn.title
      expect(name).toBeTruthy()
      expect(name!.trim().length).toBeGreaterThan(0)
    }

    const linkData = await page.locator('a').evaluateAll((elements) =>
      elements.slice(0, 5).map((el) => ({
        text: el.textContent,
        ariaLabel: el.getAttribute('aria-label'),
      })),
    )

    for (const link of linkData) {
      const text = link.text || link.ariaLabel
      expect(text?.toLowerCase()).not.toMatch(/^(click here|here|link)$/)
    }
  })

  test('should have alt text for all images', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()
    await listingsPage.verifyPageLoaded()

    const altTexts = await page
      .locator('img')
      .evaluateAll((elements) => elements.map((el) => el.getAttribute('alt')))

    for (const altText of altTexts) {
      expect(altText).toBeDefined()
      if (altText !== '') {
        expect(altText!.length).toBeGreaterThan(3)
      }
    }
  })

  test('should be navigable with keyboard only', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    const tabData = []
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      const [tagName, text] = await page.evaluate(() => {
        const focused = document.activeElement
        return [focused?.tagName.toLowerCase() ?? '', focused?.textContent ?? '']
      })
      tabData.push({ tagName, text })
    }

    const interactiveTags = ['a', 'button', 'input', 'select', 'textarea']
    const hasInteractiveElements = tabData.some((item) => interactiveTags.includes(item.tagName))
    expect(hasInteractiveElements).toBe(true)
  })

  test('should have sufficient color contrast', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    const styles = await page
      .locator('p, span, div, h1, h2, h3, h4, h5, h6')
      .filter({ hasText: /\S+/ })
      .evaluateAll((elements) =>
        elements.slice(0, 10).map((el) => {
          const computed = window.getComputedStyle(el)
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize,
          }
        }),
      )

    for (const s of styles) {
      if (s.backgroundColor === 'rgba(0, 0, 0, 0)' || s.backgroundColor === 'transparent') {
        continue
      }

      if (s.color !== 'rgba(0, 0, 0, 0)' && s.color !== 'transparent') {
        expect(s.color).not.toBe(s.backgroundColor)
      }

      expect(parseInt(s.fontSize)).toBeGreaterThanOrEqual(12)
    }
  })

  test('should have focus indicators', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    const firstLink = page.locator('a').first()
    await firstLink.focus()

    const focusStyles = await firstLink.evaluate((el) => {
      const computed = window.getComputedStyle(el)
      return {
        outline: computed.outline,
        outlineWidth: computed.outlineWidth,
        outlineColor: computed.outlineColor,
        boxShadow: computed.boxShadow,
        border: computed.border,
      }
    })

    const hasFocusIndicator =
      (focusStyles.outline && focusStyles.outline !== 'none') ||
      (focusStyles.outlineWidth && focusStyles.outlineWidth !== '0px') ||
      (focusStyles.boxShadow && focusStyles.boxShadow !== 'none') ||
      (focusStyles.border && !focusStyles.border.includes('none'))

    expect(hasFocusIndicator).toBe(true)
  })

  test('should have proper form labels', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    const inputAccessibility = await page
      .locator('input, select, textarea')
      .evaluateAll((elements) =>
        elements.map((el) => {
          const id = el.getAttribute('id')
          const hasLabel = id ? !!document.querySelector(`label[for="${CSS.escape(id)}"]`) : false
          return {
            hasLabel,
            ariaLabel: el.getAttribute('aria-label'),
            ariaLabelledBy: el.getAttribute('aria-labelledby'),
            placeholder: el.getAttribute('placeholder'),
          }
        }),
      )

    for (const input of inputAccessibility) {
      const hasAccessibleName = input.hasLabel || input.ariaLabel || input.ariaLabelledBy
      expect(hasAccessibleName || !!input.placeholder).toBe(true)
    }
  })

  test('should announce page changes to screen readers', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    await homePage.navigateToGames()

    await page.waitForLoadState('domcontentloaded')
    const title = await page.title()
    expect(title.toLowerCase()).toMatch(/games|emuready/)
  })

  test('should have skip links for keyboard navigation', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    const skipLinkData = await page
      .locator('a')
      .filter({ hasText: /skip to (content|main|navigation)/i })
      .evaluateAll((elements) =>
        elements.map((el) => ({
          href: el.getAttribute('href'),
          text: el.textContent,
        })),
      )

    if (skipLinkData.length > 0) {
      expect(skipLinkData[0].href).toMatch(/^#\w+/)
    } else {
      const hasMainLandmark = await page
        .locator('main, [role="main"]')
        .count()
        .then((c) => c > 0)
      expect(hasMainLandmark).toBe(true)
    }
  })

  test('should have proper language attributes', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    const htmlLang = await page.locator('html').getAttribute('lang')
    expect(htmlLang).toBeTruthy()
    expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/)
  })

  test('should handle focus trap in modals', async () => {
    test.skip(true, 'Focus trap verification depends on Clerk third-party modal behavior')
  })

  test('should have proper table accessibility', async ({ page }) => {
    const listingsPage = new ListingsPage(page)
    await listingsPage.goto()

    const tables = page.locator('table')
    const tableCount = await tables.count()
    expect(tableCount).toBeGreaterThan(0)

    const headerData = await tables
      .first()
      .locator('th')
      .evaluateAll((elements) =>
        elements.map((el) => ({
          scope: el.getAttribute('scope'),
          text: el.textContent,
        })),
      )

    expect(headerData.length).toBeGreaterThan(0)

    if (headerData[0].scope) {
      expect(headerData[0].scope).toMatch(/^(col|row)$/)
    }
  })
})

test.describe('Screen Reader Tests', () => {
  test('should have meaningful page structure', async ({ page }) => {
    const homePage = new HomePage(page)
    await homePage.goto()

    const nav = page.locator('nav, [role="navigation"]')
    const main = page.locator('main, [role="main"]')

    await expect(nav.first()).toBeVisible()
    await expect(main.first()).toBeVisible()
  })

  test('should provide context for icon buttons', async ({ page }) => {
    const gamesPage = new GamesPage(page)
    await gamesPage.goto()

    const buttonData = await page.locator('button').evaluateAll((elements) =>
      elements.slice(0, 10).map((el) => ({
        text: el.textContent?.trim() ?? '',
        ariaLabel: el.getAttribute('aria-label'),
        title: el.getAttribute('title'),
      })),
    )

    for (const btn of buttonData) {
      if (btn.text.length === 0) {
        expect(btn.ariaLabel || btn.title).toBeTruthy()
      }
    }
  })
})
