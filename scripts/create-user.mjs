// Tạo (hoặc đặt lại mật khẩu/vai trò) một tài khoản trực tiếp trong Sanity.
// npm run create-user -- <tên đăng nhập> <sales|acct|admin> <mật khẩu> ["Họ tên hiển thị"]
import { createClient } from '@sanity/client';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

const [raw, role, password, name] = process.argv.slice(2);
const un = String(raw || '').trim().toLowerCase();
if (!/^[a-z0-9._@-]{3,40}$/.test(un) || !['sales', 'acct', 'admin'].includes(role) || String(password || '').length < 8) {
  console.log('Cách dùng: npm run create-user -- <tên đăng nhập> <sales|acct|admin> <mật khẩu ≥ 8 ký tự> ["Họ tên"]');
  process.exit(1);
}
const db = createClient({
  projectId: process.env.SANITY_PROJECT_ID, dataset: process.env.SANITY_DATASET || 'production',
  apiVersion: '2025-01-01', token: process.env.SANITY_API_TOKEN, useCdn: false,
});
const hash = await bcrypt.hash(password, 10);
const ex = await db.fetch(`*[_type=="appUser" && username==$un][0]`, { un });
if (ex) {
  await db.patch(ex._id).set({ role, passwordHash: hash, active: true, mustChange: false, failCount: 0, sessionVer: (ex.sessionVer || 0) + 1, ...(name ? { name } : {}) }).unset(['lockUntil']).commit();
  console.log(`Đã cập nhật tài khoản "${un}" (${role}).`);
} else {
  await db.create({ _id: 'user-' + randomUUID(), _type: 'appUser', username: un, name: name || raw.trim(), role, active: true, mustChange: false, sessionVer: 0, passwordHash: hash });
  console.log(`Đã tạo tài khoản "${un}" (${role}).`);
}
