import { getPlayerOnline } from '../function'
import { BotEvent } from '../types'
import { ActivityType, Client } from 'discord.js'
import moment from 'moment'
import prisma_sqlite from '../prisma/prisma-sqlite'

const event: BotEvent = {
	name: 'ready',
	once: true,
	execute: async (client: Client) => {
		console.table({
			users: client.user?.tag,
			online: await getPlayerOnline()
		})
		await run(client)
		setInterval(async () => {
			try {
				const onlinePlayer = await getPlayerOnline()
				const start = Date.now()
				await fetch('http://37.114.63.115:2888')
				const ping = Date.now() - start
				if (onlinePlayer === 'down') {
					client.user?.setActivity(`Bảo trì.`, {
						type: ActivityType.Listening
					})
				} else {
					client.user?.setActivity(
						` với ${onlinePlayer} người. Ping ${Math.ceil(ping / 2)}ms`,
						{
							type: ActivityType.Playing
						}
					)
				}
			} catch (error) {
				client.user?.setActivity(`lỗi server.`, {
					type: ActivityType.Listening
				})
			}
			await run(client)
		}, 60_000)
	}
}

async function run(client: Client) {
	try {
		const serverData = await prisma_sqlite.serverData.findUnique({
			where: {
				id: client.user?.id
			},
			select: {
				lastResetLimit: true,
				currentLimit: true
			}
		})
		if (!serverData) return
		const lastReset = serverData.lastResetLimit
		client.currentLimit = serverData.currentLimit
		const checkData = moment(lastReset).isSame(new Date(), 'week')
		if (checkData) {
			await prisma_sqlite.userData.updateMany({
				data: {
					weeklyMora: 0,
					weeklyPoints: 0,
					weeklyCredit: 0
				}
			})
			await prisma_sqlite.serverData.update({
				where: {
					id: client.user?.id
				},
				data: {
					lastResetLimit: moment().toDate()
				}
			})
		}
	} catch {
		console.log('Error has occurred with checking server reset limit.')
	}
}

export default event
