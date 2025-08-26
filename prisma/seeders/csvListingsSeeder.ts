import * as fs from 'fs'
import * as path from 'path'
import { ApprovalStatus, type PrismaClient } from '@orm'

type ListingData = {
  game: string
  performance: string
  drive: string
  emulator: string
  update: string
  notes: string
  device: string
}

async function csvListingsSeeder(prisma: PrismaClient) {
  console.info('🌱 Seeding listings from CSV...')

  // Read the CSV file
  const csvPath = path.join(__dirname, 'data', 'rp5_flip2_odin2_switch_listing.csv')

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ CSV file not found at: ${csvPath}`)
    return
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8')
  const lines = csvContent.split('\n').filter((line) => line.trim())

  if (lines.length < 2) {
    console.error('❌ CSV file must contain at least a header row and one data row.')
    return
  }

  // Helper function to properly parse CSV line with quoted fields
  const parseCsvLine = (line: string): string[] => {
    const result: string[] = []
    let current = ''
    let inQuotes = false
    let i = 0

    while (i < line.length) {
      const char = line[i]

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Handle escaped quotes ("")
          current += '"'
          i += 2
        } else {
          // Toggle quote state
          inQuotes = !inQuotes
          i++
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator outside quotes
        result.push(current.trim())
        current = ''
        i++
      } else {
        // Regular character
        current += char
        i++
      }
    }

    // Add the last field
    result.push(current.trim())
    return result
  }

  // Parse CSV headers
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase())
  console.log('📋 CSV headers:', headers)

  // Validate required headers
  const requiredHeaders = ['game', 'performance', 'drive', 'emulator', 'update', 'notes', 'device']
  const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h))
  if (missingHeaders.length > 0) {
    console.error(
      `❌ Missing required headers: ${missingHeaders.join(', ')}. Required headers: ${requiredHeaders.join(', ')}`,
    )
    return
  }

  // Parse CSV data and remove duplicates
  const listings: ListingData[] = []
  const seenListings = new Set<string>()
  let csvDuplicatesCount = 0

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])

    if (values.length < headers.length) continue

    const listing: ListingData = {
      game: values[headers.indexOf('game')] || '',
      performance: values[headers.indexOf('performance')] || '',
      drive: values[headers.indexOf('drive')] || '',
      emulator: values[headers.indexOf('emulator')] || '',
      update: values[headers.indexOf('update')] || '',
      notes: values[headers.indexOf('notes')] || '',
      device: values[headers.indexOf('device')] || '',
    }

    if (listing.game && listing.performance && listing.emulator && listing.device) {
      // Create a key to check for duplicates within the CSV
      const listingKey = `${listing.game.toLowerCase()}|||${listing.performance.toLowerCase()}|||${listing.emulator.toLowerCase()}|||${listing.device.toLowerCase()}`

      if (seenListings.has(listingKey)) {
        csvDuplicatesCount++
        console.log(
          `🗑️ Skipping CSV duplicate: ${listing.game} - ${listing.performance} - ${listing.emulator}`,
        )
        continue
      }

      seenListings.add(listingKey)
      listings.push(listing)
    }
  }

  console.log(
    `📊 Parsed ${listings.length} unique listings (${csvDuplicatesCount} CSV duplicates removed)`,
  )

  if (listings.length === 0) {
    console.error('❌ No valid listings found in CSV file.')
    return
  }

  // Get all required data from database
  const games = await prisma.game.findMany({
    include: { system: true },
  })
  const gameMap = new Map(games.map((game) => [game.title.toLowerCase(), game]))

  const emulators = await prisma.emulator.findMany()
  const emulatorMap = new Map(emulators.map((emulator) => [emulator.name.toLowerCase(), emulator]))

  const performanceScales = await prisma.performanceScale.findMany()
  const performanceMap = new Map(performanceScales.map((perf) => [perf.label.toLowerCase(), perf]))

  const devices = await prisma.device.findMany({
    include: { brand: true },
  })
  // Create device map with both "Brand Model" and just "Model" as keys for flexible matching
  const deviceMap = new Map()
  devices.forEach((device) => {
    const fullName = `${device.brand.name} ${device.modelName}`.toLowerCase()
    const modelOnly = device.modelName.toLowerCase()
    deviceMap.set(fullName, device)
    deviceMap.set(modelOnly, device)
  })

  if (devices.length === 0) {
    console.error('❌ No devices found in database. Please seed devices first.')
    return
  }

  // Get specific user for authorship
  const specificUser = await prisma.user.findUnique({
    where: {
      email: 'ryanretrocompatibility@gmail.com',
    },
  })

  if (!specificUser) {
    console.error(
      '❌ User "ryanretrocompatibility@gmail.com" not found, cannot proceed with listings import',
    )
    return
  }

  // Get seeded admin users for approval
  const adminUsers = await prisma.user.findMany({
    where: {
      email: {
        in: ['superadmin@emuready.com', 'admin@emuready.com'],
      },
    },
  })

  // Helper function to get random element from array
  const getRandomElement = <T>(array: T[]): T | undefined => {
    return array.length > 0 ? array[Math.floor(Math.random() * array.length)] : undefined
  }

  console.log(
    `🎮 Found ${games.length} games, ${emulators.length} emulators, ${performanceScales.length} performance scales, ${devices.length} devices`,
  )
  console.log(`👤 Author: ${specificUser.email} (${specificUser.name})`)
  console.log(`👨‍💼 Admin approvers: ${adminUsers.length} available`)

  // Process listings
  let successCount = 0
  let failCount = 0
  let gameNotFoundCount = 0
  let emulatorNotFoundCount = 0
  let performanceNotFoundCount = 0
  let deviceNotFoundCount = 0

  console.info(`📝 Processing ${listings.length} listings...`)

  for (const listing of listings) {
    // Find game by title (case-insensitive)
    const game = gameMap.get(listing.game.toLowerCase())
    if (!game) {
      console.warn(`⚠️ Game "${listing.game}" not found, skipping listing`)
      gameNotFoundCount++
      continue
    }

    // Find emulator by name (case-insensitive)
    const emulator = emulatorMap.get(listing.emulator.toLowerCase())
    if (!emulator) {
      console.warn(`⚠️ Emulator "${listing.emulator}" not found, skipping listing`)
      emulatorNotFoundCount++
      continue
    }

    // Find performance scale by label (case-insensitive)
    const performance = performanceMap.get(listing.performance.toLowerCase())
    if (!performance) {
      console.warn(`⚠️ Performance scale "${listing.performance}" not found, skipping listing`)
      performanceNotFoundCount++
      continue
    }

    // Find device by name (try both full name and model name)
    const device = deviceMap.get(listing.device.toLowerCase())
    if (!device) {
      console.warn(`⚠️ Device "${listing.device}" not found, skipping listing`)
      deviceNotFoundCount++
      continue
    }

    // Create comprehensive notes combining all CSV fields
    const combinedNotes = [
      listing.notes,
      listing.drive ? `Drive: ${listing.drive}` : '',
      listing.update ? `Update: ${listing.update}` : '',
    ]
      .filter(Boolean)
      .join('\n\n')

    const author = specificUser
    const approver = getRandomElement(adminUsers)

    // Random timestamps
    const submittedAt = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Random date in last 30 days
    const approvedAt = new Date(submittedAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) // Approved within 7 days

    try {
      await prisma.listing.create({
        data: {
          gameId: game.id,
          deviceId: device.id,
          emulatorId: emulator.id,
          performanceId: performance.id,
          notes: combinedNotes,
          authorId: author.id,
          status: ApprovalStatus.APPROVED, // Auto-approve CSV imports
          processedAt: approvedAt,
          processedNotes: 'Imported from CSV data',
          processedByUserId: approver?.id ?? adminUsers[0]?.id,
        },
      })

      successCount++

      if (successCount % 50 === 0) {
        console.log(`📈 Progress: ${successCount}/${listings.length} listings imported`)
      }
    } catch (error) {
      console.error(
        `❌ Failed to create listing for "${listing.game}" with ${listing.emulator}:`,
        error,
      )
      failCount++
    }
  }

  console.info('✅ CSV listings seeding completed!')
  console.info('📊 Summary:')
  console.info(`   📥 ${listings.length} total listings in CSV`)
  console.info(`   🗑️ ${csvDuplicatesCount} CSV duplicates removed`)
  console.info(`   ✅ ${successCount} listings imported successfully`)
  console.info(`   ❌ ${failCount} listings failed to import`)
  console.info(`   ⚠️ ${gameNotFoundCount} listings skipped (game not found)`)
  console.info(`   ⚠️ ${emulatorNotFoundCount} listings skipped (emulator not found)`)
  console.info(`   ⚠️ ${performanceNotFoundCount} listings skipped (performance scale not found)`)
  console.info(`   ⚠️ ${deviceNotFoundCount} listings skipped (device not found)`)
  console.info(`   📱 Devices assigned from CSV device column`)
  console.info(`   👥 All listings authored by: ${specificUser.email}`)
  console.info(`   👨‍💼 Using ${adminUsers.length} admin users as approvers`)
}

export default csvListingsSeeder
