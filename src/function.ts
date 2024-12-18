import {
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
	ChannelType,
	CommandInteraction,
	ComponentType,
	GuildMember,
	Interaction,
	Message,
	PermissionFlagsBits,
	PermissionResolvable,
	PermissionsBitField,
	TextChannel
} from 'discord.js'
import { schedule } from './data/schedule'
import prisma from './prisma/prisma'
import prisma_second from './prisma/prisma-second'
import prisma_sqlite from './prisma/prisma-sqlite'
import type { t_activity_schedule_config, t_gacha_schedule_config } from '@prisma/client'
import moment from 'moment'
import client from './index'

export const checkPermissions = (member: GuildMember, permissions: Array<PermissionResolvable>) => {
	const neededPermissions: PermissionResolvable[] = [];
	permissions.forEach((permission) => {
		if (!member.permissions.has(permission)) neededPermissions.push(permission);
	});
	if (neededPermissions.length === 0) return null;
	return neededPermissions.map((p) => {
		if (typeof p === 'string') return p.split(/(?=[A-Z])/).join(' ');
		else
			return Object.keys(PermissionFlagsBits)
				.find((k) => Object(PermissionFlagsBits)[k] === p)
				?.split(/(?=[A-Z])/)
				.join(' ');
	});
};

export const sendTimedMessage = (message: string, channel: TextChannel, duration: number) => {
	channel.send(message).then((m) => setTimeout(async () => (await channel.messages.fetch(m)).delete(), duration));
	return;
};

export async function getGachaScheduleConfig() {
	try {
		const banners: t_gacha_schedule_config[] = await prisma.t_gacha_schedule_config.findMany();
		return banners;
	} catch (err) {
		console.log('Error: ' + err.message);
	}
}

/* Update sự kiện ước nguyện lên SQL */
export const updateGachaScheduleConfig = async ({
																	scheduleId,
																	gachaType,
																	gachaPropRuleId,
																	start,
																	end,
																	/* Weapon */
																	weapon,
																}: {
	scheduleId: number;
	gachaType: number;
	gachaPropRuleId: number;
	start: Date;
	end: Date;
	/* Weapon */
	weapon?: string;
}) => {
	try {
		const _schedule = schedule.find((e) => e.scheduleId === scheduleId) ?? schedule[0];
		const rateUpItems5 = !weapon ? _schedule.rateUpItems5.toString() : weapon;
		const rateUpItems4 = _schedule.rateUpItems4.toString();
		const prob = gachaPropRuleId === 1 ? 500 : 750;
		await prisma.$connect();
		const scheduleSchema: t_gacha_schedule_config = {
			schedule_id: scheduleId,
			gacha_type: gachaType,
			begin_time: start,
			end_time: end,
			cost_item_id: 223,
			cost_item_num: 1,
			gacha_pool_id: 201,
			gacha_prob_rule_id: gachaPropRuleId,
			gacha_up_config: `{\"gacha_up_list\":[{\"item_parent_type\":1,\"prob\":${prob},\"item_list\":[${rateUpItems5}]},{\"item_parent_type\":2,\"prob\":500,\"item_list\":[${rateUpItems4}]}]}`,
			gacha_rule_config: '{}',
			gacha_prefab_path: _schedule.prefabPath,
			gacha_preview_prefab_path: _schedule.previewprefabPath,
			gacha_prob_url: '',
			gacha_record_url: '',
			gacha_prob_url_oversea: '',
			gacha_record_url_oversea: '',
			gacha_sort_id: _schedule.sortId,
			enabled: 1,
			title_textmap: _schedule.titlePath,
			display_up4_item_list: _schedule.rateUpItems4.toString(),
		};
		await prisma.t_gacha_schedule_config.create({
			data: scheduleSchema,
		});
	} catch (err) {
		return err;
	} finally {
		await prisma.$disconnect();
	}
};
export const deleteGachaScheduleConfig = async (schedule_id: number) => {
	try {
		await prisma.t_gacha_schedule_config.delete({
			where: {schedule_id: schedule_id},
		});
	} catch (err) {
		console.log(err.message);
		return err.message;
	}
};
/* Update sự kiện lên SQL */
export const getEventScheduleConfig = async () => {
	try {
		const data: t_activity_schedule_config[] = await prisma.t_activity_schedule_config.findMany();
		return data;
	} catch (err) {
		return err.message;
	}
};

