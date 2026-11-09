import { key } from './sanity';

// Chỉ những trường này được lưu vào Sanity (chặn dữ liệu rác/độc hại từ client).
const PF = ['id', 'code', 'cat', 'name', 'vkey', 'imo', 'vtype', 'detail', 'loa', 'beam', 'depth', 'lbText', 'client', 'country',
  'region', 'survey', 'contractNo', 'signDate', 'periodText', 'start', 'endEst', 'endAct', 'cur', 'value', 'valText', 'rate',
  'fin', 'closed', 'hist', 'term', 'contact', 'email', 'phone', 'rep', 'evalf', 'note', 'del'];
const IF = ['id', 'pid', 'name', 'pct', 'amount', 'due', 'plan', 'planDate'];

const prim = v => (v === null || ['string', 'number', 'boolean'].includes(typeof v)) ? (typeof v === 'string' ? v.slice(0, 5000) : v) : '';
const pick = (o, F) => Object.fromEntries(F.map(k => [k, prim(o[k] ?? '')]));
const validId = id => Number.isSafeInteger(id) && id > 0;

export function cleanProject(p) {
  if (!validId(p?.id)) throw new Error('Project id không hợp lệ');
  const d = pick(p, PF);
  d.files = (Array.isArray(p.files) ? p.files : [])
    .filter(f => f && /^(image|file)-[a-z0-9-]+$/.test(f.asset || ''))
    .map(f => ({ _key: f._key || key(), name: String(f.name || '').slice(0, 200), type: String(f.type || '').slice(0, 100), cat: String(f.cat || 'other').slice(0, 20), asset: f.asset }));
  return d;
}

export function cleanInstallment(i) {
  if (!validId(i?.id) || !validId(i?.pid)) throw new Error('Installment id không hợp lệ');
  const d = pick(i, IF);
  d.rc = (Array.isArray(i.rc) ? i.rc : []).map(r => ({ _key: r._key || key(), date: String(r.date || '').slice(0, 10), amt: Number(r.amt) || 0 }));
  return d;
}

export const pid = id => 'project-' + id;
export const iid = id => 'inst-' + id;
