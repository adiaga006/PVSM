import Script from 'next/script';
import { redirect } from 'next/navigation';
import { currentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function Home() {
  if (!(await currentUser())) redirect('/login');
  // Giao diện chính là app JS thuần (public/app.js), tự gắn vào <body>.
  return <Script src="/app.js" strategy="afterInteractive" />;
}
