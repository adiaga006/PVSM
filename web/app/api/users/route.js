import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { db } from '@/lib/sanity';
import { guard, ROLES, normUser, validUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  const [, err] = await guard(req, ['admin']);
  if (err) return err;
  const users = await db().fetch(`*[_type=="appUser"] | order(name asc){_id,username,name,role,active,mustChange,lastLogin}`);
  return Response.json({ users });
}

/** Admin tạo tài khoản. Người dùng phải đổi mật khẩu ở lần đăng nhập đầu. */
export async function POST(req) {
  const [, err] = await guard(req, ['admin']);
  if (err) return err;
  const { username, name, role, password } = await req.json().catch(() => ({}));
  const un = normUser(username);
  if (!validUser(un)) return Response.json({ error: 'Tên đăng nhập 3–40 ký tự, chỉ gồm chữ không dấu, số và . _ - @' }, { status: 400 });
  if (!ROLES.includes(role)) return Response.json({ error: 'Vai trò không hợp lệ' }, { status: 400 });
  if (String(password || '').length < 8) return Response.json({ error: 'Mật khẩu tạm phải có ít nhất 8 ký tự' }, { status: 400 });
  if (await db().fetch(`count(*[_type=="appUser" && username==$un])`, { un })) return Response.json({ error: 'Tên đăng nhập đã tồn tại' }, { status: 400 });
  await db().create({
    _id: 'user-' + randomUUID(), _type: 'appUser', username: un, name: String(name || un).trim().slice(0, 100), role,
    active: true, mustChange: true, sessionVer: 0, passwordHash: await bcrypt.hash(String(password), 10),
  });
  return Response.json({ ok: true });
}
