type Translate = {
	[key: string]: string;
}

export const Locale: {
	[key: string]: Translate;
} = {
	'title:pending' : {
		vi: 'Cả hai bên phải đồng ý thì giao dịch sau đây mới có thể diễn ra!',
		'en-US': 'Both end must agree for the following trade to take place!',
	},
	'title:success' : {
		vi: 'Trao đổi thành công!',
		'en-US': 'Trade has been successful!',
	},
	'title:failed' : {
		vi: 'Trao đổi thất bại!',
		'en-US': 'Trade failed!',
	},
	'title:confirm': {
		vi: 'Đồng Ý',
		'en-US': 'Accept'
	},
	'title:cancel': {
		vi: 'Từ Chối',
		'en-US': 'Decline'
	},
	'description:pending' : {
		vi: 'Vật phẩm đã được giao đến túi của người chơi.',
		'en-US': 'Items were sent to each player\'s bag!',
	},
	'description:success' : {
		vi: 'Vật phẩm đã được giao đến túi của người chơi.',
		'en-US': 'Items were sent to each player\'s bag!',
	},
	'description:failed' : {
		vi: 'Trao đổi thất bại. Hãy tạo lệnh trao đổi mới!',
		'en-US': 'Trade failed. Please create a new trade request!',
	},
	'trade:footer': {
		vi: 'Bấm từ chối nếu bạn không muốn tiếp tục trao đổi',
		'en-US': 'Click Decline if you don\'t wish to trade'
	},
	'trade:mention': {
		vi: 'bạn vừa được nhắc đến ở giao dịch duới đây',
		'en-US': 'you have been mentioned in the trade below'
	},
	'error:cancel': {
		vi: 'Huỷ',
		'en-US': 'Cancel'
	},
}
