import Script from 'next/script';
import './globals.css';

const V = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || 'dev').slice(0, 12);

export const metadata = { title: 'PVSM · Track Record' };
export const viewport = { width: 'device-width', initialScale: 1 };

// Áp giao diện sáng/tối đã chọn trước khi trang hiển thị (tránh nháy màu).
// Bọc trong IIFE để không tạo biến toàn cục (app.js dùng tên ngắn như t, h, S ở phạm vi toàn cục).
const themeInit = `(function(){try{var m=localStorage.getItem('pvsm_theme');if(m==='light'||m==='dark')document.documentElement.setAttribute('data-theme',m)}catch(e){}})()`;

export default function RootLayout({ children }) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInit }} />
      </head>
      <body>
        {children}
        <Script src={`/theme.js?v=${V}`} strategy="beforeInteractive" />
      </body>
    </html>
  );
}
