import { SignJWT, jwtVerify } from 'jose';
import { cookies, headers } from 'next/headers';
import { db } from './sanity';

const COOKIE = 'pvsm_session';
export const ROLES = ['sales', 'acct', 'admin'];
/** Tên đăng nhập không phân biệt hoa/thường và khoảng trắng hai đầu. */
export const normUser = s => String(s || '').trim().toLowerCase();
export const validUser = s => /^[a-z0-9._@-]{3,40}$/.test(s);

function secret() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error('AUTH_SECRET chưa đặt hoặc ngắn hơn 32 ký tự');
  return new TextEncoder().encode(s);
}

export async function createSession(user) {
  const token = await new SignJWT({ ver: user.sessionVer || 0 })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user._id)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 86400,
  });
}

export async function clearSession() {
  (await cookies()).delete(COOKIE);
}

/** Người dùng hiện tại, hoặc null. Kiểm tra lại trong Sanity mỗi lần gọi để khóa/đổi quyền có hiệu lực ngay. */
export async function currentUser() {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  let payload;
  try {
    ({ payload } = await jwtVerify(token, secret()));
  } catch {
    return null;
  }
  const u = await db().fetch(
    `*[_type=="appUser" && _id==$id][0]{_id,username,name,role,active,sessionVer,mustChange}`,
    { id: payload.sub }
  );
  if (!u || !u.active || (u.sessionVer || 0) !== (payload.ver || 0)) return null;
  return u;
}

const json = (o, status = 200) => Response.json(o, { status });

/** Chặn request ghi đến từ trang web khác (chống CSRF). */
export async function sameOrigin() {
  const h = await headers();
  const origin = h.get('origin');
  if (!origin) return true;
  try { return new URL(origin).host === h.get('host'); } catch { return false; }
}

/**
 * Dùng trong API route: trả [user, null] hoặc [null, Response lỗi].
 * roles: danh sách vai trò được phép (bỏ trống = mọi người đã đăng nhập).
 * Người phải đổi mật khẩu chỉ được đọc (GET) cho tới khi đổi xong.
 */
export async function guard(req, roles) {
  const write = req.method !== 'GET';
  if (write && !(await sameOrigin())) return [null, json({ error: 'Bad origin' }, 403)];
  const u = await currentUser();
  if (!u) return [null, json({ error: 'Phiên đăng nhập đã hết hạn' }, 401)];
  if (write && u.mustChange) return [null, json({ error: 'Cần đổi mật khẩu trước' }, 403)];
  if (roles && !roles.includes(u.role)) return [null, json({ error: 'Vai trò của bạn không có quyền này' }, 403)];
  return [u, null];
}
