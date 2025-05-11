import { PrismaClient, Role } from '@prisma/client';
import { parse } from 'csv-parse/sync';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as path from 'path';
import * as bcryptjs from 'bcryptjs';
import * as readline from 'readline';

const prisma = new PrismaClient();

// Define performance scales
const performanceScales = [
  { label: 'Perfect', rank: 1 },
  { label: 'Great', rank: 2 },
  { label: 'Playable', rank: 3 },
  { label: 'Unplayable', rank: 4 },
];

// Sample users for testing
const users = [
  {
    email: 'admin@emuready.com',
    hashedPassword: bcryptjs.hashSync('password123', 10),
    name: 'Admin User',
    role: Role.ADMIN,
  },
  {
    email: 'author@emuready.com',
    hashedPassword: bcryptjs.hashSync('password123', 10),
    name: 'Author User',
    role: Role.AUTHOR,
  },
  {
    email: 'user1@emuready.com',
    hashedPassword: bcryptjs.hashSync('password123', 10),
    name: 'Regular User 1',
    role: Role.USER,
  },
  {
    email: 'user2@emuready.com',
    hashedPassword: bcryptjs.hashSync('password123', 10),
    name: 'Regular User 2',
    role: Role.USER,
  },
  {
    email: 'user3@emuready.com',
    hashedPassword: bcryptjs.hashSync('password123', 10),
    name: 'Regular User 3',
    role: Role.USER,
  },
];


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to CSV file
const csvPath = path.resolve(__dirname, './data/google_sheet.csv');

// Process the CSV data
async function processCSV() {
  // Map to keep track of existing systems, games, devices, emulators
  const systemMap = new Map();
  const gameMap = new Map();
  const deviceMap = new Map();
  const emulatorMap = new Map();

  // Create performance scales
  console.log('Seeding performance scales...');
  for (const scale of performanceScales) {
    await prisma.performanceScale.upsert({
      where: { label: scale.label },
      update: { rank: scale.rank },
      create: scale,
    });
  }

  // Create sample users
  console.log('Seeding users...');
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
  }

  // Get admin user for listings
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@emuready.com' },
  });

  if (!adminUser) {
    throw new Error('Admin user not found');
  }

  // Check if CSV file exists
  if (!fs.existsSync(csvPath)) {
    console.error(`CSV file not found at ${csvPath}`);
    return;
  }

  // Read the CSV file line by line and split into sections
  const fileLines: string[] = [];
  const rl = readline.createInterface({
    input: fs.createReadStream(csvPath),
    crlfDelay: Infinity,
  });
  for await (const line of rl) {
    if (line.trim() !== '') fileLines.push(line);
  }

  // Split into sections
  let currentSection: string[] = [];
  let currentHeader = '';
  let sectionName = '';
  let inMappingSection = false;
  let inGameSection = false;
  let currentSystem = '';

  for (let i = 0; i < fileLines.length; i++) {
    const line = fileLines[i];
    if (line.startsWith('--- Sheet: Mapping ---')) {
      inMappingSection = true;
      inGameSection = false;
      continue;
    }
    if (line.startsWith('--- Sheet:')) {
      inMappingSection = false;
      inGameSection = true;
      // Extract system name from section header
      const match = line.match(/--- Sheet: (.+) ---/);
      currentSystem = match ? match[1].trim() : '';
      continue;
    }
    // If this is a header row, start a new section
    if (line.startsWith('"GUID"') || line.startsWith('"Timestamp"')) {
      currentHeader = line;
      currentSection = [line];
      continue;
    }
    // If in a section, collect lines
    if (currentHeader) {
      currentSection.push(line);
      // If next line is a section header or end of file, process the section
      const nextLine = fileLines[i + 1] || '';
      if (nextLine.startsWith('--- Sheet:') || nextLine.startsWith('"GUID"') || nextLine.startsWith('"Timestamp"') || i + 1 === fileLines.length) {
        // Parse the section
        const csvData = currentSection.join('\n');
        const records = parse(csvData, { columns: true, skip_empty_lines: true, relax_quotes: true, relax_column_count: true }) as any[];
        if (inMappingSection) {
          // Process mapping section for systems
          for (const row of records) {
            if (row.Console) {
              const system = await prisma.system.upsert({
                where: { name: row.Console },
                update: {},
                create: { name: row.Console },
              });
              systemMap.set(row.Console, system.id);
            }
          }
        } else if (inGameSection && currentSystem) {
          // Process game section rows
          for (const row of records) {
            const gameTitle = row.Game;
            const performance = row.Performance || 'Unplayable';
            const emulatorName = row.Emulator;
            const deviceInfo = row.Driver || 'Unknown Device';
            const notes = row.Notes || '';
            if (!gameTitle || !emulatorName) continue;
            let brand = 'Unknown';
            let modelName = deviceInfo;
            if (deviceInfo.includes(' ')) {
              const parts = deviceInfo.split(' ');
              brand = parts[0];
              modelName = parts.slice(1).join(' ');
            }
            let systemId = systemMap.get(currentSystem);
            if (!systemId) {
              const system = await prisma.system.upsert({
                where: { name: currentSystem },
                update: {},
                create: { name: currentSystem },
              });
              systemId = system.id;
              systemMap.set(currentSystem, systemId);
            }
            let gameId = gameMap.get(`${systemId}-${gameTitle}`);
            if (!gameId) {
              const game = await prisma.game.upsert({
                where: { id: gameId || 'tmp-id' },
                update: {},
                create: { title: gameTitle, systemId },
              });
              gameId = game.id;
              gameMap.set(`${systemId}-${gameTitle}`, gameId);
            }
            let deviceId = deviceMap.get(`${brand}-${modelName}`);
            if (!deviceId) {
              const device = await prisma.device.upsert({
                where: { id: deviceId || 'tmp-id' },
                update: {},
                create: { brand, modelName },
              });
              deviceId = device.id;
              deviceMap.set(`${brand}-${modelName}`, deviceId);
            }
            let emulatorId = emulatorMap.get(emulatorName);
            if (!emulatorId) {
              const emulator = await prisma.emulator.upsert({
                where: { name: emulatorName },
                update: {},
                create: { name: emulatorName },
              });
              emulatorId = emulator.id;
              emulatorMap.set(emulatorName, emulatorId);
            }
            const performanceScale = await prisma.performanceScale.findFirst({ where: { label: performance } });
            if (!performanceScale) continue;
            await prisma.listing.create({
              data: {
                deviceId,
                gameId,
                emulatorId,
                performanceId: performanceScale.id,
                notes,
                authorId: adminUser.id,
              },
            });
          }
        }
        // Reset for next section
        currentHeader = '';
        currentSection = [];
      }
    }
  }
  console.log('Seeding complete!');
}

// Main function to run all seed operations
async function main() {
  console.log('Starting database seed...');
  
  try {
    await processCSV();
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
