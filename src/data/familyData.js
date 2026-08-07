export const INITIAL_FAMILY_MEMBERS = [];

export const INITIAL_ALBUMS = [
  {
    id: 'alb-celebration',
    title: '🎉 家族慶典與聚會',
    category: '家族慶典',
    description: '記錄過年聚餐、節日慶祝與特別大壽時刻',
    location: '溫馨時光',
    date: '2026-01-01',
    coverImage: null
  },
  {
    id: 'alb-travel',
    title: '🏖️ 家族旅遊度假',
    category: '旅遊度假',
    description: '一起踏青出遊與國內外度假旅行集錦',
    location: '各地景點',
    date: '2026-01-01',
    coverImage: null
  }
];

export const INITIAL_PHOTOS = [];

export const INITIAL_STORAGE_CONFIG = {
  provider: 'Cloudflare R2 Object Storage',
  planName: 'Cloudflare R2 (100% 無損實體儲存)',
  connectedEmail: 'family.hub.cloud@gmail.com',
  bucketName: 'family-photo',
  totalGB: 10,
  autoBackupMobile: true,
  rawStorageEnabled: true,
  familyMembersSharedCount: 6
};
