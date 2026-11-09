# PVSM · Track Record

Web quản lý dự án, Track Record tàu và công nợ. Có đăng nhập, phân quyền, dữ liệu lưu trên Sanity, chạy trên Vercel.

- **Next.js 16** (App Router), **React 19**, **Node.js 24**
- **Sanity** lưu dữ liệu và file chứng từ (dataset **private**)
- Đăng nhập bằng **tên đăng nhập + mật khẩu**. Mật khẩu chỉ lưu dạng mã băm bcrypt, phiên đăng nhập là cookie httpOnly 7 ngày.

## Chạy ở máy (local)

Cần cài Node.js 24.

```bash
npm install                 # lần đầu
npm run check-sanity        # kiểm tra .env và dataset có đang private không
npm run dev                 # mở http://localhost:3000
```

Đăng nhập lần đầu bằng tên đăng nhập `ADMIN_NAME` (mặc định `admin`) và mật khẩu khởi tạo. Hệ thống tự tạo tài khoản Admin và yêu cầu đổi mật khẩu ngay.

Các lệnh khác:

| Lệnh | Tác dụng |
|---|---|
| `npm run dev` | Chạy chế độ phát triển, tự tải lại khi sửa code |
| `npm run build` rồi `npm start` | Chạy giống bản production |
| `npm run create-user -- <tên đăng nhập> <sales\|acct\|admin> <mật khẩu> ["Họ tên"]` | Tạo tài khoản trực tiếp trong Sanity, hoặc đặt lại mật khẩu nếu tên đã có (dùng khi quên mật khẩu Admin) |
| `npm run hash-password -- "<mật khẩu>"` | Tạo giá trị `ADMIN_PASSWORD_HASH` từ mật khẩu khởi tạo mới |
| `npm run check-sanity` | Kiểm tra kết nối Sanity và cảnh báo nếu dataset đang public |

## Cài đặt lần đầu

### 1. Sanity