/* Update sự kiện lên SQL */
export const deleteEventScheduleConfig = async (schedule_id: number) => {
	try {
		const data: t_activity_schedule_config = await prisma.t_activity_schedule_config.delete({
			where: {schedule_id: schedule_id},
		});
		return data;
	} catch (err) {
		return err.message;
	}
};
/* Update sự kiện lên SQL */
export const updateEventScheduleConfig = async (event: string, start: Date, end: Date) => {
	const uploadData: t_activity_schedule_config = {
		schedule_id: Number(event),
		begin_time: start,
		end_time: end,
		desc: '',
	};
	try {
		await prisma.t_activity_schedule_config.create({data: uploadData});
	} catch (err) {
		return err.message;
	}
};

export const getUsers = async () => {
	try {
		const data: any = await prisma_second.t_player_uid.findMany();
		return data;
	} catch (err) {
		return err.message;
	}
};

/* Function Data Users */
/* http://wumpus.site:14861/api?cmd=1004&region=dev_gio&ticket=GM&uid=${uid} : Lấy thông tin tower */
/* http://wumpus.site:14861/api?cmd=1004&region=dev_gio&ticket=GM&uid=${uid} : Lấy thông tin tower */

export const fetchUsers = async (
	ip: string,
	sender: string,
	title: string,
	description: string,
	item: string,
	seconds: string,
	uuid: string,
) => {
	const users = await getUsers();
	type User = {
		uid: number;
		account_type: number;
		account_uid: string;
		create_time: Date;
		ext: string;
		tag: number;
	};
	users.map(async (user: User) => {
		await fetch(
			`http://${ip}:14861/api?sender=${sender}&title=${title}&content=${description}&item_list=${item}&expire_time=${seconds}&is_collectible=False&uid=${user.uid}&cmd=1005&region=dev_gio&ticket=GM%40${seconds}&sign=${uuid}`,
		);
	});
	return;
};

/* Function tìm database */
export const getGachadata = (name: string) => schedule.filter((data) => data.value.includes(name));

/* Function substats */
export const extractSubstats = (substatsString: string) => {
	const substatsArray: string[] = substatsString.split(' ');
	return substatsArray.flatMap((substat: string) => {
		const parts = substat.split(',');
		if (parts.length === 2) {
			return new Array(parseInt(parts[1])).fill(parts[0]);
		}
		return [];
	});
};
export const bagPagination = async (interaction: CommandInteraction, pages: any[], time: number,  page_number: number) => {
	if (pages.length === 1) {
		const page: Message<any> = await interaction.editReply({
			embeds: [pages[0]],
			components: [],
		});
		return page;
	}
	const prev = new ButtonBuilder()
		.setCustomId('prev')
		.setLabel('Previous')
		// @ts-ignore
		.setStyle(ButtonStyle.Primary)
	if (page_number === 0) prev.setDisabled(true);

	const next = new ButtonBuilder()
		.setCustomId('next')
		.setLabel('Next')
		// @ts-ignore
		.setStyle(ButtonStyle.Primary);

	const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents([prev, next]);
	let index: number = page_number;
	const currentPage = await interaction.editReply({
		embeds: [pages[index]],
		components: [buttonRow],
	});

	const collector = currentPage.createMessageComponentCollector({
		componentType: ComponentType.Button,
		time,
	});

	collector.on('collect', async (i) => {
		try {
			if (i.user.id !== interaction.user.id) {
				await i.reply({
					content: 'Bạn không có quyền sử dụng lệnh này.',
					ephemeral: true,
				});
			}
			await i.deferUpdate();
			if (i.customId === 'prev') {
				index--;
				prev.setDisabled(index === 0);
				next.setDisabled(false);
			} else if (i.customId === 'next') {
				index++;
				prev.setDisabled(false);
				next.setDisabled(index === pages.length - 1);
			}
			await currentPage.edit({
				embeds: [pages[index]],
				components: [buttonRow],
			});
			collector.resetTimer();
		} catch (error) {
			console.log(error);
		}
	});

	collector.on('end', async () => {
		try {
			await currentPage.edit({
				embeds: [pages[index]],
				components: [],
			});
		} catch (error) {
			console.log(error);
		}
	});
	return currentPage;
};

