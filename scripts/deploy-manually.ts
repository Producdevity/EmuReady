#!/usr/bin/env tsx
/**
 * Manual deployment script for Vercel with excellent DX
 * Run: tsx scripts/deploy-manually.ts --target={production|staging|preview|development}
 */

import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import * as readline from 'readline'
import { parseArgs } from 'util'

// ANSI color codes for nice terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
}

// Unicode symbols for better visual feedback
const symbols = {
  success: '✅',
  error: '❌',
  warning: '⚠️',
  info: 'ℹ️',
  arrow: '➜',
  rocket: '🚀',
  package: '📦',
  gear: '⚙️',
  globe: '🌍',
  check: '✓',
  cross: '✗',
  dot: '•',
}

// Type definitions
type Target = 'production' | 'staging' | 'preview' | 'development'

const urlMap: Record<Target, string | null> = {
  production: 'https://www.emuready.com',
  staging: 'https://staging.emuready.com',
  preview: 'https://emuready.vercel.app',
  development: null,
}

const targetColors: Record<Target, string> = {
  production: colors.red,
  staging: colors.yellow,
  preview: colors.blue,
  development: colors.green,
}

// Utility functions
function print(message: string, color: string = colors.white) {
  console.log(`${color}${message}${colors.reset}`)
}

function printHeader(message: string) {
  console.log()
  print(`${symbols.rocket} ${message}`, colors.bright + colors.magenta)
  print('─'.repeat(50), colors.dim)
}

function printSuccess(message: string) {
  print(`${symbols.success} ${message}`, colors.green)
}

function printError(message: string) {
  print(`${symbols.error} ${message}`, colors.red)
}

function printWarning(message: string) {
  print(`${symbols.warning} ${message}`, colors.yellow)
}

function printInfo(message: string) {
  print(`${symbols.info} ${message}`, colors.cyan)
}

function printStep(step: number, total: number, message: string) {
  print(`\n[${step}/${total}] ${message}`, colors.bright + colors.blue)
}

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})

// Promisify question for async/await
function question(prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve)
  })
}

// Interactive select list with arrow navigation
async function selectFromList(prompt: string, options: Target[]): Promise<Target> {
  return new Promise((resolve) => {
    let selectedIndex = 0

    // Hide cursor
    process.stdout.write('\x1B[?25l')

    function render() {
      // Clear previous render
      process.stdout.write('\x1B[2J\x1B[H')

      // Print header
      console.log()
      print(prompt, colors.bright + colors.white)
      console.log()

      // Print options with radio buttons
      options.forEach((option, index) => {
        const color = targetColors[option]
        const isSelected = index === selectedIndex
        const radio = isSelected ? '◉' : '◯'
        const icon = option === 'production' ? symbols.warning : ''
        const prefix = isSelected ? `${colors.cyan}❯` : ' '

        const optionText = isSelected
          ? `${prefix} ${colors.bright}${color}${radio} ${icon} ${option}${colors.reset}`
          : `${prefix} ${colors.dim}${radio} ${icon} ${option}${colors.reset}`

        console.log(optionText)
      })

      console.log()
      print('Use arrow keys to navigate, Enter to select, Ctrl+C to cancel', colors.dim)
    }

    // Initial render
    render()

    // Setup keyboard input
    process.stdin.setRawMode(true)
    process.stdin.resume()
    process.stdin.setEncoding('utf8')

    const keyHandler = (key: string) => {
      // Handle Ctrl+C
      if (key === '\u0003') {
        cleanup()
        console.log()
        printWarning('Selection cancelled')
        process.exit(0)
      }

      // Handle arrow keys
      if (key === '\u001B\u005B\u0041') {
        // Up arrow
        selectedIndex = selectedIndex > 0 ? selectedIndex - 1 : options.length - 1
        render()
      } else if (key === '\u001B\u005B\u0042') {
        // Down arrow
        selectedIndex = selectedIndex < options.length - 1 ? selectedIndex + 1 : 0
        render()
      } else if (key === '\r' || key === '\n') {
        // Enter
        cleanup()
        console.log()
        resolve(options[selectedIndex])
      }

      // Handle number keys for quick selection
      const num = parseInt(key)
      if (!isNaN(num) && num >= 1 && num <= options.length) {
        selectedIndex = num - 1
        render()
        setTimeout(() => {
          cleanup()
          console.log()
          resolve(options[selectedIndex])
        }, 150) // Brief delay to show selection
      }
    }

    const cleanup = () => {
      process.stdin.removeListener('data', keyHandler)
      process.stdin.setRawMode(false)
      process.stdin.pause()
      // Show cursor
      process.stdout.write('\x1B[?25h')
    }

    process.stdin.on('data', keyHandler)
  })
}

