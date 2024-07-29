type Translate = {
	[key: string]: string;
}

export const Locale: {
	[key: string]: Translate;
} = {
	'title:pending' : {
		vi: 'Chờ Xác Nhận',
		'en-US': 'Pending Confirmation',
	},
	'title:confirm': {
		vi: 'Xác nhận',
		'en-US': 'Confirm'
	},
}
