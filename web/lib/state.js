import { db } from './sanity';

const strip = ({ _id, _type, _createdAt, _updatedAt, ...rest }) => rest;

/** Dữ liệu app cần lúc mở trang (không gồm audit log — chỉ Admin tải khi mở tab Quản trị). */
export async function getState(me) {
  const r = await db().fetch(`{
    "PR": *[_type=="project"],
    "IN": *[_type=="installment"],
    "rate": *[_id=="settings"][0].rate
  }`);
  return {
    me: { name: me.name || me.username, username: me.username, role: me.role, mustChange: !!me.mustChange },
    PR: (r.PR || []).map(strip),
    IN: (r.IN || []).map(strip),
    rate: r.rate || 26000,
  };
}

/** 500 thao tác gần nhất (3 tháng gần nhất). */
export async function getLogs() {
  const docs = await db().fetch(`*[_type=="auditLog"] | order(_id desc)[0...3].entries`);
  return (docs || []).flat().filter(Boolean).sort((a, b) => (b.ts || '').localeCompare(a.ts || '')).slice(0, 500);
}
