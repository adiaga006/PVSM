import { db } from '@/lib/sanity';
import { guard } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const strip = ({ _id, _type, _createdAt, _updatedAt, ...rest }) => rest;

/** Toàn bộ dữ liệu app cần sau khi đăng nhập. */
export async function GET(req) {
  const [me, err] = await guard(req);
  if (err) return err;
  const r = await db().fetch(`{
    "PR": *[_type=="project"],
    "IN": *[_type=="installment"],
    "rate": *[_id=="settings"][0].rate,
    "LOG": *[_type=="auditLog"] | order(_id desc)[0...3].entries
  }`);
  const LOG = (r.LOG || []).flat().filter(Boolean).sort((a, b) => (b.ts || '').localeCompare(a.ts || '')).slice(0, 500);
  return Response.json({
    me: { name: me.name || me.username, username: me.username, role: me.role, mustChange: !!me.mustChange },
    PR: r.PR.map(strip),
    IN: r.IN.map(strip),
    rate: r.rate || 26000,
    LOG,
  }, { headers: { 'Cache-Control': 'no-store' } });
}