// Confirm action with default option
async function confirm(prompt: string, defaultValue: boolean = false): Promise<boolean> {
  const defaultText = defaultValue ? 'Y/n' : 'y/N'
  const answer = await question(`${colors.yellow}${prompt} (${defaultText}): ${colors.reset}`)

  if (answer === '') return defaultValue
  return answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes'
}

// Execute command with spinner simulation
function executeCommand(command: string, description: string): boolean {
  try {
    process.stdout.write(`${colors.cyan}${symbols.gear} ${description}...${colors.reset}`)

    execSync(command, {
      stdio: ['pipe', 'pipe', 'pipe'],
      encoding: 'utf-8',
    })

    // Clear the line and show success
    process.stdout.write('\r\x1b[K')
    printSuccess(description)
    return true
  } catch (error) {
    // Clear the line and show error
    process.stdout.write('\r\x1b[K')
    printError(`${description} failed`)

    if (error instanceof Error) {
      interface ExecError extends Error {
        stderr?: string
        stdout?: string
      }
      const execError = error as ExecError
      const errorOutput = execError.stderr || execError.stdout || execError.message
      console.error(`${colors.dim}${errorOutput}${colors.reset}`)
    }
    return false
  }
}

// Execute command with live output
function executeCommandWithOutput(command: string, description: string): boolean {
  try {
    printInfo(description)
    console.log(`${colors.dim}$ ${command}${colors.reset}`)
    console.log()

    execSync(command, {
      stdio: 'inherit',
      encoding: 'utf-8',
    })

    console.log()
    return true
  } catch {
    printError(`Command failed: ${command}`)
    return false
  }
}

