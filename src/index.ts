import { Client, Collection, GatewayIntentBits } from 'discord.js'
import { Command, SlashCommand } from './types'
import { readdirSync } from 'fs'
import { join } from 'path'
import { config } from 'dotenv'

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildMembers
	]
})

config()

client.slashCommands = new Collection<string, SlashCommand>()
client.commands = new Collection<string, Command>()
client.cooldowns = new Collection<string, number>()
client.chats = new Collection<string, number>()
client.currentLimit = 0

const handlersDir = join(__dirname, './handlers')
readdirSync(handlersDir).forEach((handler) => {
	require(`${handlersDir}/${handler}`)(client)
})

// Prevent Rejection
process.on('unhandledRejection', async (error: Error) => {
	const channel = await client.channels.fetch('1169625957049577522')
	if (!channel || !channel.isTextBased()) return
	await channel.send('Unhandled ' + error.name + ': ' + error.message)
})
process.on('uncaughtException', async (error: Error) => {
	const channel = await client.channels.fetch('1169625957049577522')
	if (!channel || !channel.isTextBased()) return
	await channel.send('Uncaught ' + error.name + ': ' + error.message)
})
export default client
client.login(process.env.TOKEN)
