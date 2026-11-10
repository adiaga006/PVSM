import { db, key } from '@/lib/sanity';
import { guard } from '@/lib/auth';
import { cleanProject, cleanInstallment, pid, iid } from '@/lib/fields';

export const dynamic = 'force-dynamic';
const CAN_P = ['sales', 'admin'], CAN_D = ['acct', 'admin'];
const bad = (error, status = 400) => Response.json({ error }, { status });

/**
 * Nhận các thay đổi từ client trong một giao dịch:
 * { projects, installments, delProjects, delInstallments, rate, logs }
 * Bản ghi đã có gửi kèm _rev → nếu người khác vừa sửa, trả 409 (không ghi đè lẫn nhau).
 */
export async function POST(req) {
  const [me, err] = await guard(req);
  if (err) return err;
  const b = await req.json().catch(() => null);
  if (!b) return bad('Body không hợp lệ');
  const projects = b.projects || [], installments = b.installments || [];
  const delP = b.delProjects || [], delI = b.delInstallments || [];

  if (projects.length && !CAN_P.includes(me.role)) return bad('Vai trò của bạn không được sửa dự án', 403);
  if ((installments.length || delI.length) && !CAN_D.includes(me.role)) return bad('Vai trò của bạn không được sửa công nợ', 403);
  if ((delP.length || b.rate !== undefined) && me.role !== 'admin') return bad('Chỉ Admin được xóa vĩnh viễn dự án / đổi tỷ giá', 403);

  let P, I;
  try { P = projects.map(p => [cleanProject(p), p._rev]); I = installments.map(i => [cleanInstallment(i), i._rev]); }
  catch (e) { return bad(e.message); }

  // Tránh trùng mã dự án khi nhiều người tạo cùng lúc.
  const codes = {};
  const fresh = P.filter(([, rev]) => !rev).map(([d]) => d);
  if (fresh.length) {
    const used = new Set(await db().fetch(`*[_type=="project" && !(_id in $ids)].code`, { ids: fresh.map(d => pid(d.id)) }));
    for (const d of fresh) {
      if (used.has(d.code)) {
        const y = String(d.code).split('-')[1] || new Date().getFullYear();
        let n = 1;
        while (used.has(`PVSM-${y}-${String(n).padStart(3, '0')}`)) n++;
        d.code = codes[d.id] = `PVSM-${y}-${String(n).padStart(3, '0')}`;
      }
      used.add(d.code);
    }
  }

  const tx = db().transaction();
  for (const [d, rev] of P) rev ? tx.patch(pid(d.id), { ifRevisionID: rev, set: d }) : tx.create({ _id: pid(d.id), _type: 'project', ...d });
  for (const [d, rev] of I) rev ? tx.patch(iid(d.id), { ifRevisionID: rev, set: d }) : tx.create({ _id: iid(d.id), _type: 'installment', ...d });
  delP.forEach(id => tx.delete(pid(Number(id))));
  delI.forEach(id => tx.delete(iid(Number(id))));
  if (b.rate !== undefined) {
    const r = Number(b.rate);
    if (!(r > 0)) return bad('Tỷ giá không hợp lệ');
    tx.createIfNotExists({ _id: 'settings', _type: 'settings' }).patch('settings', { set: { rate: r } });
  }
  const logs = (b.logs || []).slice(0, 200).map(l => ({
    _key: key(), ts: new Date().toISOString(), user: me.name || me.username, username: me.username, role: me.role,
    act: String(l.act || '').slice(0, 40), args: (l.args || []).map(a => String(a).slice(0, 400)).slice(0, 5),
  }));
  if (logs.length) {
    const id = 'auditlog-' + new Date().toISOString().slice(0, 7);
    tx.createIfNotExists({ _id: id, _type: 'auditLog', entries: [] })
      .patch(id, { setIfMissing: { entries: [] } })
      .patch(id, { insert: { after: 'entries[-1]', items: logs } });
  }

  try {
    const res = await tx.commit({ visibility: 'sync' });
    return Response.json({ ok: true, rev: res.transactionId, codes, logs });
  } catch (e) {
    if (e.statusCode === 409) return bad('Dữ liệu vừa được người khác cập nhật. Đã tải lại bản mới nhất, vui lòng thao tác lại.', 409);
    console.error(e);
    return bad('Lỗi lưu dữ liệu: ' + (e.message || e), 500);
  }
}
