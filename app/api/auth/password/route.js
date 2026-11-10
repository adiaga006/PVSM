import bcrypt from 'bcryptjs';
import { db } from '@/lib/sanity';
import { createSession, currentUser, sameOrigin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** Người dùng tự đổi mật khẩu (kể cả khi bị bắt buộc đổi lần đầu). */
export async function POST(req) {
  if (!(await sameOrigin())) return Response.json({ error: 'Bad origin' }, { status: 403 });
  const me = await currentUser();
  if (!me) return Response.json({ error: 'Phiên đăng nhập đã hết hạn' }, { status: 401 });
  const { oldPassword, newPassword } = await req.json().catch(() => ({}));
  const np = String(newPassword || '');
  if (np.length < 8) return Response.json({ error: 'Mật khẩu mới phải có ít nhất 8 ký tự' }, { status: 400 });
  const u = await db().getDocument(me._id);
  if (!(await bcrypt.compare(String(oldPassword || ''), u.passwordHash || '')))
    return Response.json({ error: 'Mật khẩu hiện tại không đúng' }, { status: 400 });
  const ver = (u.sessionVer || 0) + 1;
  await db().patch(u._id).set({ passwordHash: await bcrypt.hash(np, 10), mustChange: false, sessionVer: ver }).commit();
  await createSession({ ...u, sessionVer: ver });
  return Response.json({ ok: true });
}
