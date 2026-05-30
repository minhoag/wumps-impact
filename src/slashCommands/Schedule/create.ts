import { SlashCommandBuilder } from "discord.js";
import { GACHA_TYPE, type Input, Schedule } from "../../utils/schedule.ts";
import { normalizeName } from "../../utils/utils.ts";

function formatTime(time: string): Date {
	const [day, month, year] = time.split(".").map(Number);
	return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function parseTimeString(start: Date, timeString: string): Date | undefined {
	const timeMap = {
		Y: 365 * 24 * 60 * 60 * 1000,
		M: 30 * 24 * 60 * 60 * 1000,
		w: 7 * 24 * 60 * 60 * 1000,
		d: 24 * 60 * 60 * 1000,
		h: 60 * 60 * 1000,
		m: 60 * 1000,
		s: 1000,
	} as const;
	const match = timeString.match(/^(\d+)([YMwdhms])$/);
	if (!match) return undefined;
	const amount = Number(match[1]);
	const unit = match[2] as keyof typeof timeMap;
	const result = new Date(start);
	result.setTime(start.getTime() + amount * timeMap[unit]);
	return result;
}

// map character with signature
const CHAR_SIG_MAP: Record<string, string> = {
	Nahida: "A Thousand Floating Dreams",
	Eula: "Song of Broken Pines",
	"Sangonomiya Kokomi": "Everlasting Moonglow",
	Xiao: "Primordial Jade Winged-Spear",
	Yelan: "Aqua Simulacra",
	"Kamisato Ayaka": "Mistsplitter Reforged",
	Nilou: "Key of Khaj-Nisut",
	Yoimiya: "Thundering Pulse",
	Ganyu: "Amos",
	"Kaedehara Kazuha": "Freedom-Sworn",
	Venti: "Elegy for the End",
	"Raiden Shogun": "Engulfing Lightning",
	Tartaglia: "Polar Star",
	"Yae Miko": "Kagura",
	Shenhe: "Calamity Queller",
	"Arataki Itto": "Redhorn Stonethresher",
	Zhongli: "Vortex Vanquisher",
	Tighnari: "Hunter",
	"Kamisato Ayato": "Haran Geppaku Futsu",
	Cyno: "Staff of the Scarlet Sands",
	"Hu Tao": "Staff of Homa",
};

function findSignatureByNormalizedName(name: string): string | undefined {
	const normalized = normalizeName(name);
	const matchedKey = Object.keys(CHAR_SIG_MAP).find(
		(key) => normalizeName(key) === normalized,
	);
	return matchedKey ? CHAR_SIG_MAP[matchedKey] : undefined;
}

module.exports = {
	public: true,
	data: new SlashCommandBuilder()
		.setName("gacha")
		.setDescription("Manage banners")
		.setDescriptionLocalizations({
			vi: "Quản lý lịch banner",
		})
		.addSubcommand((subcommand) =>
			subcommand
				.setName("create")
				.setDescription("Create a banner")
				.setDescriptionLocalizations({
					vi: "Tạo banner",
				})
				.addStringOption((option) =>
					option
						.setName("item")
						.setDescription("The name of the character / weapon")
						.setDescriptionLocalizations({
							vi: "Tên nhân vật",
						})
						.setRequired(true),
				)
				.addStringOption((option) =>
					option
						.setName("secondary")
						.setDescription("The name of the secondary character")
						.setDescriptionLocalizations({
							vi: "Tên nhân vật thứ 2",
						})
						.setRequired(false),
				)
				.addStringOption((option) =>
					option
						.setName("begin")
						.setDescription("Begin time. Example: 01.01.1999")
						.setDescriptionLocalizations({
							vi: "Thời gian bắt đầu. Ví dụ: 01.01.1999",
						})
						.setRequired(false),
				)
				// format: 1d, 2d, 7d, 1w, 2w, 1M, 1Y
				.addStringOption((option) =>
					option
						.setName("duration")
						.setDescription("Duration")
						.setDescriptionLocalizations({
							vi: "Thời gian",
						})
						.setRequired(false),
				),
		),
	run: async (_, interaction) => {
		//--- Param collect ---
		const item = interaction.options.getString("item", true);
		const secondary = interaction.options.getString("secondary") ?? "";
		const begin =
			interaction.options.getString("begin") ??
			`${String(new Date().getDate()).padStart(2, "0")}.${String(new Date().getMonth() + 1).padStart(2, "0")}.${new Date().getFullYear()}`; // in case want to set the event in advance. Default to current date in dd.mm.yyyy format
		const duration = interaction.options.getString("duration") ?? "2w"; // default 2 weeks

		//--- Main flow --
		// parse begin and end to Date objects
		const beginDate = formatTime(begin);
		const endDate = parseTimeString(beginDate, duration);
		// error in parsing duration
		if (!endDate) {
			await interaction.reply(
				"Invalid duration. Use format like 1d, 7d, 1w, 1M, 1Y",
			);
			return;
		}
		// create schedule for each gacha type
		const result = [];
		const gachaType = secondary
			? [GACHA_TYPE.Primary, GACHA_TYPE.Secondary, GACHA_TYPE.Weapon]
			: [GACHA_TYPE.Primary, GACHA_TYPE.Weapon];
		const sig = findSignatureByNormalizedName(item);
		const second_sig = secondary
			? findSignatureByNormalizedName(secondary)
			: undefined;
		for (const type of gachaType) {
			let select: string[] = [];
			if (type === GACHA_TYPE.Primary) {
				select = [item];
			} else if (type === GACHA_TYPE.Secondary && secondary) {
				select = [secondary];
			} else if (type === GACHA_TYPE.Weapon) {
				select = [sig, second_sig].filter(Boolean) as string[];
			}
			const params: Input = {
				gachaType: type,
				beginTime: beginDate,
				endTime: endDate,
				select: select,
			};
			const schedule = new Schedule();
			const res = await schedule.create(params);
			result.push(res);
		}
		await interaction.reply(
			`Schedule created successfully! ${result.join(" | ")}`,
		);
	},
};
