/**
 * Upload Gacha Data Script
 * 
 * IMPORTANT: Run `prisma generate` after updating the schema before executing this script
 * 
 * This script:
 * 1. Clears existing gacha data
 * 2. Processes schedule.ts data
 * 3. Fixes WEAPON banner value issues (ensures value matches rateUpItems5)
 * 4. Handles name processing (English/Vietnamese)
 * 5. Uploads to simplified t_discord_gacha_data schema
 */

import { DiscordPrisma } from '@/utils/prisma-utils';
import { schedule as gachaSchedule } from '@/data/schedule';

async function main() {
  console.log(`⬆️  Uploading ${gachaSchedule.length} gacha banners to MySQL…`);

  // Clear existing data first
  await DiscordPrisma.t_discord_gacha_data.deleteMany({});
  console.log('🗑️  Cleared existing gacha data');

  let processedCount = 0;
  let skippedCount = 0;

  for (const banner of gachaSchedule) {
    try {
      // --- Name & Vietnamese name post-processing ----
      let englishName = banner.name;
      let vietnameseName = banner.vietnameseName?.trim() || '';

      const bracketMatch = englishName.match(/^(.*?)\s*\((.*?)\)/);
      if (bracketMatch) {
        englishName = bracketMatch[1].trim();
        if (!vietnameseName) vietnameseName = bracketMatch[2].trim();
      } else if (!vietnameseName) {
        vietnameseName = englishName;
      }

      // --- Fix WEAPON banner value issue ----
      let correctedValue = banner.value;
      if (banner.bannerType === 'WEAPON' && banner.rateUpItems5) {
        // For weapon banners, value should match the primary weapon in rateUpItems5
        const rateUp5Items = banner.rateUpItems5.split(',').map(item => item.trim());
        
        // Check if current value exists in rateUpItems5
        if (!rateUp5Items.includes(banner.value)) {
          // Use the first item in rateUpItems5 as the corrected value
          correctedValue = rateUp5Items[0];
          console.log(`🔧 Fixed WEAPON value: ${banner.name} - ${banner.value} → ${correctedValue}`);
        }
      }

      // --- Create database entry ----
      // @ts-ignore – new model schema, make sure to run `prisma generate` before executing
      await DiscordPrisma.t_discord_gacha_data.create({
        data: {
          value: correctedValue,
          name: englishName,
          gachaType: banner.gachaType,
          bannerType: banner.bannerType,
          rateUpItems4: banner.rateUpItems4 || null,
          rateUpItems5: banner.rateUpItems5 || null,
          prefabPath: banner.prefabPath || null,
          previewprefabPath: banner.previewprefabPath || null,
          titlePath: banner.titlePath || null,
          globalName: banner.globalName || null,
          vietnameseName: vietnameseName || null,
          image: banner.image || null,
        },
      });

      processedCount++;
    } catch (error) {
      console.error(`❌ Failed to process banner: ${banner.name}`, error);
      skippedCount++;
    }
  }

  console.log(`✅ Upload completed. Processed: ${processedCount}, Skipped: ${skippedCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Upload failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await DiscordPrisma.$disconnect();
  });
