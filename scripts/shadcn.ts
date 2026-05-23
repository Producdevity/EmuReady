import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const COMPONENT_NAME_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function pascalCase(str: string): string {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

function addComponent(componentName: string): void {
  try {
    console.log(`💾 Adding component: ${componentName}`)
    const result = spawnSync('pnpm', ['dlx', 'shadcn@latest', 'add', componentName], {
      stdio: 'inherit',
    })

    if (result.error) {
      throw result.error
    }

    if (result.status !== 0) {
      const failureReason = result.signal
        ? `signal ${result.signal}`
        : `status ${result.status ?? 'unknown'}`

      throw new Error(`shadcn failed with ${failureReason}`)
    }

    const uiDir = path.join(process.cwd(), 'src', 'components', 'ui')
    const oldPath = path.join(uiDir, `${componentName}.tsx`)
    const newPath = path.join(uiDir, `${pascalCase(componentName)}.tsx`)

    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath)
      console.log(`📄 Renamed ${componentName}.tsx to ${pascalCase(componentName)}.tsx`)
    } else {
      console.warn(`⚠️ Warning: ${componentName}.tsx not found in components/ui directory`)
    }
  } catch (error) {
    console.error('❌ Error adding component:', error)
    process.exitCode = 1
  }
}

const componentName = process.argv[2]

if (!componentName) {
  console.error('❌ Please provide a component name')
  process.exit(1)
}

if (!COMPONENT_NAME_PATTERN.test(componentName)) {
  console.error('❌ Component name must use lowercase letters, numbers, and hyphens')
  process.exit(1)
}

addComponent(componentName)
