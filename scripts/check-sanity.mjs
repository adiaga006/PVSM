// Kiểm tra kết nối Sanity và đảm bảo dataset là PRIVATE (nếu public, ai biết project ID cũng đọc được dữ liệu).
// npm run check-sanity
const pid = process.env.SANITY_PROJECT_ID, ds = process.env.SANITY_DATASET || 'production';
if (!pid || !process.env.SANITY_API_TOKEN) { console.log('✗ Thiếu SANITY_PROJECT_ID / SANITY_API_TOKEN trong .env'); process.exit(1); }
const q = encodeURIComponent('count(*)');
const url = `https://${pid}.api.sanity.io/v2025-01-01/data/query/${ds}?query=${q}`;

const withToken = await fetch(url, { headers: { Authorization: `Bearer ${process.env.SANITY_API_TOKEN}` } });
if (!withToken.ok) { console.log('✗ Token không hợp lệ hoặc sai project/dataset:', withToken.status, await withToken.text()); process.exit(1); }
console.log(`✓ Kết nối được Sanity. Dataset "${ds}" có ${(await withToken.json()).result} document.`);

// Thử đọc KHÔNG có token. Dataset private sẽ không trả về document nào.
const anon = await (await fetch(url)).json().catch(() => ({}));
if (anon.result > 0) {
  console.log(`✗ NGUY HIỂM: dataset "${ds}" đang PUBLIC — ai cũng đọc được dữ liệu (kể cả mã băm mật khẩu).`);
  console.log(`  Sửa: sanity.io/manage → project → Datasets → ${ds} → chuyển sang Private, hoặc: npx sanity dataset visibility set ${ds} private`);
  process.exit(2);
}
console.log('✓ Dataset là private: không đọc được dữ liệu khi không có token.');
if (!process.env.AUTH_SECRET || process.env.AUTH_SECRET.length < 32) { console.log('✗ AUTH_SECRET thiếu hoặc ngắn hơn 32 ký tự'); process.exit(1); }
console.log('✓ AUTH_SECRET hợp lệ.');
