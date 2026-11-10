// Tạo giá trị ADMIN_PASSWORD_HASH cho .env / Vercel từ một mật khẩu (mật khẩu gốc không được lưu ở đâu).
// npm run hash-password -- "MatKhauMoi123"
import bcrypt from 'bcryptjs';

const pw = process.argv[2];
if (!pw || pw.length < 8) { console.log('Cách dùng: npm run hash-password -- "<mật khẩu ≥ 8 ký tự>"'); process.exit(1); }
console.log('ADMIN_PASSWORD_HASH=' + Buffer.from(await bcrypt.hash(pw, 12)).toString('base64'));