// Main deployment function
async function deploy() {
  printHeader('Vercel Manual Deployment Tool')

  // Parse command line arguments
  let target: Target | undefined

  try {
    const { values } = parseArgs({
      args: process.argv.slice(2),
      options: {
        target: { type: 'string' },
      },
    })

    if (
      values.target &&
      ['production', 'staging', 'preview', 'development'].includes(values.target)
    ) {
      target = values.target as Target
    }
  } catch {
    // Ignore parsing errors, will prompt user
  }

  // Step 1: Select target environment
  printStep(1, 6, 'Select deployment target')

  if (!target) {
    target = await selectFromList('Which environment do you want to deploy to?', [
      'production',
      'staging',
      'preview',
      'development',
    ])
  } else {
    printInfo(`Target environment: ${target}`)
  }

  console.log()
  print(
    `${symbols.arrow} Deploying to ${target.toUpperCase()}`,
    targetColors[target] + colors.bright,
  )

  // Step 2: Check if project is linked
  printStep(2, 6, 'Check Vercel project link')

  const vercelDir = path.join(process.cwd(), '.vercel')
  const projectJsonPath = path.join(vercelDir, 'project.json')

  if (!fs.existsSync(projectJsonPath)) {
    printWarning('Project is not linked to Vercel')

    const shouldLink = await confirm('Do you want to link this project to Vercel?', true)
    if (!shouldLink) {
      printError('Deployment cancelled. Project must be linked to Vercel.')
      process.exit(1)
    }

    if (!executeCommandWithOutput('vercel link', 'Linking project to Vercel')) {
      printError('Failed to link project. Please run "vercel link" manually.')
      process.exit(1)
    }
  } else {
    printSuccess('Project is already linked to Vercel')
  }

  // Step 3: Check and pull environment variables
  printStep(3, 6, 'Check environment variables')

  const envFile = `.env.${target}.local`

  if (!fs.existsSync(envFile)) {
    printWarning(`Environment file ${envFile} not found`)

    const shouldPull = await confirm(
      `Do you want to pull environment variables for ${target}?`,
      true,
    )
    if (!shouldPull) {
      printWarning('Proceeding without pulling environment variables')
    } else {
      if (
        !executeCommand(
          `vercel pull --environment=${target}`,
          `Pulling ${target} environment variables`,
        )
      ) {
        printError('Failed to pull environment variables')
        const shouldContinue = await confirm('Continue without environment variables?', false)
        if (!shouldContinue) {
          process.exit(1)
        }
      }
    }
  } else {
    printSuccess(`Environment file ${envFile} exists`)
  }

  // Step 4: Clean and Build the project
  printStep(4, 6, 'Clean and Build project')

  // Clean .next directory to avoid upload warning
  const nextDir = path.join(process.cwd(), '.next')
  if (fs.existsSync(nextDir)) {
    printInfo('Cleaning .next directory before build...')
    executeCommand('rm -rf .next', 'Cleaning .next directory')
  }

  printInfo('Building project for Vercel deployment...')
  const buildCommand = `vercel build --target=${target} --yes`
  if (!executeCommandWithOutput(buildCommand, `Building project for ${target}`)) {
    printError('Build failed. Please fix build errors and try again.')
    process.exit(1)
  }

  // Step 5: Confirm production deployment
  printStep(5, 6, 'Deployment confirmation')

  if (target === 'production') {
    console.log()
    print('═'.repeat(50), colors.red + colors.bright)
    printWarning('YOU ARE ABOUT TO DEPLOY TO PRODUCTION!')
    print('═'.repeat(50), colors.red + colors.bright)
    console.log()

    const confirmProd = await confirm(
      `${colors.red}${colors.bright}Are you absolutely sure you want to deploy to PRODUCTION?${colors.reset}`,
      false,
    )

    if (!confirmProd) {
      printInfo('Production deployment cancelled')
      process.exit(0)
    }

    const doubleConfirm = await confirm(
      `${colors.red}Type "yes" to confirm PRODUCTION deployment${colors.reset}`,
      false,
    )

    if (!doubleConfirm) {
      printInfo('Production deployment cancelled')
      process.exit(0)
    }
  }

  // Step 6: Deploy
  printStep(6, 6, 'Deploy to Vercel')

  printInfo(`${symbols.package} Deploying to ${target}...`)

  const deployCommand = `vercel deploy --prebuilt --target=${target}`

  if (!executeCommandWithOutput(deployCommand, `Deploying to ${target}`)) {
    printError('Deployment failed')
    process.exit(1)
  }

  // Success message
  console.log()
  print('═'.repeat(50), colors.green + colors.bright)
  printSuccess(`${symbols.rocket} Deployment successful!`)
  print('═'.repeat(50), colors.green + colors.bright)
  console.log()

  if (urlMap[target]) {
    print(`${symbols.globe} Your app is live at:`, colors.bright)
    print(`   ${urlMap[target]}`, colors.cyan + colors.bright)
  } else if (target === 'development') {
    printInfo('Check the deployment URL in the output above')
  }

  console.log()
  printSuccess('All done! Happy deploying! 🎉')
}

// Main execution
async function main() {
  try {
    await deploy()
  } catch (error) {
    console.error()
    printError('An unexpected error occurred:')
    console.error(error)
    process.exit(1)
  } finally {
    rl.close()
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log()
  printWarning('Deployment cancelled by user')
  process.exit(0)
})

// Run the script
void main()
