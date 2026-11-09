import Script from 'next/script';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';
import { getState } from '@/lib/state';

export const dynamic = 'force-dynamic';

// Phiên bản app.js theo từng lần deploy → trình duyệt cache lâu dài nhưng luôn nhận bản mới sau khi deploy.
const V = (process.env.VERCEL_GIT_COMMIT_SHA || process.env.VERCEL_DEPLOYMENT_ID || 'dev').slice(0, 12);

export default async function Home() {
  const me = await currentUser();
  if (!me) redirect('/login');
  // Gửi kèm dữ liệu ngay trong HTML: app hiển thị được ngay, không phải chờ thêm một lượt gọi API.
  const json = JSON.stringify(await getState(me)).replace(/</g, '\\u003c');
  return (
    <>
      <script id="__state" type="application/json" dangerouslySetInnerHTML={{ __html: json }} />
      <Script src={`/app.js?v=${V}`} strategy="afterInteractive" />
    </>
  );
}
