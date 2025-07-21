import { PrismaClient } from '@prisma-discord';
import { schedule as gachaSchedule } from '../events/ref.schedule';

const prisma = new PrismaClient();

async function main() {
  console.log(
    `⬆️  Uploading ${gachaSchedule.length} gacha banners to MySQL…`,
  );

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

    // @ts-ignore – new model, make sure to run `prisma generate` before executing
    await (prisma as any).t_discord_gacha_data.create({
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

  console.log('✅ Upload completed.');
}

main()
  .catch((e) => {
    console.error('❌ Upload failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
