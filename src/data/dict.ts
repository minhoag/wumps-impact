type Translate = {
	[key: string]: string;
}

export const Locale: {
	[key: string]: Translate;
} = {
	'item' : {
		vi: 'Vật phẩm',
		'en-US': 'Item',
	},
	'wishingItem' : {
		vi: 'Vật phẩm Ước nguyện',
		'en-US': 'Wishing Items',
	},
	'confirm': {
		vi: 'Xác nhận',
		'en-US': 'Confirm'
	},
	'cancel': {
		vi: 'Huỷ',
		'en-US': 'Cancel'
	},
	'total': {
		vi: 'Tổng cộng',
		'en-US': 'Total'
	},
	'quantity': {
		vi: 'Số lượng',
		'en-US': 'Quantity'
	},
	'description': {
		vi: 'Mô tả',
		'en-US': 'Description'
	},
	'registererror': {
		vi: 'Dùng lệnh /register để đăng ký tài khoản server mới. Nếu đăng ký rồi mà vẫn bị lỗi, thì nhắn admin để sửa nhé.',
		'en-US': 'Use command `/register` to create a new server account. If you already created a new server account but met this error. please contact admin to resolve the issue'
	},
	'generalerror': {
		vi: 'Đã có lỗi xảy ra. Không thể lấy thông tin túi. Vui lòng thử lại hoặc liên hệ admin để hỗ trợ!',
		'en-US': 'Error occured. Cannot fetch your item information. Please contact admin for assistance!'
	},
	'notresponse': {
		vi: 'Không có xác nhận trong vòng 1 phút, huỷ nhận lệnh.',
		'en-US': 'Confirmation not received within 1 minute, cancelling command.'
	},
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
	'trade:noitemlist': {
		vi: '*không có vật phẩm kèm*',
		'en-US': '*no item attached*'
	},
	'error:cancel': {
		vi: 'Huỷ',
		'en-US': 'Cancel'
	},
	'player:notfound': {
		vi: 'Không tìm thấy thông tin người chơi!',
		'en-US': 'Player data not found!'
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
	'buy:chooseshop': {
		vi: 'Chọn cửa hàng bạn muốn xem',
		'en-US': 'Choose the shop you want to view.'
	},
	'buy:instruction': {
		vi: 'Để mua vật phẩm, sử dụng lệnh `buy mora <\/ID>` để giao dịch',
		'en-US': 'To buy the item, use command `buy points <\/ID>` to buy it.'
	},
	'buy:howto': {
		vi: 'Xem và chọn cửa hàng bạn muốn sử dụng tiền của mình.\n\n' +
			'**Credits**: Kiếm được bằng cách quyên góp cho máy chủ (sắp có).\n' +
			'**Mora**: Đổi Mora trong game để mua các vật phẩm cao cấp.\n' +
			'**Interactive Coins**: Đổi điểm kiếm được khi chat trong máy chủ này để đổi lấy hàng hóa (sắp có).\n' +
			'\n**Cách mua**: Đăng ký tài khoản của bạn với lệnh `/register` và làm theo hướng dẫn. Việc này nhằm ngăn chặn việc sử dụng Mora từ tài khoản khác.\n' +
			'\n**Lưu ý**: Số luượng Mora có thể mất đến 1 phút để cập nhật. Nếu bạn thấy số Mora của mình sai, vui lòng thử lại sau 1 phút.\n',
		'en-US': 'View and choose the shop you want to spend your currency on.\n\n' +
			'**Credits**: Earned by donating to the server (coming soon).\n' +
			'**Mora**: Exchange in-game Mora to buy premium items.\n' +
			'**Interactive Coins**: Exchange points earned by chat in this server to exchange for goods (coming soon).\n' +
			'\n**How to buy**: Register your account with `/register` and follow the instruction. This is to prevent using other account Mora.\n' +
			'\n**Remarks**: Mora may take up to 1 minute to update. If you see that your Mora number is wrong. Please try again in 1 minute.\n'
	},
	'buy:unavailable': {
		vi: 'Shop tạm thời không khả dụng',
		'en-US': 'This shop is not yet available'
	},
	'buy:titleconfirmation': {
		vi: 'Xác nhận mua',
		'en-US': 'Pending Confirmation'
	},
	'buy:confirmation': {
		vi: 'Bạn có xác nhận muốn mua vật phẩm này?',
		'en-US': 'Would you like to confirm buying following item?'
	},
	'buy:insufficient': {
		vi: 'Tài khoản không đủ số dư. Nếu bạn tin rằng đây là lỗi, vui lòng liên hệ với quản trị viên để giải quyết.',
		'en-US': 'You have insufficient to purchase. If you believe that this is a mistake, contact admin to resolve.'
	},
	'buy:success': {
		vi: 'Vật phẩm thành công và đã được gửi vào thư tài khoản của bạn.',
		'en-US': 'Item buy successfully. Please check your email.'
	},
	'buy:cancel': {
		vi: 'Vật phẩm thành công và đã được gửi vào mail tài khoản của bạn.',
		'en-US': 'Item buy successfully. Please check your email.'
	}
}
