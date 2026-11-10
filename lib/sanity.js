import { createClient } from '@sanity/client';

let client;
/** Sanity client chỉ dùng phía server (token Editor không bao giờ gửi ra trình duyệt). */
export function db() {
  if (!client) {
    const { SANITY_PROJECT_ID, SANITY_DATASET, SANITY_API_TOKEN } = process.env;
    if (!SANITY_PROJECT_ID || !SANITY_API_TOKEN) throw new Error('Thiếu SANITY_PROJECT_ID hoặc SANITY_API_TOKEN');
    client = createClient({
      projectId: SANITY_PROJECT_ID,
      dataset: SANITY_DATASET || 'production',
      apiVersion: '2025-01-01',
      token: SANITY_API_TOKEN,
      useCdn: false,
      perspective: 'published',
    });
  }
  return client;
}

export const key = () => Math.random().toString(36).slice(2, 12);

/** Đổi asset id của Sanity thành URL gốc trên CDN (chỉ server biết URL này). */
export function assetUrl(id) {
  const pid = process.env.SANITY_PROJECT_ID, ds = process.env.SANITY_DATASET || 'production';
  let m = /^image-([a-f0-9]+)-(\d+x\d+)-([a-z0-9]+)$/.exec(id);
  if (m) return `https://cdn.sanity.io/images/${pid}/${ds}/${m[1]}-${m[2]}.${m[3]}`;
  m = /^file-([a-f0-9]+)-([a-z0-9]+)$/.exec(id);
  if (m) return `https://cdn.sanity.io/files/${pid}/${ds}/${m[1]}.${m[2]}`;
  return null;
}
