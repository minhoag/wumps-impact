type Translate = {
	[key: string]: string;
}

export const Locale: {
	[key: string]: Translate;
} = {
	'item': {
		vi: 'Vật phẩm',
		'en-US': 'Item'
	},
	'wishingItem': {
		vi: 'Vật phẩm Ước nguyện',
		'en-US': 'Wishing Items'
	},
	'title:pending': {
		vi: 'Cả hai bên phải đồng ý thì giao dịch sau đây mới có thể diễn ra!',
		'en-US': 'Both end must agree for the following trade to take place!'
	},
	'title:success': {
		vi: 'Trao đổi thành công!',
		'en-US': 'Trade has been successful!'
	},
	'title:failed': {
		vi: 'Trao đổi thất bại!',
		'en-US': 'Trade failed!'
	},
	'title:confirm': {
		vi: 'Đồng Ý',
		'en-US': 'Accept'
	},
	'title:cancel': {
		vi: 'Từ Chối',
		'en-US': 'Decline'
	},
	'description:pending': {
		vi: 'Vật phẩm đã được giao đến túi của người chơi.',
		'en-US': 'Items were sent to each player\'s bag!'
	},
	'description:success': {
		vi: 'Vật phẩm đã được giao đến túi của người chơi.',
		'en-US': 'Items were sent to each player\'s bag!'
	},
	'description:failed': {
		vi: 'Trao đổi thất bại. Hãy tạo lệnh trao đổi mới!',
		'en-US': 'Trade failed. Please create a new trade request!'
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
	'player:notfound': {
		vi: 'Không tìm thấy thông tin người chơi!',
		'en-US': 'Player data not found!'
	},
	'bag:notfounditem': {
		vi: 'Đã có lỗi xảy ra. Không thể lấy thông tin túi. Vui lòng thử lại hoặc liên hệ admin để hỗ trợ!',
		'en-US': 'Error occured. Cannot fetch your item information. Please contact admin for assistance!'
	},
	'bag:notenoughbag': {
		vi: 'Túi của bạn không có trang',
		'en-US': 'Your bag does not have page'
	},
	'bag:searchfound': {
		vi: 'tìm thấy ở trang',
		'en-US': 'is located in page'
	},
	'bag:searchnotfound': {
		vi: 'Không tìm thấy vật phẩm',
		'en-US': 'Cannot find item'
	},
	'buy:notregisterd': {
		vi: 'Sử dụng lệnh `/register` để tạo tài khoản mới. Nếu bạn đã tạo tài khoản mà gặp lỗi này, vui lòng liên hệ với admin để được hỗ trợ.',
		'en-US': 'Use command `/register` to create a new server account. If you already created a new server account but met this error. please contact admin to resolve the issue.'
	},
	'buy:moralimited': {
		vi: 'Bạn đã vượt quá giới hạn mua Mora trong tuần. Hãy thử lại vào tuần sau.',
		'en-US': 'You have reached your weekly Mora limit. Please try again next week.'
	},
	'buy:notenoughMora': {
		vi: 'Bạn không đủ Mora. Nếu bạn tin rằng đây là lỗi, vui lòng liên hệ với quản trị viên để giải quyết.',
		'en-US': 'You have insufficient to purchase. If you believe that this is a mistake, contact admin to resolve.'
	},
	'buy:notenoughPoint': {
		vi: 'Bạn không đủ điểm để đổi thưởng. Nếu bạn tin rằng đây là lỗi, vui lòng liên hệ với quản trị viên để giải quyết.',
		'en-US': 'You have insufficient points to trade. If you believe that this is a mistake, contact admin to resolve.'
	},
	'buy:confirmation': {
		vi: 'Bạn có xác nhận muốn mua vật phẩm này?',
		'en-US': 'Would you like to confirm buying following item?'
	},
	'buy:success': {
		vi: 'Vật phẩm thành công và đã được gửi vào mail tài khoản của bạn.',
		'en-US': 'Item buy successfully. Please check your email.'
	},
	'buy:error': {
		vi: 'Đã có lỗi xảy ra, vui lòng liên hệ admin hoặc supporter để được hỗ trợ. Thông tin lỗi: ',
		'en-US': 'There is an error occured. Please contact admin or supporter to resolve the issue. Error: '
	},
	'buy:cancel': {
		vi: 'Giao dịch đã được hủy.',
		'en-US': 'Cancelled transaction.'
	},
	'buy:timeout': {
		vi: 'Không có phản hồi trong vòng 1 phút. Giao dịch đã được hủy.',
		'en-US': 'Confirmation not received within 1 minute, trading cancelled.'
	},
	'buy:moraFooter': {
		vi: 'Để mua vật phẩm, sử dụng lệnh `buy mora <\/ID>` để giao dịch.',
		'en-US': 'To buy the item, use command `buy mora <\/ID>` to buy it.'
	}
}
