import * as fs from 'fs'
import * as path from 'path'
import { ApprovalStatus, Role, type PrismaClient } from '@orm'

type GameData = {
  title: string
  systemName: string
}

async function csvGamesSeeder(prisma: PrismaClient) {
  console.info('🌱 Seeding games from CSV...')

  // Read the CSV file
  const csvPath = path.join(__dirname, 'data', 'rp5_flip2_odin2_switch_games.csv')

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
  const requiredHeaders = ['title', 'systemname']
  const missingHeaders = requiredHeaders.filter((h) => !headers.includes(h))
  if (missingHeaders.length > 0) {
    console.error(
      `❌ Missing required headers: ${missingHeaders.join(', ')}. Required headers: title, systemName`,
    )
    return
  }

  // Parse CSV data and remove duplicates
  const games: GameData[] = []
  const seenGames = new Set<string>()
  let csvDuplicatesCount = 0

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i])

    if (values.length < headers.length) continue

    const game: GameData = {
      title: values[headers.indexOf('title')] || '',
      systemName: values[headers.indexOf('systemname')] || '',
    }

    if (game.title && game.systemName) {
      // Create a key to check for duplicates within the CSV
      const gameKey = `${game.title.toLowerCase()}|||${game.systemName.toLowerCase()}`

      if (seenGames.has(gameKey)) {
        csvDuplicatesCount++
        console.log(`🗑️ Skipping CSV duplicate: ${game.title} - ${game.systemName}`)
        continue
      }

      seenGames.add(gameKey)
      games.push(game)
    }
  }

  console.log(
    `📊 Parsed ${games.length} unique games (${csvDuplicatesCount} CSV duplicates removed)`,
  )

  if (games.length === 0) {
    console.error('❌ No valid games found in CSV file.')
    return
  }

  // Get all systems first
  const systems = await prisma.system.findMany()
  const systemMap = new Map(systems.map((system) => [system.name.toLowerCase(), system]))

  console.log(`🎮 Found ${systems.length} systems in database`)

  // Get the seeded users for submission tracking
  const seededUsers = await prisma.user.findMany({
    where: {
      email: {
        in: [
          'superadmin@emuready.com',
          'admin@emuready.com',
          'author@emuready.com',
          'user@emuready.com',
        ],
      },
    },
  })

  if (seededUsers.length === 0) {
    console.warn('⚠️ No seeded users found, games will not have submitters')
  }

  const adminUsers = seededUsers.filter(
    (user) => user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN,
  )

  if (adminUsers.length === 0) {
    console.warn('⚠️ No admin users found, approved games will not have approvers')
  }

  // Helper function to get random element from array
  const getRandomElement = <T>(array: T[]): T | undefined => {
    return array.length > 0 ? array[Math.floor(Math.random() * array.length)] : undefined
  }

  // Helper function to get random date in the past (within last 90 days)
  const getRandomPastDate = (maxDaysAgo = 90): Date => {
    const daysAgo = Math.floor(Math.random() * maxDaysAgo)
    return new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000)
  }

  // Check for existing games in database
  console.log('🔍 Checking for existing games in database...')
  const existingGames = new Set<string>()

  // Check in batches to avoid overwhelming the database
  const batchSize = 50
  for (let i = 0; i < games.length; i += batchSize) {
    const batch = games.slice(i, i + batchSize)

    for (const game of batch) {
      const system = systemMap.get(game.systemName.toLowerCase())
      if (!system) continue

      const existing = await prisma.game.findFirst({
        where: {
          title: {
            equals: game.title,
            mode: 'insensitive',
          },
          systemId: system.id,
        },
      })

      if (existing) {
        const gameKey = `${game.title.toLowerCase()}|||${game.systemName.toLowerCase()}`
        existingGames.add(gameKey)
      }
    }
  }

  console.log(`📋 Found ${existingGames.size} games that already exist in database`)

  // Filter out existing games
  const newGames = games.filter((game) => {
    const gameKey = `${game.title.toLowerCase()}|||${game.systemName.toLowerCase()}`
    return !existingGames.has(gameKey)
  })

  console.log(
    `✨ Will import ${newGames.length} new games (${games.length - newGames.length} already exist)`,
  )

  if (newGames.length === 0) {
    console.info('✅ All games from CSV already exist in database. No new games to import.')
    return
  }

  // Process new games
  let successCount = 0
  let failCount = 0
  let systemNotFoundCount = 0

  console.info(`📝 Processing ${newGames.length} new games...`)

  for (const game of newGames) {
    const system = systemMap.get(game.systemName.toLowerCase())
    if (!system) {
      console.warn(`⚠️ System "${game.systemName}" not found, skipping game "${game.title}"`)
      systemNotFoundCount++
      continue
    }

    const submitter = getRandomElement(seededUsers)
    const approver = getRandomElement(adminUsers)
    const submittedAt = getRandomPastDate(30) // Recent submissions
    const approvedAt = new Date(submittedAt.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) // Approved within 7 days

    try {
      await prisma.game.create({
        data: {
          title: game.title,
          systemId: system.id,
          status: ApprovalStatus.APPROVED, // Auto-approve CSV imports
          submittedBy: submitter?.id ?? null,
          submittedAt: submittedAt,
          approvedBy: approver?.id ?? null,
          approvedAt: approvedAt,
        },
      })

      successCount++

      if (successCount % 100 === 0) {
        console.log(`📈 Progress: ${successCount}/${newGames.length} games imported`)
      }
    } catch (error) {
      console.error(`❌ Failed to create game "${game.title}" for ${game.systemName}:`, error)
      failCount++
    }
  }

  console.info('✅ CSV games seeding completed!')
  console.info('📊 Summary:')
  console.info(`   📥 ${games.length} total games in CSV`)
  console.info(`   🗑️ ${csvDuplicatesCount} CSV duplicates removed`)
  console.info(`   🔄 ${existingGames.size} games already existed in database`)
  console.info(`   ✅ ${successCount} new games imported successfully`)
  console.info(`   ❌ ${failCount} games failed to import`)
  console.info(`   ⚠️ ${systemNotFoundCount} games skipped (system not found)`)
  console.info(`   👥 Using ${seededUsers.length} seeded users as submitters`)
  console.info(`   👨‍💼 Using ${adminUsers.length} admin users as approvers`)
}

export default csvGamesSeeder
