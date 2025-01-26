export type ShopItem = {
  index: number;
  itemId: number;
  name: Record<string, string>;
  type: 'mora' | 'credit' | 'points';
  price: number;
  quantity: number;
  image: string;
  description: Record<string, string>;
};
export const ShopView: ShopItem[] = [
  {
    index: 200001,
    itemId: 107009,
    name: {
      'en-US': 'Fragile Resin',
      vi: 'Nhựa Dễ Vỡ',
    },
    type: 'points',
    price: 1000,
    quantity: 1,
    image: '<:FragileResin:1257820100325539861>',
    description: {
      'en-US': 'An item used to restore Original Resin by 60 points',
      vi: 'Vật phẩm được sử dụng để hồi phục 60 điểm Nhựa Nguyên Chất.',
    },
  },
  {
    index: 200002,
    itemId: 223,
    name: {
      'en-US': 'Intertwined Fate',
      vi: 'Mối Duyên Vương Vấn',
    },
    type: 'points',
    price: 5_000,
    quantity: 1,
    image: '<:IntertwinedFate:1184076475813597187>',
    description: {
      'en-US': 'Intertwined Fate can be used for Event Wishes.',
      vi: 'Mối Duyên Tương Ngộ sử dụng trong Sự kiện Ước nguyện giới hạn.',
    },
  },
  {
    index: 202001,
    itemId: 107009,
    name: {
      'en-US': 'Fragile Resin',
      vi: 'Nhựa Dễ Vỡ',
    },
    type: 'mora',
    price: 10_000_000,
    quantity: 1,
    image: '<:FragileResin:1257820100325539861>',
    description: {
      'en-US': 'An item used to restore Original Resin by 60 points',
      vi: 'Vật phẩm được sử dụng để hồi phục 60 điểm Nhựa Nguyên Chất.',
    },
  },
  {
    index: 202002,
    itemId: 104319,
    name: {
      'en-US': 'Crown of Insight',
      vi: 'Vương Miện tri thức',
    },
    type: 'mora',
    price: 500_000_000,
    quantity: 1,
    image: '<:CrownofInsight:1262128515533508671>',
    description: {
      'en-US':
        'Character Talent Material used when leveling Combat Talents.',
      vi: 'Vật liệu Thiên Phú Nhân Vật được sử dụng khi nâng cấp Thiên Phú Chiến Đấu.',
    },
  },
  {
    index: 202003,
    itemId: 223,
    name: {
      'en-US': 'Intertwined Fate',
      vi: 'Mối Duyên Vương Vấn',
    },
    type: 'mora',
    price: 5_000_000,
    quantity: 1,
    image: '<:IntertwinedFate:1184076475813597187>',
    description: {
      'en-US': 'Intertwined Fate can be used for Event Wishes.',
      vi: 'Mối Duyên Tương Ngộ sử dụng trong Sự kiện Ước nguyện giới hạn.',
    },
  },
  {
    index: 202004,
    itemId: 224,
    name: {
      'en-US': 'Acquaint Fate',
      vi: 'Mối Duyên Tương Ngộ',
    },
    type: 'mora',
    price: 5_000_000,
    quantity: 1,
    image: '<:AcquaintFate:1184076479324229652>',
    description: {
      'en-US':
        "Acquaint Fate can be used for Standard Wishes and Beginners' Wish.",
      vi: 'Mối Duyên Vương sử dụng trong Ước nguyện Tiêu Chuẩn và Ước Nguyện người chơi mới.',
    },
  },
  {
    index: 202005,
    itemId: 115024,
    name: {
      'en-US': 'Material Share Bundle',
      vi: 'Gói Chia Sẻ Tài Nguyên',
    },
    type: 'mora',
    price: 5_000_000,
    quantity: 5,
    image: '<:MaterialBundle:1263397840164487289>',
    description: {
      'en-US':
        'The Guild will routinely give out materials of excellent quality, some of which possess limitless potential.',
      vi: 'Một số nguyên liệu tốt được hiệp hội chia sẻ thường xuyên, một số trong số đó có tiềm năng vô hạn.',
    },
  },
  {
    index: 202006,
    itemId: 117011,
    name: {
      'en-US': 'Domain Reliquary: Type 1',
      vi: 'Hộp Thánh Vật Thần Bí: Loại 1',
    },
    type: 'mora',
    price: 50_000_000,
    quantity: 1,
    image: '<:DomainReliquary:1263401902247247962>',
    description: {
      'en-US':
        'The Reliquary Box contains either **Desert Pavilion Chronicle** or **Lost Prayer to the Sacred Winds**.',
      vi: 'Hộp Thánh Dị Vật có chứa 1 mảnh **Sử Ký Đình Đài Cát** hoặc **Đoá Hoa Trang Viên Thất Lạc**.',
    },
  },
  {
    index: 202007,
    itemId: 117009,
    name: {
      'en-US': 'Domain Reliquary: Type 2',
      vi: 'Hộp Thánh Vật Thần Bí: Loại 2',
    },
    type: 'mora',
    price: 50_000_000,
    quantity: 1,
    image: '<:DomainReliquary:1263401902247247962>',
    description: {
      'en-US':
        'The Reliquary Box contains either **Deepwood Memory** or **Gilded Dream**.',
      vi: 'Hộp Thánh Dị Vật có chứa 1 mảnh **Ký Ức Rừng Sâu** hoặc **Giấc Mộng Hoàng Kim**.',
    },
  },
];
