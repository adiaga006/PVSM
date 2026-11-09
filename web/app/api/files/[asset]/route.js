import { assetUrl } from '@/lib/sanity';
import { guard } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const INLINE = /^(image\/(png|jpeg|webp|gif)|application\/pdf)$/;

/**
 * Trả file chứng từ cho người đã đăng nhập. Server tự lấy từ Sanity, trình duyệt không biết URL gốc.
 * ?w=240 → ảnh thu nhỏ (Sanity tự resize + nén), dùng cho thumbnail.
 */
export async function GET(req, { params }) {
  const [, err] = await guard(req);
  if (err) return err;
  const { asset } = await params;
  let url = assetUrl(asset);
  if (!url) return new Response('Not found', { status: 404 });
  const w = Number(new URL(req.url).searchParams.get('w'));
  if (asset.startsWith('image-') && url.startsWith('https://') && w > 0 && w <= 2400) url += `?w=${Math.round(w)}&fit=max&auto=format&q=75`;
  const r = await fetch(url);
  if (!r.ok) return new Response('Not found', { status: 404 });
  const type = r.headers.get('content-type') || 'application/octet-stream';
  return new Response(r.body, {
    headers: {
      'Content-Type': type,
      // Chỉ ảnh/PDF được mở trực tiếp; loại khác (html, svg...) bắt buộc tải về để tránh chạy mã độc.
      'Content-Disposition': INLINE.test(type) ? 'inline' : 'attachment',
      // Asset id chứa mã băm nội dung → file không bao giờ đổi → cache lâu dài (chỉ trong trình duyệt người dùng).
      'Cache-Control': 'private, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
