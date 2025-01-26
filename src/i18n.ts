export type Translate = {
  [key: string]: string;
};

export const Localizaion: {
  [key: string]: Translate;
} = {
  /**
   *
   * Error
   *
   * **/
  'error:unknown': {
    vi: '🚨 Lỗi không xác định',
    'en-US': '🚨 Unknown Error',
  },
  'error:known': {
    vi: '🚨 Đã có lỗi xảy ra',
    'en-US': '🚨 An error has occurred',
  },
  'error:detail': {
    vi: '**Thông tin lỗi:**',
    'en-US': '**Error Detail:**',
  },
  'error:persist': {
    vi: '🚨 Lỗi không thể xử lý được',
    'en-US': '🚨 Error cannot be processed',
  },
  'error:contact': {
    vi: 'Liên hệ với quản trị viên để được hỗ trợ',
    'en-US': 'Contact admin for support',
  },
  'error:user:notfound': {
    vi: '🚨 Người chơi không tồn tại trong hệ thống. Vui lòng đăng ký bằng lệnh `/register`.',
    'en-US':
      '🚨 User not found in the system. Please register with `/register` command.',
  },
  /**
   *
   * Slash Command: Verify-Send
   *
   * **/
  'bag:view:notfound': {
    vi: 'Không tìm thấy người chơi mà bạn chọn.',
    'en-US': 'User not found.',
  },
  /**
   *
   * Slash Command: Event
   *
   * **/
  'event:success': {
    vi: 'Thành công thêm sự kiện vào server!',
    'en-US': 'Data not found',
  },
  'event:begin:description': {
    vi: 'Thời gian bắt đầu sự kiện.',
    'en-US': 'Time to start event.',
  },
  'event:end:description': {
    vi: 'Thời gian kéo dài sự kiện. Mặc định: 2 tuần.',
    'en-US': 'Duration of event. Default: 2 weeks.',
  },
  'event:notfound': {
    vi: 'Không tìm thấy dữ liệu',
    'en-US': 'Data not found',
  },
  /**
   *
   * Slash Command: Verify-Send
   *
   * **/
  'verify-send:send': {
    vi: 'Mã xác minh đã được gửi đến email trong game. Vui lòng lấy mã và sử dụng lệnh `/register` và nhập mã.',
    'en-US':
      'Verification code has been sent to your in-game email. Please get the code and use command `/register` and enter the code.',
  },
  'verify-send:already': {
    vi: 'Tài khoản của bạn đã tồn tại trong hệ thống.',
    'en-US': 'Your account is already exist in the database.',
  },
  'verify-send:title': {
    vi: 'Mã xác minh',
    'en-US': 'Verification Code',
  },
  'verify-send:right-code': {
    vi: 'Xác minh thành công. Bạn đã được cấp quyền truy cập mọi tính năng của server.',
    'en-US':
      'Verification completed. You have been granted access to all server features.',
  },
  'verify-send:wrong-code': {
    vi: 'Mã xác minh không chính xác.',
    'en-US': 'Verification Code is incorrect.',
  },
  'verify-send:expired': {
    vi: 'Mã xác minh hết hạn.',
    'en-US': 'Your verification code has expired.',
  },
  'admin:give:success': {
    vi: 'Gửi item cho người chơi thành công uid: ',
    'en-US': 'Successfully send item to player with uid: ',
  },
  'admin:delete:success': {
    vi: 'Xóa item của người chơi thành công uid: ',
    'en-US': 'Delete item from user with with uid: ',
  },
  'admin:give:error': {
    vi: 'Có lỗi khi thêm item của người chơi uid: ',
    'en-US': 'There is an error when add item to user with with uid: ',
  },
  'admin:delete:error': {
    vi: 'Có lỗi khi xóa item của người chơi uid: ',
    'en-US': 'There is an error when delete item from user with with uid: ',
  },
  'shop:view:unit': {
    vi: 'cái',
    'en-US': 'unit',
  },
  'shop:view:quantity:lt0': {
    vi: 'Vui lòng nhập số lượng lớn hơn 0.',
    'en-US': 'Please enter a quantity greater than 0.',
  },
  'shop:view:quantity:gt15': {
    vi: 'Số lượng mua không được vượt quá 15.',
    'en-US': 'The quantity of purchase must not exceed 15.',
  },
  'shop:view:select': {
    vi: 'Chọn một item để mua',
    'en-US': 'Select an item to buy',
  },
  'shop:view:thankyou:title': {
    vi: 'Cảm ơn bạn đã mua hàng!',
    'en-US': 'Thank you for purchasing!',
  },
  'shop:view:thankyou:content': {
    vi: 'Cảm ơn bạn đã mua một món hàng từ cửa hàng của Paimon!',
    'en-US': 'Thank you so much for purchasing an item from Paimon\'s shop!',
  },
};
