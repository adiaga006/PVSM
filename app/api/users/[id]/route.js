import bcrypt from 'bcryptjs';
import { db } from '@/lib/sanity';
import { guard, ROLES } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Admin đổi vai trò, khóa/mở khóa, đặt lại mật khẩu tạm. */
export async function PATCH(req, { params }) {
  const [me, err] = await guard(req, ['admin']);
  if (err) return err;
  const { id } = await params;
  const u = await db().getDocument(id);
  if (!u || u._type !== 'appUser') return Response.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
  const b = await req.json().catch(() => ({}));
  const set = {};
  let bump = false;
  if (b.role !== undefined) {
    if (!ROLES.includes(b.role)) return Response.json({ error: 'Vai trò không hợp lệ' }, { status: 400 });
    if (u._id === me._id && b.role !== 'admin') return Response.json({ error: 'Không thể tự bỏ quyền Admin của chính mình' }, { status: 400 });
    set.role = b.role;
  }
  if (b.active !== undefined) {
    if (u._id === me._id && !b.active) return Response.json({ error: 'Không thể tự khóa tài khoản của chính mình' }, { status: 400 });
    set.active = !!b.active; bump = true;
  }
  if (b.password !== undefined) {
    if (String(b.password).length < 8) return Response.json({ error: 'Mật khẩu tạm phải có ít nhất 8 ký tự' }, { status: 400 });
    Object.assign(set, { passwordHash: await bcrypt.hash(String(b.password), 10), mustChange: true, failCount: 0 });
    bump = true;
  }
  if (bump) set.sessionVer = (u.sessionVer || 0) + 1; // đăng xuất người đó khỏi mọi thiết bị
  await db().patch(id).set(set).unset(b.password !== undefined ? ['lockUntil'] : []).commit();
  return Response.json({ ok: true });
}
