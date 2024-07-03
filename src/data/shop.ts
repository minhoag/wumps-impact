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
		name: 'Fragile Resin',
		type: 'mora',
		price: 10000000,
		quantity: 1,
		image: '<:FragileResin:1257820100325539861>',
		description:
			'An item used to restore Original Resin by 60 points.'
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