1. Vào [sanity.io/manage](https://www.sanity.io/manage) → **Create project**. Ghi lại **Project ID**.
2. **Datasets** → tạo (hoặc dùng) dataset `production` và đặt **Visibility = Private**.
   > Bắt buộc. Nếu dataset public thì ai biết Project ID cũng đọc được dữ liệu. `npm run check-sanity` sẽ báo nếu bạn quên bước này.
3. **API → Tokens → Add API token**, quyền **Editor**. Copy token.
4. Điền vào file `.env`:

```env
SANITY_PROJECT_ID=abc123xy
SANITY_DATASET=production
SANITY_API_TOKEN=sk...
AUTH_SECRET=...   # đã có sẵn, chuỗi ngẫu nhiên ≥ 32 ký tự

ADMIN_NAME=admin               # tên đăng nhập của Admin đầu tiên
ADMIN_PASSWORD_HASH=JDJiJDEy...  # mã băm bcrypt của mật khẩu khởi tạo (đã có sẵn)
```

**Tài khoản Admin đầu tiên.** `.env` chỉ chứa mã băm bcrypt (dạng base64), không chứa mật khẩu gốc, nên lộ file cũng không suy ra được mật khẩu. Tài khoản chỉ được tạo khi tên `ADMIN_NAME` chưa có trong Sanity. Sau lần đăng nhập đầu và đổi mật khẩu, mã băm này hết tác dụng, có thể xóa khỏi Vercel. Muốn đặt mật khẩu khởi tạo khác thì chạy `npm run hash-password -- "MatKhauMoi"` rồi dán kết quả vào `.env`.

File `.env` đã nằm trong `.gitignore` nên **không bị đẩy lên GitHub**.

### 2. GitHub → Vercel (tự deploy)

1. Đẩy code lên GitHub (thư mục `web/` này chính là gốc của repo):
   ```bash
   git init
   git add .
   git commit -m "PVSM Track Record"
   git branch -M main
   git remote add origin https://github.com/<tài-khoản>/<repo>.git
   git push -u origin main
   ```
2. Vào [vercel.com/new](https://vercel.com/new) → **Import** repo vừa đẩy. Vercel tự nhận Next.js.
   - Nếu repo chứa cả thư mục cha `PVSM/`, đặt **Root Directory = `web`**.
3. **Environment Variables**: thêm các biến như trong `.env`: `SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_TOKEN`, `AUTH_SECRET`, `ADMIN_NAME`, `ADMIN_PASSWORD_HASH`. Mẹo: ở màn hình Environment Variables có thể dán cả nội dung file `.env` một lần.
4. **Deploy**. Từ giờ mỗi lần `git push` lên `main`, Vercel tự deploy lại.

Sau khi deploy, đăng nhập bằng tài khoản Admin, rồi vào tab **Quản trị → Người dùng** để tạo tài khoản cho các nhân viên khác. Local và Vercel dùng chung dataset Sanity, nên tài khoản tạo ở đâu cũng dùng được ở cả hai nơi.

## Phân quyền

| Vai trò | Quyền |
|---|---|
| Thương mại / Kỹ thuật (`sales`) | Tạo, sửa dự án, upload chứng từ, nhập Excel, xuất Excel. Chỉ xem công nợ. |
| Kế toán (`acct`) | Cập nhật công nợ, đợt thanh toán, kế hoạch thu. Chỉ xem dự án. |
| Lãnh đạo / Admin (`admin`) | Toàn quyền: quản lý người dùng, tỷ giá, thùng rác, gộp tên chủ tàu, sao lưu/khôi phục, audit log. |

Quyền được kiểm tra **ở server**, không chỉ ẩn nút trên giao diện.

- Admin tạo tài khoản với mật khẩu tạm. Người dùng **phải đổi mật khẩu** ở lần đăng nhập đầu.
- Nhập sai mật khẩu 5 lần thì tài khoản bị khóa 15 phút.
- Khi Admin khóa tài khoản hoặc đặt lại mật khẩu, người đó bị đăng xuất khỏi mọi thiết bị.

## Nhập / tổng hợp nhiều file Excel

**Track Record → Nhập từ Excel** → chọn hoặc kéo thả **nhiều file** `.xlsx`/`.xls` cùng lúc. Vẫn có thể dán bảng như cũ.

- Hệ thống tìm trong mọi sheet bảng có cột **"Name of project"**, đọc các nhóm I / II / III / IV như mẫu Track Record.
- **Khóa nhận diện dự án** = tên tàu (bỏ dấu, khoảng trắng, ký tự đặc biệt) + ngày bắt đầu. Nếu không đọc được ngày thì dùng tên tàu + hạng mục.
- **Thứ tự ưu tiên**: file có *ngày sửa* mới hơn sẽ ghi đè file cũ hơn. Trùng trong cùng một file thì dòng phía dưới thắng.
- **Ghi đè toàn bộ dòng**: dự án đã có trên web sẽ bị thay **mọi cột có trong Excel**. Ô trống trong Excel sẽ xóa giá trị tương ứng.
- **Luôn giữ nguyên**: mã dự án, chứng từ đính kèm, công nợ, và các trường không có trong Excel (IMO, số HĐ, liên hệ, email, điện thoại, payment term…).
- Màn hình xem trước cho biết số dự án **Mới** và số dự án **Ghi đè** trước khi bấm nhập.

## Tính năng theo SRS v2

| Mục SRS | Trên web |
|---|---|
| 2.1 Dữ liệu dự án | Đủ 19 trường. Survey type chọn nhiều thẻ (IS, SS, Docking, sửa chữa sự cố / hành trình…). USD tự tính theo tỷ giá chốt. |
| 2.2 Nhập liệu | Ctrl+V dán ảnh, kéo thả, chọn file. Gợi ý tự động tên tàu / chủ tàu / quốc gia. Nhập lại tên tàu cũ thì tự điền LOA, Beam, Depth. Viền đỏ ô bắt buộc. |
| 2.3 Đối soát | Chia đôi màn hình: chứng từ bên trái, form bên phải. **Quét OCR**: tô xanh ô khớp với chứng từ (giá trị HĐ, tên tàu, chủ tàu, ngày, số HĐ), tô vàng ô lệch. OCR chạy trong trình duyệt, chỉ đọc ảnh; với PDF hãy chụp màn hình trang cần đối soát. |
| 3.1 Bộ lọc | Năm, **quý, tháng, khoảng ngày thi công**, hạng mục, loại tàu, **survey type, LOA / Beam từ–đến**, quốc gia, **chủ tàu**, trạng thái, chỉ dự án lỗi dữ liệu. |
| 3.2 Xuất Excel | Chọn cột, kẻ khung, tiêu đề đậm, sub-total từng hạng mục, dòng TOTAL dùng công thức SUM. |
| 4 Công nợ | Mỗi đợt = % × giá trị cơ sở, tự tính lại khi có giá trị quyết toán. Ghi nhận thu, xóa khoản thu nhập nhầm, sửa hạn, xóa đợt. Nhãn màu Trong hạn / Sắp đến hạn (≤7 ngày) / Quá hạn. **Kế toán xuất báo cáo công nợ Excel.** |
| 4.3 Gợi ý tuần | 4 nhóm: đến hạn trong tuần, vừa hoàn thành chưa thu, đang thi công chưa có dự kiến thu tuần tới, quá hạn > 30 ngày. |
| 5.2 Phân quyền | Như bảng Phân quyền ở trên, kiểm tra ở server. Audit log ghi người thực hiện. |

## Tốc độ tải

- Mở trang: dữ liệu gửi kèm trong HTML, không phải chờ thêm một lượt gọi API.
- Audit log chỉ tải khi Admin mở tab Quản trị. Thư viện Excel (~1 MB) chỉ tải khi nhập Excel, thư viện OCR chỉ tải khi bấm Quét OCR.
- Ảnh thu nhỏ lấy bản 240px do Sanity nén sẵn và chỉ tải khi cuộn tới (lazy load).
- Cache:
  - File chứng từ và thư viện tĩnh được cache 1 năm (nội dung gắn với mã băm/phiên bản nên không bao giờ cũ).
  - `app.js` đổi phiên bản theo mỗi lần deploy.
  - Dữ liệu dùng ETag: không đổi thì server trả 304.
- Phân trang: Track Record 30 dòng/trang, danh sách công nợ 30, audit log 50. Ô tìm kiếm chờ người dùng gõ xong mới lọc.

## File chứng từ (ảnh, PDF)

- Dán bằng Ctrl+V, kéo thả, hoặc chọn file. Ảnh được tự nén sang WebP (cạnh dài tối đa 2400px).
- File lưu trên Sanity nhưng **chỉ mở được qua web sau khi đăng nhập** (`/api/files/...`). Link gốc trên CDN của Sanity không bao giờ gửi ra trình duyệt.
- Giới hạn **4,4 MB mỗi file** (giới hạn request của Vercel). PDF scan lớn hơn cần nén hoặc tách trước.

## Bảo mật

- Mật khẩu không bao giờ lưu dạng gốc, cả trong Sanity lẫn trong `.env`: chỉ lưu mã băm **bcrypt** (không giải ngược được).
- Token Sanity và `AUTH_SECRET` chỉ nằm ở server (`.env` và Vercel Environment Variables, được Vercel mã hóa khi lưu). Trình duyệt không bao giờ nhận được hai giá trị này.
- `.env` nằm trong `.gitignore`, **không bị đẩy lên GitHub**. Trước khi push, chạy `git status` để chắc chắn không thấy `.env` trong danh sách.
- Dataset Sanity phải để **Private** (`npm run check-sanity` sẽ kiểm tra).
- Chống dò mật khẩu: sai 5 lần thì khóa 15 phút. Chống CSRF: chặn request ghi đến từ trang web khác.
- File chứng từ chỉ mở được sau khi đăng nhập.

## Chuyển dữ liệu từ bản HTML cũ

Ở bản HTML cũ (`pvsm-track-record.html`): **Quản trị → Tải bản sao lưu (.json)**. Ở web mới, đăng nhập bằng Admin: **Quản trị → Khôi phục từ file** → chọn file .json đó. Ảnh đính kèm trong bản cũ sẽ được upload lên Sanity; file lớn hơn 4,4 MB bị bỏ qua và có thông báo.

## Lưu ý vận hành

- **Gói Free của Sanity** giới hạn 10.000 document. Mỗi dự án và mỗi đợt thanh toán là 1 document, audit log gom 1 document mỗi tháng, nên vài nghìn dự án vẫn thoải mái.
- **Hai người sửa cùng một dự án cùng lúc**: người lưu sau sẽ nhận thông báo "dữ liệu vừa được người khác cập nhật", web tải lại bản mới nhất, không ghi đè lẫn nhau.
- Web tự tải lại dữ liệu khi bạn quay lại tab trình duyệt (nếu không đang sửa dở).
- Không nên để thư mục `node_modules` trong OneDrive (đồng bộ rất chậm). Nên clone repo ra một thư mục ngoài OneDrive, ví dụ `D:\code\pvsm`.

## Cấu trúc

```
app/
  page.js              trang chính (kiểm tra đăng nhập, nạp public/app.js)
  login/               trang đăng nhập
  api/auth/*           đăng nhập, đăng xuất, đổi mật khẩu
  api/state            tải toàn bộ dữ liệu
  api/sync             lưu thay đổi (kiểm tra quyền + chống ghi đè lẫn nhau)
  api/files/*          upload / xem file chứng từ (cần đăng nhập)
  api/users/*          quản lý người dùng (Admin)
  api/restore          khôi phục từ bản sao lưu (Admin)
lib/                   Sanity client, xác thực, lọc trường dữ liệu
public/app.js          giao diện (Tổng quan, Track Record, Công nợ, Quản trị)
public/vendor/         SheetJS 0.20.3 để đọc file Excel (chỉ tải khi nhập Excel)
scripts/               tạo tài khoản, kiểm tra Sanity
```
