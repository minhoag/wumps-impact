import { DiscordPrisma } from '@/utils/prisma-utils';
import { schedule as gachaSchedule } from '../events/ref.schedule';

async function main() {
  console.log(`⬆️  Uploading ${gachaSchedule.length} gacha banners to MySQL…`);

  // Group weapons by scheduleId to handle secondary weapons
  const weaponGroups: { [scheduleId: number]: typeof gachaSchedule } = {};

  for (const banner of gachaSchedule) {
    // --- name & vietnamese name post-processing ----
    let englishName = banner.name;
    let vietnameseName = banner.vietnameseName?.trim() || '';

    const bracketMatch = englishName.match(/^(.*?)\s*\((.*?)\)/);
    if (bracketMatch) {
      englishName = bracketMatch[1].trim();
      if (!vietnameseName) vietnameseName = bracketMatch[2].trim();
    } else if (!vietnameseName) {
      vietnameseName = englishName;
    }

    if (banner.bannerType === 'WEAPON') {
      // Group weapons by scheduleId
      if (!weaponGroups[banner.scheduleId]) {
        weaponGroups[banner.scheduleId] = [];
      }
      weaponGroups[banner.scheduleId].push({
        ...banner,
        name: englishName,
        vietnameseName: vietnameseName,
      });
    } else {
      // For non-weapon banners, create entry directly
      // @ts-ignore – new model, make sure to run `prisma generate` before executing
      await DiscordPrisma.t_discord_gacha_data.create({
        data: {
          value: banner.value,
          name: englishName,
          scheduleId: banner.scheduleId,
          gachaType: banner.gachaType,
          bannerType: banner.bannerType,
          sortId: banner.sortId,
          rateUpItems4: banner.rateUpItems4,
          rateUpItems5: banner.rateUpItems5,
          prefabPath: banner.prefabPath,
          previewprefabPath: banner.previewprefabPath,
          titlePath: banner.titlePath,
          globalName: banner.globalName,
          vietnameseName,
          type: banner.type,
          image: banner.image,
        },
      });
    }
  }

  // Process weapon groups
  for (const [scheduleId, weapons] of Object.entries(weaponGroups)) {
    if (weapons.length > 1) {
      // Multiple weapons with same scheduleId - combine rateUpItems5
      const combinedRateUpItems5 = Array.from(
        new Set(weapons.map((weapon) => weapon.rateUpItems5).filter((items) => items)),
      ).join(',');

      // Create entries for each weapon with combined rateUpItems5
      for (const weapon of weapons) {
        // @ts-ignore – new model, make sure to run `prisma generate` before executing
        await DiscordPrisma.t_discord_gacha_data.create({
          data: {
            value: weapon.value,
            name: weapon.name,
            scheduleId: weapon.scheduleId,
            gachaType: weapon.gachaType,
            bannerType: weapon.bannerType,
            sortId: weapon.sortId,
            rateUpItems4: weapon.rateUpItems4,
            rateUpItems5: combinedRateUpItems5,
            prefabPath: weapon.prefabPath,
            previewprefabPath: weapon.previewprefabPath,
            titlePath: weapon.titlePath,
            globalName: weapon.globalName,
            vietnameseName: weapon.vietnameseName,
            type: weapon.type,
            image: weapon.image,
          },
        });
      }
    } else {
      // Single weapon - create entry normally
      const weapon = weapons[0];
      // @ts-ignore – new model, make sure to run `prisma generate` before executing
      await DiscordPrisma.t_discord_gacha_data.create({
        data: {
          value: weapon.value,
          name: weapon.name,
          scheduleId: weapon.scheduleId,
          gachaType: weapon.gachaType,
          bannerType: weapon.bannerType,
          sortId: weapon.sortId,
          rateUpItems4: weapon.rateUpItems4,
          rateUpItems5: weapon.rateUpItems5,
          prefabPath: weapon.prefabPath,
          previewprefabPath: weapon.previewprefabPath,
          titlePath: weapon.titlePath,
          globalName: weapon.globalName,
          vietnameseName: weapon.vietnameseName,
          type: weapon.type,
          image: weapon.image,
        },
      });
    }
  }

  console.log('✅ Upload completed.');
}

main()
  .catch((e) => {
    console.error('❌ Upload failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await DiscordPrisma.$disconnect();
  });