/* Function Shop Pagination */
export const shopPagination = async (interaction: CommandInteraction, pages: any[], time: number) => {
	await interaction.deferReply()
	if (pages.length === 1) {
		const page: Message<any> = await interaction.editReply({
			embeds: [pages[0]],
			components: [],
		});
		return page;
	}

	const prev = new ButtonBuilder()
		.setCustomId('prev')
		.setLabel('Previous')
		// @ts-ignore
		.setStyle(ButtonStyle.Primary)
		.setDisabled(true);

	const next = new ButtonBuilder()
		.setCustomId('next')
		.setLabel('Next')
		// @ts-ignore
		.setStyle(ButtonStyle.Primary);

	const buttonRow = new ActionRowBuilder<ButtonBuilder>().addComponents([prev, next]);
	let index = 0;
	const currentPage = await interaction.editReply({
		embeds: [pages[index]],
		components: [buttonRow],
	});

	const collector = currentPage.createMessageComponentCollector({
		componentType: ComponentType.Button,
		time,
	});

	collector.on('collect', async (i) => {
		try {
			if (i.user.id !== interaction.user.id) {
				await i.reply({
					content: 'Bạn không có quyền sử dụng lệnh này.',
					ephemeral: true,
				});
			}
			await i.deferUpdate();

			if (i.customId === 'prev') {
				index--;
				prev.setDisabled(index === 0);
				next.setDisabled(false);
			} else if (i.customId === 'next') {
				index++;
				prev.setDisabled(false);
				next.setDisabled(index === pages.length - 1);
			}
			await currentPage.edit({
				embeds: [pages[index]],
				components: [buttonRow],
			});
			collector.resetTimer();
		} catch (error) {
			console.log(error);
		}
	});

	collector.on('end', async () => {
		try {
			await currentPage.edit({
				embeds: [pages[index]],
				components: [],
			});
		} catch (error) {
			console.log(error);
		}
	});
	return currentPage;
};

export function generateOTP(): string {
	let digits = '0123456789';
	let OTP = '';
	let len = digits.length;
	for (let i = 0; i < 4; i++) {
		OTP += digits[Math.floor(Math.random() * len)];
	}
	return OTP;
}

export async function sendOTP(uid: string, otp: string): Promise<void> {
	const ip: string | undefined = process.env.IP;
	const uuid: string = new Date().getTime().toString();
	const title: string = 'Verification OTP';
	const sender: string = 'P・A・I・M・O・N';
	const description: string = `Your OTP for the account is ${otp}. Use this code to enter in the Form opened on Discord for verification.`;
	const seconds = moment().add(Number(15), 'minute').unix();
	try {
		await fetch(
			`http://${ip}:14861/api?sender=${sender}&title=${title}&content=${description}&item_list=202:1&expire_time=${seconds}&is_collectible=False&uid=${uid}&cmd=1005&region=dev_gio&ticket=GM%40${seconds}&sign=${uuid}`,
		);
	} catch {
		console.log(otp);
	}
}

export async function checkDatabase(user: string) {
	await prisma_sqlite.$connect();
	return prisma_sqlite.userData.findUnique({
		where: {
			user: user,
		},
	});
}

export async function sqliteUpdate(user: string) {
	const userData = await prisma_sqlite.userData.findFirst({
		where: {
			user: user,
		},
	});
	if (!userData) return undefined;
	const ip: string | undefined = process.env.IP;
	const timeNow: number = moment().unix();
	const lastUpdate: number = userData.lastUpdate;
	const timeDiff: number = timeNow - lastUpdate;
	if (timeDiff > 60) {
		try {
			const briefData = await fetch(`http://${ip}:14861/api?cmd=5003&region=dev_gio&ticket=GM&uid=${userData.uid}`).then(res => res.json());
			const moraUpdate = briefData.data.scoin;
			await prisma_sqlite.userData.update({
				where: {
					user: user,
				},
				data: {
					mora: moraUpdate,
					lastUpdate: timeNow,
				},
			});
		} catch {
			console.log("Cannot fetch data. Might because database is not connected.")
		}
	}
	return userData;
}

