import { Client } from 'discord.js';
import { type Event } from '@type';
import { DiscordPrisma, ConfigPrisma } from '@/utils/prisma-utils';
import { extractGachaUpConfig } from '@/utils/utils';

const ReadyEvent: Event = {
  name: 'ready',
  once: true,
  execute: async (client: Client) => {
    try {
      const data = await DiscordPrisma.t_discord_gacha_data.findMany();
      const gameServerSchedules = await ConfigPrisma.t_gacha_schedule_config.findMany();
      const discordSchedules = await DiscordPrisma.t_discord_gacha_schedule.findMany();
      
      console.log(`🔄 Syncing schedules: ${gameServerSchedules.length} in game server, ${discordSchedules.length} in Discord tracking`);
      
      //--- Clean up expired schedules from both databases ---
      const now = new Date();
      const expiredGameServer = gameServerSchedules.filter(s => s.end_time < now);
      const expiredDiscord = discordSchedules.filter(s => s.endTime < now);
      
      if (expiredGameServer.length > 0) {
        await ConfigPrisma.t_gacha_schedule_config.deleteMany({
          where: { end_time: { lt: now } },
        });
        console.log(`🗑️ Cleaned up ${expiredGameServer.length} expired schedules from game server`);
      }
      
      if (expiredDiscord.length > 0) {
        await DiscordPrisma.t_discord_gacha_schedule.deleteMany({
          where: { endTime: { lt: now } },
        });
        console.log(`🗑️ Cleaned up ${expiredDiscord.length} expired schedules from Discord tracking`);
      }
      
      const activeGameServerSchedules = gameServerSchedules.filter(s => s.end_time >= now);
      const activeDiscordSchedules = discordSchedules.filter(s => s.endTime >= now);
      
      //--- Counts state ---
      let syncedCount = 0;
      let addedCount = 0;
      let removedCount = 0;
      
      //--- Add missing schedules from game server to Discord tracking ---
      for (const gameSchedule of activeGameServerSchedules) {
        const bannerValue = extractGachaUpConfig(gameSchedule);
        let bannerName = `Gacha Type ${gameSchedule.gacha_type}`;
        
        // Find banner data by matching the extracted value
        const bannerData = data.find(banner => banner.value === bannerValue);
        bannerData ? (bannerName = bannerData.name) : bannerName = `Gacha Type ${gameSchedule.gacha_type}`;
        
        const existingDiscordSchedule = activeDiscordSchedules.find(d => d.value === bannerValue && 
          Math.abs(d.beginTime.getTime() - gameSchedule.begin_time.getTime()) < 1000 &&
          Math.abs(d.endTime.getTime() - gameSchedule.end_time.getTime()) < 1000);
        
        if (!existingDiscordSchedule) {
          //--- Create missing schedule ---
          try {
            await DiscordPrisma.t_discord_gacha_schedule.create({
              data: {
                name: bannerName,
                value: bannerValue,
                type: gameSchedule.gacha_type,
                beginTime: gameSchedule.begin_time,
                endTime: gameSchedule.end_time,
                enabled: gameSchedule.enabled === 1,
              },
            });
            addedCount++;
            console.log(`➕ Added missing schedule: ${bannerName} (Value: ${bannerValue}, ID: ${gameSchedule.schedule_id})`);
          } catch (createError) {
            console.error(`❌ Failed to create Discord schedule for ${bannerName}:`, createError);
          }
        }
      }
      
      //--- Remove orphaned schedules ---
      const updatedDiscordSchedules = await DiscordPrisma.t_discord_gacha_schedule.findMany();
      for (const discordSchedule of updatedDiscordSchedules) {
        const gameScheduleExists = activeGameServerSchedules.some(g => extractGachaUpConfig(g) === discordSchedule.value &&
          Math.abs(g.begin_time.getTime() - discordSchedule.beginTime.getTime()) < 1000 &&
          Math.abs(g.end_time.getTime() - discordSchedule.endTime.getTime()) < 1000);
        
        if (!gameScheduleExists) {
          try {
            await DiscordPrisma.t_discord_gacha_schedule.delete({
              where: { id: discordSchedule.id },
            });
            removedCount++;
            console.log(`➖ Removed orphaned schedule: ${discordSchedule.name} (Value: ${discordSchedule.value}, ID: ${discordSchedule.id})`);
          } catch (deleteError) {
            console.error(`❌ Failed to delete orphaned schedule ${discordSchedule.id}:`, deleteError);
          }
        }
      }
      
      //--- Update existing schedules if they differ ---
      const finalDiscordSchedules = await DiscordPrisma.t_discord_gacha_schedule.findMany();
      for (const discordSchedule of finalDiscordSchedules) {
        const gameSchedule = activeGameServerSchedules.find(g => extractGachaUpConfig(g) === discordSchedule.value &&
          Math.abs(g.begin_time.getTime() - discordSchedule.beginTime.getTime()) < 1000 &&
          Math.abs(g.end_time.getTime() - discordSchedule.endTime.getTime()) < 1000);
        
        if (gameSchedule) {
          const needsUpdate = 
            Math.abs(gameSchedule.begin_time.getTime() - discordSchedule.beginTime.getTime()) >= 1000 ||
            Math.abs(gameSchedule.end_time.getTime() - discordSchedule.endTime.getTime()) >= 1000 ||
            (gameSchedule.enabled === 1) !== discordSchedule.enabled;
          
          if (needsUpdate) {
            try {
              await DiscordPrisma.t_discord_gacha_schedule.update({
                where: { id: discordSchedule.id },
                data: {
                  beginTime: gameSchedule.begin_time,
                  endTime: gameSchedule.end_time,
                  enabled: gameSchedule.enabled === 1,
                },
              });
              syncedCount++;
              console.log(`🔄 Updated schedule: ${discordSchedule.name} (Value: ${discordSchedule.value}, ID: ${discordSchedule.id})`);
            } catch (updateError) {
              console.error(`❌ Failed to update schedule ${discordSchedule.id}:`, updateError);
            }
          }
        }
      }
      
      //--- Load final synchronized state ---
      const finalScheduleData = await DiscordPrisma.t_discord_gacha_schedule.findMany();
      const activeSchedule = finalScheduleData.filter((schedule) => schedule.endTime >= now);
      
      //--- Cache data ---
      client.gacha_data = data;
      client.gacha_schedule = activeSchedule;
      
      console.log(`✅ Gacha sync complete:`);
      console.log(`   📊 Cached ${data.length} gacha banner records`);
      console.log(`   📅 Cached ${activeSchedule.length} active schedules`);
      console.log(`   ➕ Added ${addedCount} missing schedules`);
      console.log(`   ➖ Removed ${removedCount} orphaned schedules`);
      console.log(`   🔄 Updated ${syncedCount} existing schedules`);
      console.log(`   🗑️ Cleaned up ${expiredGameServer.length + expiredDiscord.length} expired schedules`);
      console.log(`✅ Logged in as ${client.user?.tag}`);
    } catch (err) {
      console.error('❌ Failed to preload and sync gacha data:', err);
      client.gacha_data = [];
      client.gacha_schedule = [];
    }
  },
};

export default ReadyEvent;