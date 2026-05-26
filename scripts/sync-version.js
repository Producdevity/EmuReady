#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageJsonPath = path.join(__dirname, '..', 'package.json')
const versionTargets = [
  {
    label: 'sw.js',
    path: path.join(__dirname, '..', 'public', 'sw.js'),
  },
]

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
const version = packageJson.version

const versionRegex = /const CACHE_NAME = 'emuready_v([^']+)'/

const updatedTargets = []

for (const target of versionTargets) {
  const content = readFileSync(target.path, 'utf8')
  const match = content.match(versionRegex)

  if (!match) {
    throw new Error(`Could not find CACHE_NAME matching ${versionRegex} in ${target.path}`)
  }

  if (match[1] !== version) {
    const updatedContent = content.replace(
      versionRegex,
      `const CACHE_NAME = 'emuready_v${version}'`,
    )
    writeFileSync(target.path, updatedContent)
    updatedTargets.push(target.label)
  }
}

if (updatedTargets.length > 0) {
  console.log(`Updated ${updatedTargets.join(', ')} to v${version}`)
} else {
  console.log(`Service worker cache names already use v${version}`)
}
