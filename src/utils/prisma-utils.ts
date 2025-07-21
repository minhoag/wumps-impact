import { PrismaClient as PrismaConfig } from '@prisma-config';
import { PrismaClient as PrismaDiscord } from '@prisma-discord';
import { PrismaClient as PrismaUser } from '@prisma-user';

export const ConfigPrisma = new PrismaConfig({
  datasourceUrl: process.env['DATABASE_CONFIG'],
});

export const UserPrisma = new PrismaUser({
  datasourceUrl: process.env['DATABASE_USER'],
});

export const DiscordPrisma = new PrismaDiscord({
  datasourceUrl: process.env['DATABASE_DISCORD'],
});
