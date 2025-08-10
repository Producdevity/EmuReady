#!/usr/bin/env node

/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs')
const path = require('path')

const packageJsonPath = path.join(__dirname, '..', 'package.json')
const serviceWorkerPath = path.join(__dirname, '..', 'public', 'service-worker.js')

const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
const version = packageJson.version

const serviceWorkerContent = fs.readFileSync(serviceWorkerPath, 'utf8')

const versionRegex = /const CACHE_NAME = 'emuready_v([\d.]+)'/
const match = serviceWorkerContent.match(versionRegex)

if (match && match[1] === version) {
  console.log(`✓ service-worker.js already has version v${version}`)
  process.exit(0)
}

const updatedContent = serviceWorkerContent.replace(
  versionRegex,
  `const CACHE_NAME = 'emuready_v${version}'`,
)

fs.writeFileSync(serviceWorkerPath, updatedContent)

console.log(`✅ Updated service-worker.js cache version to v${version}`)
