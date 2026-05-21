#!/usr/bin/env node

import { readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const packageJsonPath = path.join(__dirname, '..', 'package.json')
const serviceWorkerPath = path.join(__dirname, '..', 'public', 'service-worker.js')
const swRegisterPath = path.join(__dirname, '..', 'public', 'sw-register.js')

const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
const version = packageJson.version

// Simple regex pattern that matches the format: const CACHE_NAME = 'emuready_vX.X.X'
const versionRegex = /const CACHE_NAME = 'emuready_v([\d.]+)'/

// Update service-worker.js
const serviceWorkerContent = readFileSync(serviceWorkerPath, 'utf8')
const swMatch = serviceWorkerContent.match(versionRegex)

let swUpdated = false
if (!swMatch || swMatch[1] !== version) {
  const updatedSwContent = serviceWorkerContent.replace(
    versionRegex,
    `const CACHE_NAME = 'emuready_v${version}'`,
  )
  writeFileSync(serviceWorkerPath, updatedSwContent)
  swUpdated = true
}

// Update sw-register.js (now uses the same format at the top of the file)
const swRegisterContent = readFileSync(swRegisterPath, 'utf8')
const registerMatch = swRegisterContent.match(versionRegex)

let registerUpdated = false
if (!registerMatch || registerMatch[1] !== version) {
  const updatedRegisterContent = swRegisterContent.replace(
    versionRegex,
    `const CACHE_NAME = 'emuready_v${version}'`,
  )
  writeFileSync(swRegisterPath, updatedRegisterContent)
  registerUpdated = true
}

// Report results
if (swUpdated && registerUpdated) {
  console.log(`✅ Updated both service-worker.js and sw-register.js to v${version}`)
} else if (swUpdated) {
  console.log(`✅ Updated service-worker.js to v${version}`)
} else if (registerUpdated) {
  console.log(`✅ Updated sw-register.js to v${version}`)
} else {
  console.log(`✓ Both files already have version v${version}`)
}
