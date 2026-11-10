import { db } from '@/lib/sanity';
import { guard } from '@/lib/auth';

export const dynamic = 'force-dynamic';
// Vercel giới hạn body ~4,5 MB cho mỗi request.
const MAX = 4.4 * 1024 * 1024;

/** Upload ảnh/PDF chứng từ lên Sanity. Trả về asset id; URL gốc không gửi ra trình duyệt. */
export async function POST(req) {
  const [, err] = await guard(req, ['sales', 'admin']);
  if (err) return err;
  const fd = await req.formData().catch(() => null);
  const f = fd?.get('file');
  if (!f || typeof f === 'string') return Response.json({ error: 'Không có file' }, { status: 400 });
  if (f.size > MAX) return Response.json({ error: 'File vượt quá 4,4 MB' }, { status: 413 });
  const isImg = /^image\/(png|jpeg|webp|gif)$/.test(f.type);
  const asset = await db().assets.upload(isImg ? 'image' : 'file', Buffer.from(await f.arrayBuffer()), {
    filename: f.name || 'upload', contentType: f.type || 'application/octet-stream',
  });
  return Response.json({ asset: asset._id });
}
