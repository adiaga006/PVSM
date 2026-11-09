import { db, key } from '@/lib/sanity';
import { guard } from '@/lib/auth';
import { cleanProject, cleanInstallment, pid, iid } from '@/lib/fields';

export const dynamic = 'force-dynamic';

/** Admin: thay toàn bộ dự án + công nợ bằng nội dung file sao lưu (file đính kèm đã được client upload trước). */
export async function POST(req) {
  const [me, err] = await guard(req, ['admin']);
  if (err) return err;
  const b = await req.json().catch(() => null);
  if (!b || !Array.isArray(b.PR)) return Response.json({ error: 'File sao lưu không hợp lệ' }, { status: 400 });
  let P, I;
  try { P = b.PR.map(cleanProject); I = (b.IN || []).map(cleanInstallment); }
  catch (e) { return Response.json({ error: e.message }, { status: 400 }); }

  const tx = db().transaction().delete({ query: '*[_type in ["project","installment"]]' });
  P.forEach(d => tx.create({ _id: pid(d.id), _type: 'project', ...d }));
  I.forEach(d => tx.create({ _id: iid(d.id), _type: 'installment', ...d }));
  if (Number(b.rate) > 0) tx.createIfNotExists({ _id: 'settings', _type: 'settings' }).patch('settings', { set: { rate: Number(b.rate) } });
  const id = 'auditlog-' + new Date().toISOString().slice(0, 7);
  tx.createIfNotExists({ _id: id, _type: 'auditLog', entries: [] })
    .patch(id, { setIfMissing: { entries: [] } })
    .patch(id, { insert: { after: 'entries[-1]', items: [{ _key: key(), ts: new Date().toISOString(), user: me.name || me.username, username: me.username, role: me.role, act: 'lg_bk', args: [String(P.length)] }] } });
  await tx.commit({ visibility: 'sync' });
  return Response.json({ ok: true, projects: P.length, installments: I.length });
}
