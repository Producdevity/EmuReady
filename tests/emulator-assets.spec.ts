import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { test, expect } from './fixtures'

test('emulator WebP assets also serve stored PNG paths', async ({ request }) => {
  const directory = join(process.cwd(), 'public/assets/emulators')
  const files = readdirSync(directory).filter((file) => file.endsWith('.webp'))
  expect(files.length).toBeGreaterThan(0)

  for (const file of files) {
    await test.step(file, async () => {
      const expected = readFileSync(join(directory, file))
      for (const name of [file, file.replace(/\.webp$/, '.png')]) {
        const response = await request.get(`/assets/emulators/${name}`, { maxRedirects: 0 })
        expect(response.status()).toBe(200)
        expect(response.headers()['content-type']).toContain('image/webp')
        expect(await response.body()).toEqual(expected)
      }
    })
  }
})
