export type ShopItem = {
	index: number,
	itemId: number,
	name: Record<string, string>,
	type: 'mora' | 'credit' | 'points'
	price: number,
	quantity: number,
	image: string,
	description: Record<string, string>
}
export const ShopView: ShopItem[] = [
	{
		index: 202001,
		itemId: 107009,
		name: {
			"en-US": 'Fragile Resin',
			vi: 'Nhựa Dễ Vỡ'
		},
		type: 'mora',
		price: 10_000_000,
		quantity: 1,
		image: '<:FragileResin:1257820100325539861>',
		description: {
			"en-US": 'An item used to restore Original Resin by 60 points',
			vi: 'Vật phẩm được sử dụng để hồi phục 60 điểm Nhựa Nguyên Chất.',
		}
	},
	{
		index: 202002,
		itemId: 104319,
		name: {
			"en-US": 'Crown of Insight',
			vi: 'Vương Miện tri thức'
		},
		type: 'mora',
		price: 500_000_000,
		quantity: 1,
		image: '<:FragileResin:1257820100325539861>',
		description: {
			"en-US": 'Character Talent Material used when leveling Combat Talents.',
			vi: 'Vật liệu Thiên Phú Nhân Vật được sử dụng khi nâng cấp Thiên Phú Chiến Đấu.'
		}
	},
]
