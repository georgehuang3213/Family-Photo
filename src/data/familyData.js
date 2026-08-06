export const INITIAL_FAMILY_MEMBERS = [
  { id: 'm1', name: '爺爺', role: '家族長老', avatar: '👴', color: '#f59e0b' },
  { id: 'm2', name: '媽媽', role: '相簿管理員', avatar: '👩', color: '#ec4899' },
  { id: 'm3', name: '爸爸', role: '攝影大師', avatar: '👨', color: '#3b82f6' },
  { id: 'm4', name: '小明 (我)', role: '系統管理', avatar: '🧑‍💻', color: '#6366f1' },
  { id: 'm5', name: '妹妹', role: '美麗模特', avatar: '👧', color: '#8b5cf6' },
  { id: 'm6', name: '小姨', role: '活動紀錄', avatar: '👩‍🦱', color: '#10b981' }
];

export const INITIAL_ALBUMS = [
  {
    id: 'alb-1',
    title: '🎂 爺爺 80 大壽慶祝熱鬧晚宴',
    category: '家族慶典',
    date: '2026-06-18',
    coverImage: '/demo_photos/birthday.jpg',
    photoCount: 42,
    location: '台北大飯店 典雅包廂',
    description: '四代同堂齊聚一堂，祝爺爺福如東海，壽比南山！',
    members: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6']
  },
  {
    id: 'alb-2',
    title: '🏖️ 沖繩海濱夏日家族度假',
    category: '海外旅遊',
    date: '2026-07-12',
    coverImage: '/demo_photos/vacation.jpg',
    photoCount: 128,
    location: '日本沖繩 萬座毛',
    description: '藍天碧海，享受海風與海鮮大餐的悠閒假日時光。',
    members: ['m1', 'm2', 'm3', 'm4', 'm5']
  },
  {
    id: 'alb-3',
    title: '⛺ 阿里山星空露營與營火晚會',
    category: '戶外探險',
    date: '2026-05-02',
    coverImage: '/demo_photos/camping.jpg',
    photoCount: 65,
    location: '嘉義阿里山 露營區',
    description: '營火旁烤棉花糖、看滿天繁星與日出雲海。',
    members: ['m2', 'm3', 'm4', 'm5']
  }
];

export const INITIAL_PHOTOS = [
  {
    id: 'photo-1',
    title: '80大壽溫馨切蛋糕時刻',
    albumId: 'alb-1',
    url: '/demo_photos/birthday.jpg',
    date: '2026-06-18 19:30',
    location: '台北大飯店',
    uploader: 'm3', // 爸爸
    members: ['m1', 'm2', 'm3', 'm4', 'm5', 'm6'],
    likes: 18,
    isFavorite: true,
    tags: ['壽宴', '蛋糕', '合照', '溫馨'],
    exif: {
      camera: 'Sony A7 IV',
      lens: '35mm F1.4 GM',
      iso: '400',
      fstop: 'f/2.0',
      shutter: '1/160s',
      resolution: '4000 x 3000'
    },
    comments: [
      { id: 'c1', memberId: 'm2', text: '這張大合照表情大家都拍得好自然耶！', time: '10 mins ago' },
      { id: 'c2', memberId: 'm1', text: '謝謝孩子們幫我過這個生日，很開心！', time: '5 mins ago' }
    ]
  },
  {
    id: 'photo-2',
    title: '沖繩翡翠海灘家族合影',
    albumId: 'alb-2',
    url: '/demo_photos/vacation.jpg',
    date: '2026-07-12 15:20',
    location: '沖繩古宇利島 Beach',
    uploader: 'm4', // 小明
    members: ['m1', 'm2', 'm3', 'm4', 'm5'],
    likes: 24,
    isFavorite: true,
    tags: ['沖繩', '海灘', '藍天', '度假'],
    exif: {
      camera: 'iPhone 15 Pro Max',
      lens: '24mm eq. f/1.78',
      iso: '50',
      fstop: 'f/1.8',
      shutter: '1/2500s',
      resolution: '4032 x 3024'
    },
    comments: [
      { id: 'c3', memberId: 'm5', text: '陽光超好！照片完全不用套濾鏡就很美', time: '1 hour ago' }
    ]
  },
  {
    id: 'photo-3',
    title: '阿里山營火晚會與星空下',
    albumId: 'alb-3',
    url: '/demo_photos/camping.jpg',
    date: '2026-05-02 21:15',
    location: '阿里山星空營地',
    uploader: 'm2', // 媽媽
    members: ['m2', 'm3', 'm4', 'm5'],
    likes: 15,
    isFavorite: false,
    tags: ['露營', '星空', '營火', '溫馨夜'],
    exif: {
      camera: 'Fujifilm X-T5',
      lens: '16-55mm F2.8',
      iso: '3200',
      fstop: 'f/2.8',
      shutter: '1/15s',
      resolution: '4000 x 3000'
    },
    comments: [
      { id: 'c4', memberId: 'm3', text: '那天晚上的烤棉花糖真的超好吃！', time: 'Yesterday' }
    ]
  }
];

export const INITIAL_STORAGE_CONFIG = {
  provider: 'Google AI Pro (Google One)',
  planName: 'Google One AI Premium (2TB)',
  connectedEmail: 'family.hub.cloud@gmail.com',
  usedGB: 428.5,
  totalGB: 2048,
  autoBackupMobile: true,
  rawStorageEnabled: true,
  familyMembersSharedCount: 6
};
