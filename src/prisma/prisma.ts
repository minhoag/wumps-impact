import { PrismaClient as PrismaConfig } from '@prisma-config';
import { PrismaClient as PrismaDiscord } from '@prisma-discord';
import { PrismaClient as PrismaUser } from '@prisma-user';

export const prisma_discord = new PrismaDiscord();
export const prisma_user = new PrismaUser();
export const prisma_config = new PrismaConfig();
