export type ShopItem = {
	index: number,
	itemId: number,
	name: string,
	type: 'mora' | 'credit' | 'points'
	price: number,
	quantity: number,
	image: string,
	description: string
}
export const ShopView: ShopItem[] = [
	{
		index: 202001,
		itemId: 107009,
		name: 'Fragile Resin (Nhựa Dễ Vỡ)',
		type: 'mora',
		price: 10000000,
		quantity: 1,
		image: '<:FragileResin:1257820100325539861>',
		description:
			'An item used to restore Original Resin by 60 points (Vật phẩm được sử dụng để hồi phục 60 điểm Nhựa Nguyên Chất).'
	},
	{
		index: 202002,
		itemId: 104319,
		name: 'Crown of Insight (Vương Miện tri thức)',
		type: 'mora',
		price: 10000000,
		quantity: 1,
		image: '<:FragileResin:1257820100325539861>',
		description:
			'Character Talent Material used when leveling Combat Talents (Vật liệu Thiên Phú Nhân Vật được sử dụng khi nâng cấp Thiên Phú Chiến Đấu).'
	},
	{
		index: 2,
		itemId: 101,
		name: 'Intertwined Fate',
		type: 'credit',
		price: 100,
		quantity: 7500,
		image: '',
		description:
			'Simple Description to test.'
	}
]
