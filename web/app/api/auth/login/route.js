import bcrypt from 'bcryptjs';
import { db } from '@/lib/sanity';
import { createSession, sameOrigin, normUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';
const DUMMY = bcrypt.hashSync('not-a-real-password', 10);
const MAX_FAIL = 5, LOCK_MIN = 15;

/**
 * Tài khoản Admin đầu tiên: ADMIN_NAME (tên đăng nhập) + ADMIN_PASSWORD_HASH (mã băm bcrypt, mã hóa base64).
 * .env chỉ chứa mã băm, không chứa mật khẩu gốc. Tài khoản chỉ được tạo khi tên đó CHƯA có trong Sanity;
 * sau khi người dùng đổi mật khẩu, mã băm trong .env không còn tác dụng.
 */
async function bootstrapAdmin(username, pw) {
  const an = normUser(process.env.ADMIN_NAME), enc = process.env.ADMIN_PASSWORD_HASH || '';
  if (!an || !enc || username !== an) return null;
  const hash = Buffer.from(enc, 'base64').toString('utf8');
  if (!/^\$2[aby]\$\d{2}\$/.test(hash) || !(await bcrypt.compare(pw, hash))) return null;
  return db().createIfNotExists({
    _id: 'user-admin-bootstrap', _type: 'appUser', username: an, name: process.env.ADMIN_NAME.trim(), role: 'admin',
    active: true, mustChange: true, sessionVer: 0, passwordHash: hash,
  });
}

export async function POST(req) {
  if (!(await sameOrigin())) return Response.json({ error: 'Bad origin' }, { status: 403 });
  const { username, password } = await req.json().catch(() => ({}));
  const un = normUser(username), pw = String(password || '');
  const fail = () => Response.json({ error: 'Sai tên đăng nhập hoặc mật khẩu' }, { status: 401 });
  if (!un || !pw) return fail();

  let u = await db().fetch(`*[_type=="appUser" && username==$un][0]`, { un });
  if (!u) {
    u = await bootstrapAdmin(un, pw);
    if (u) { await createSession(u); return Response.json({ ok: true }); }
  }
  if (!u || !u.active) { await bcrypt.compare(pw, DUMMY); return fail(); }
  if (u.lockUntil && new Date(u.lockUntil) > new Date())
    return Response.json({ error: `Tài khoản tạm khóa do nhập sai nhiều lần. Thử lại sau ${LOCK_MIN} phút.` }, { status: 429 });

  if (!(await bcrypt.compare(pw, u.passwordHash || DUMMY))) {
    const n = (u.failCount || 0) + 1;
    await db().patch(u._id)
      .set(n >= MAX_FAIL ? { failCount: 0, lockUntil: new Date(Date.now() + LOCK_MIN * 60e3).toISOString() } : { failCount: n })
      .commit();
    return fail();
  }
  await db().patch(u._id).set({ failCount: 0, lastLogin: new Date().toISOString() }).unset(['lockUntil']).commit();
  await createSession(u);
  return Response.json({ ok: true });
}
