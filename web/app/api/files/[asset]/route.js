import { assetUrl } from '@/lib/sanity';
import { guard } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const INLINE = /^(image\/(png|jpeg|webp|gif)|application\/pdf)$/;

/** Trả file chứng từ cho người đã đăng nhập. Server tự lấy từ Sanity, trình duyệt không biết URL gốc. */
export async function GET(req, { params }) {
  const [, err] = await guard(req);
  if (err) return err;
  const { asset } = await params;
  const url = assetUrl(asset);
  if (!url) return new Response('Not found', { status: 404 });
  const r = await fetch(url);
  if (!r.ok) return new Response('Not found', { status: 404 });
  const type = r.headers.get('content-type') || 'application/octet-stream';
  return new Response(r.body, {
    headers: {
      'Content-Type': type,
      // Chỉ ảnh/PDF được mở trực tiếp; loại khác (html, svg...) bắt buộc tải về để tránh chạy mã độc.
      'Content-Disposition': INLINE.test(type) ? 'inline' : 'attachment',
      'Cache-Control': 'private, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