export async function sendThankYouMail(price: any, quantity: any, uid: any, uuid: any) {
	const ip: string | undefined  = process.env.IP;
	const title: string = 'Thank you for your purchasing';
	const sender: string = 'P・A・I・M・O・N';
	const description: string = 'Thank you very much for shopping with us. We hope you enjoy the game.';
	const seconds = moment().add(Number(365), 'days').unix();
	await fetch(
		`http://${ip}:14861/api?sender=${sender}&title=${title}&content=${description}&item_list=${price.itemId}:${price.quantity * quantity}&expire_time=${seconds}&is_collectible=False&uid=${uid}&cmd=1005&region=dev_gio&ticket=GM%40${seconds}&sign=${uuid}`,
	);
}

export async function pointsAddition(id: string) {
	try {
		await prisma_sqlite.userData.updateMany({
			where: {
				user: id,
			},
			data: {
				points: {
					increment: 10,
				},
			},
		});
	} catch(error) {
		return console.log(error.message)
	}
}

export async function sendLog(interaction: Interaction, content: string) {
	if (!interaction.guild) return;
	let channel = interaction.guild.channels.cache.find(c => c.name.toLowerCase() === 'shop-log')
	if (!channel) {
		channel = await interaction.guild.channels.create({
			name: 'shop-log',
			type: ChannelType.GuildText,
			permissionOverwrites: [
				{
					id: interaction.guild.id,
					deny: [PermissionsBitField.Flags.ViewChannel]
				}
			]
		})
	}
	if (!channel.id) return;
	const message = client.channels.cache.get(channel.id) as TextChannel;
	await message.send(content)
}

export async function antiSpam(message: Message, usersMap: any, DIFF: number, LIMIT: number) {
	if(usersMap.has(message.author.id)) {
		const userData = usersMap.get(message.author.id);
		const { lastMessage, timer } = userData;
		const difference: number = message.createdTimestamp - lastMessage.createdTimestamp;
		let msgCount = userData.msgCount;
		if(difference > DIFF) {
			clearTimeout(timer);
			userData.msgCount = 1;
			userData.lastMessage = message;
			userData.timer = setTimeout(() => {
				usersMap.delete(message.author.id);
			}, 30 * 1000);
			usersMap.set(message.author.id, userData)
		}
		else {
			++msgCount;
			if (!message.guild) return
			if(parseInt(msgCount) === LIMIT) {
				message.guild.members.fetch(message.author.id).then(user => user.timeout(1_800_000, "Timeout for spamming."))
			}
			userData.msgCount = msgCount;
			usersMap.set(message.author.id, userData);
		}
	}
	else {
		let fn = setTimeout(() => {
			usersMap.delete(message.author.id);
		}, 30 * 1000);
		usersMap.set(message.author.id, {
			msgCount: 1,
			lastMessage : message,
			timer : fn
		});
	}
}

export async function getPlayerItems(uid: string | number) {
	try {
		const ip: string | undefined = process.env.IP;
		const res: Response = await fetch(`http://${ip}:14861/api?cmd=1016&region=dev_gio&ticket=GM&uid=${uid}`);
		const item = await res.json();
		// Materials are type 2
		let all_item: any
		all_item = item.data.item_bin_data.pack_store.item_list.filter((i: any) => i.item_type === 2)
		return all_item
	} catch(error) {
		console.log(error.message)
	}
}

export async function getPlayerOnline() {
	try {
		const ip = process.env.IP;
		const res = await fetch(`http://${ip}:14861/api?cmd=1101&region=dev_gio&ticket=GM`);
		const json = await res.json();
		return json.data.online_player_num_except_sub_account;
	} catch (error) {
		return 'down';
	}
}

export function truncateText(text: string, length: number) {
	if (text.length <= length) {
		return text;
	}
	return text.substr(0, length) + '\u2026'
}

export function removeAccents(str: string) {
	return str.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/đ/g, 'd').replace(/Đ/g, 'D')
}

