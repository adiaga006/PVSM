import { guard } from '@/lib/auth';
import { getLogs } from '@/lib/state';

export const dynamic = 'force-dynamic';

/** Audit log — chỉ Admin. */
export async function GET(req) {
  const [, err] = await guard(req, ['admin']);
  if (err) return err;
  return Response.json({ LOG: await getLogs() }, { headers: { 'Cache-Control': 'private, no-store' } });
}
