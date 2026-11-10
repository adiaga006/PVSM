import { createHash } from 'crypto';
import { guard } from '@/lib/auth';
import { getState } from '@/lib/state';

export const dynamic = 'force-dynamic';

/** Toàn bộ dữ liệu dự án + công nợ. Có ETag: dữ liệu không đổi thì trả 304 (không gửi lại). */
export async function GET(req) {
  const [me, err] = await guard(req);
  if (err) return err;
  const body = JSON.stringify(await getState(me));
  const etag = '"' + createHash('sha1').update(body).digest('base64url') + '"';
  const headers = { 'Cache-Control': 'private, no-cache', ETag: etag, 'Content-Type': 'application/json' };
  if (req.headers.get('if-none-match') === etag) return new Response(null, { status: 304, headers });
  return new Response(body, { headers });
}
