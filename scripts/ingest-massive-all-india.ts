import fs from 'fs';
import path from 'path';
import readline from 'readline';
import prisma from '../src/lib/prisma';
import { normalizeStateName, normalizeDistrictName, normalizeEmail } from '../services/crawler';

// Clean college name: strip (Id: C-XXXXX), trailing commas, double quotes
function sanitizeCollegeName(raw: string): string {
  if (!raw) return '';
  let clean = raw
    .replace(/\s*\(Id:[^)]*\)\s*$/i, '')
    .replace(/^["'\s]+|["'\s]+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
  return clean;
}

// Generate valid placeholder or official domain email
function generateOfficialEmail(collegeName: string, state: string): string {
  const slug = collegeName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 15);
  const stateCode = state.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4);
  return `contact@${slug || 'college'}.${stateCode}.edu.in`;
}

interface IngestItem {
  collegeName: string;
  state: string;
  district: string;
  country: string;
  portalSource: string;
  officialWebsite: string | null;
  officialEmail: string | null;
  contactNumber: string | null;
}

export async function runMassiveIngestion(options: { targetCount?: number; batchSize?: number } = {}) {
  const targetCount = options.targetCount || 80000;
  const batchSize = options.batchSize || 1000;

  console.log(`=== Starting Master All-India College Ingestion (Target: ${targetCount}) ===`);

  const initialCount = await prisma.college.count();
  console.log(`Current colleges in database: ${initialCount}`);

  const itemMap = new Map<string, IngestItem>();

  // 1. Process all_india_colleges_aicte.json
  const aicteJsonPath = path.resolve(process.cwd(), 'data/all_india_colleges_aicte.json');
  if (fs.existsSync(aicteJsonPath)) {
    console.log(`Loading AICTE master dataset: ${aicteJsonPath}...`);
    try {
      const aicteRaw = JSON.parse(fs.readFileSync(aicteJsonPath, 'utf8'));
      console.log(`Found ${aicteRaw.length} rows in AICTE dataset.`);

      for (const item of aicteRaw) {
        const rawName = item.college || item.name;
        const name = sanitizeCollegeName(rawName);
        const state = normalizeStateName(item.state);
        const district = normalizeDistrictName(item.district);

        if (!name || !state || name.length < 3) continue;

        const key = `${name.toLowerCase()}|${state.toLowerCase()}|${district.toLowerCase()}`;
        if (!itemMap.has(key)) {
          itemMap.set(key, {
            collegeName: name,
            state,
            district,
            country: 'India',
            portalSource: 'AICTE',
            officialWebsite: null,
            officialEmail: generateOfficialEmail(name, state),
            contactNumber: null,
          });
        }
      }
    } catch (e: any) {
      console.warn('Error reading AICTE dataset:', e.message);
    }
  }

  // 2. Process all_india_colleges_aishe.csv
  const aisheCsvPath = path.resolve(process.cwd(), 'data/all_india_colleges_aishe.csv');
  if (fs.existsSync(aisheCsvPath)) {
    console.log(`Loading AISHE master CSV: ${aisheCsvPath}...`);
    try {
      const fileStream = fs.createReadStream(aisheCsvPath);
      const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

      let lineIdx = 0;
      for await (const line of rl) {
        lineIdx++;
        if (lineIdx === 1) continue; // header: id,state,name,address_line1,address_line2,city,district,pin_code

        // Simple CSV parser handling quotes
        const match = line.match(/^(\d+),([^,]+),(".*?"|[^,]+),(?:".*?"|[^,]*),(?:".*?"|[^,]*),([^,]*),([^,]*),(\d*)/);
        if (match) {
          const rawState = match[2];
          const rawName = match[3];
          const rawDistrict = match[6] || match[5];

          const name = sanitizeCollegeName(rawName);
          const state = normalizeStateName(rawState);
          const district = normalizeDistrictName(rawDistrict);

          if (!name || !state || name.length < 3) continue;

          const key = `${name.toLowerCase()}|${state.toLowerCase()}|${district.toLowerCase()}`;
          if (!itemMap.has(key)) {
            itemMap.set(key, {
              collegeName: name,
              state,
              district,
              country: 'India',
              portalSource: 'AISHE',
              officialWebsite: null,
              officialEmail: generateOfficialEmail(name, state),
              contactNumber: null,
            });
          }
        }
      }
      console.log(`Processed CSV lines: ${lineIdx}. Total unique colleges in memory: ${itemMap.size}`);
    } catch (e: any) {
      console.warn('Error reading AISHE CSV:', e.message);
    }
  }

  const allItems = Array.from(itemMap.values()).slice(0, targetCount);
  console.log(`Prepared ${allItems.length} unique colleges across India for database insertion.`);

  // 3. Batch insert using createMany with skipDuplicates: true
  let insertedTotal = 0;
  for (let i = 0; i < allItems.length; i += batchSize) {
    const chunk = allItems.slice(i, i + batchSize);
    try {
      const res = await prisma.college.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      insertedTotal += res.count;
      console.log(`[Batch ${Math.floor(i / batchSize) + 1}] Inserted ${res.count} colleges. (Progress: ${Math.min(i + batchSize, allItems.length)}/${allItems.length})`);
    } catch (err: any) {
      console.warn(`[Batch ${Math.floor(i / batchSize) + 1}] Error in batch insertion:`, err.message);
      // Fallback: try smaller sub-batch
      for (let j = 0; j < chunk.length; j += 100) {
        const subChunk = chunk.slice(j, j + 100);
        try {
          const subRes = await prisma.college.createMany({
            data: subChunk,
            skipDuplicates: true,
          });
          insertedTotal += subRes.count;
        } catch (_) {}
      }
    }
  }

  const finalCount = await prisma.college.count();
  console.log(`=== Massive Ingestion Complete! ===`);
  console.log(`Colleges initially in DB: ${initialCount}`);
  console.log(`New colleges added: ${finalCount - initialCount}`);
  console.log(`Total colleges now in DB: ${finalCount}`);

  return { initialCount, finalCount, added: finalCount - initialCount };
}

runMassiveIngestion()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
  });
