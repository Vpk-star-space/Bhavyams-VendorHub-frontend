import React, { useCallback, useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { Mail, ShieldCheck, Send, Users, Eye, Smartphone, Monitor, X, Check, Link2, Image as ImageIcon } from 'lucide-react';

/* ==========================================================================
   EMAIL STUDIO
   - Live preview of the exact email people will receive
   - "Send test to me" before any real send
   - Shows today's quota and the last sends
   - Real sends need a confirm step that repeats the recipient count
   Only the owner email can use the server routes behind this screen.
   ========================================================================== */

const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
const BACKEND_URL = isLocal ? 'http://localhost:5000/api' : 'https://bhavyams-vendorhub-backend.onrender.com/api';
const EMAIL_API = `${BACKEND_URL}/admin/email`;

const authHeaders = () => ({ Authorization: `Bearer ${localStorage.getItem('token')}` });

const BRANDS = [
  { id: 'hub', name: 'Subhams Hub', note: 'Main platform', color: '#f5a524' },
  { id: 'pmms', name: 'PMMS', note: 'Money tracker', color: '#12b886' },
  { id: 'agent', name: 'Secure Agent', note: 'Document printing', color: '#ef5b5b' },
  { id: 'networks', name: 'Subhams Networks', note: 'Core updates', color: '#6c7bff' }
];

const HUB_AUDIENCES = [
  { id: 'all', label: 'Everyone' },
  { id: 'customers', label: 'Customers' },
  { id: 'vendors', label: 'Vendors' },
  { id: 'specific', label: 'Specific emails' }
];
const OTHER_AUDIENCES = [{ id: 'specific', label: 'Specific emails' }];

const EMPTY_FORM = {
  platformBrand: 'hub',
  audience: 'specific',
  target_emails: '',
  subject: '',
  headline: '',
  bodyText: '',
  image_url: '',
  ctaText: '',
  ctaUrl: ''
};

const CSS = `
.es-root { --ink:#1b1340; --gold:#f5a524; color:#f4efff; border-radius:30px; padding:clamp(18px,3vw,34px); background:radial-gradient(900px 500px at 0% 0%, rgba(245,165,36,.16), transparent 60%), radial-gradient(800px 500px at 100% 0%, rgba(108,123,255,.2), transparent 60%), linear-gradient(165deg,#1b1340,#0c0920); box-shadow:0 30px 70px -30px rgba(12,9,32,.8); max-width:1240px; margin:0 auto; font-family:inherit; }
.es-root *, .es-root *::before, .es-root *::after { box-sizing:border-box; }
.es-top { display:flex; flex-wrap:wrap; gap:16px; align-items:center; justify-content:space-between; margin-bottom:22px; }
.es-title { display:flex; align-items:center; gap:12px; margin:0; font-size:clamp(1.4rem,3vw,1.9rem); font-weight:800; letter-spacing:-.02em; }
.es-title svg { color:var(--gold); }
.es-sub { margin:4px 0 0; color:#b9b0e0; font-size:.95rem; }
.es-secure { display:inline-flex; align-items:center; gap:8px; padding:8px 14px; border-radius:999px; font-size:.85rem; font-weight:700; color:#5be0b0; background:rgba(91,224,176,.12); border:1px solid rgba(91,224,176,.3); }
.es-grid { display:grid; grid-template-columns:minmax(0,1.05fr) minmax(0,.95fr); gap:22px; align-items:start; }
.es-card { padding:clamp(16px,2.4vw,26px); border-radius:24px; background:linear-gradient(150deg,rgba(255,255,255,.1),rgba(255,255,255,.03)); border:1px solid rgba(255,255,255,.14); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); }
.es-card + .es-card { margin-top:18px; }
.es-h { margin:0 0 14px; font-size:1rem; font-weight:800; display:flex; align-items:center; gap:8px; }
.es-h svg { color:var(--gold); }
.es-label { display:flex; justify-content:space-between; gap:10px; margin:0 0 7px; font-size:.86rem; font-weight:700; color:#d9d2f5; }
.es-label small { font-weight:600; color:#9d94c8; }
.es-field { width:100%; padding:13px 15px; border-radius:14px; font:inherit; font-size:.98rem; color:#fff; background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.16); outline:0; transition:border-color .2s, box-shadow .2s; }
.es-field::placeholder { color:#8f86bd; }
.es-field:focus { border-color:var(--gold); box-shadow:0 0 0 4px rgba(245,165,36,.2); }
textarea.es-field { min-height:150px; resize:vertical; line-height:1.55; }
.es-stack { display:grid; gap:16px; }
.es-two { display:grid; grid-template-columns:1fr 1fr; gap:14px; }
.es-brands { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; }
.es-brand { position:relative; text-align:left; padding:12px 14px; border-radius:16px; cursor:pointer; color:#f4efff; background:rgba(255,255,255,.05); border:1.5px solid rgba(255,255,255,.14); font:inherit; transition:transform .25s, border-color .25s, background .25s; }
.es-brand:hover { transform:translateY(-2px); }
.es-brand.on { border-color:var(--c); background:rgba(255,255,255,.1); box-shadow:0 0 0 3px color-mix(in srgb, var(--c) 28%, transparent); }
.es-brand b { display:flex; align-items:center; gap:8px; font-size:.92rem; }
.es-brand i { width:10px; height:10px; border-radius:50%; background:var(--c); flex-shrink:0; }
.es-brand span { display:block; margin-top:3px; font-size:.78rem; color:#a79ed1; }
.es-seg { display:flex; flex-wrap:wrap; gap:6px; padding:5px; border-radius:16px; background:rgba(255,255,255,.06); border:1px solid rgba(255,255,255,.12); }
.es-seg button { flex:1; padding:10px 12px; border:0; border-radius:12px; font:inherit; font-size:.9rem; font-weight:700; color:#c8c0ea; background:transparent; cursor:pointer; transition:background .2s, color .2s; white-space:nowrap; }
.es-seg button.on { color:#1b1340; background:var(--gold); }
.es-picker { margin-top:12px; display:grid; gap:10px; }
.es-results { display:grid; gap:4px; max-height:190px; overflow:auto; padding:6px; border-radius:14px; background:rgba(0,0,0,.25); }
.es-result { display:flex; justify-content:space-between; gap:10px; width:100%; padding:9px 12px; border:0; border-radius:10px; font:inherit; font-size:.88rem; color:#f4efff; background:transparent; cursor:pointer; text-align:left; }
.es-result:hover { background:rgba(255,255,255,.1); }
.es-result span { color:#a79ed1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.es-meter { height:8px; border-radius:99px; background:rgba(255,255,255,.12); overflow:hidden; margin:10px 0 8px; }
.es-meter i { display:block; height:100%; border-radius:inherit; background:linear-gradient(90deg,#f5a524,#ff7a59); transition:width .6s cubic-bezier(.16,1,.3,1); }
.es-meta { display:flex; justify-content:space-between; gap:10px; font-size:.85rem; color:#b9b0e0; }
.es-recent { list-style:none; margin:14px 0 0; padding:0; display:grid; gap:8px; }
.es-recent li { display:flex; justify-content:space-between; gap:12px; padding:10px 12px; border-radius:12px; font-size:.86rem; background:rgba(255,255,255,.05); }
.es-recent b { display:block; font-weight:700; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:230px; }
.es-recent small { color:#9d94c8; }
.es-ok { color:#5be0b0; } .es-bad { color:#ff8a9b; }
.es-actions { display:flex; flex-wrap:wrap; gap:12px; margin-top:20px; }
.es-btn { display:inline-flex; align-items:center; justify-content:center; gap:9px; padding:14px 22px; border-radius:999px; border:0; font:inherit; font-weight:800; font-size:.95rem; cursor:pointer; transition:transform .25s, opacity .2s; }
.es-btn:hover:not(:disabled) { transform:translateY(-2px); }
.es-btn:disabled { opacity:.45; cursor:not-allowed; }
.es-btn.main { flex:1; min-width:200px; color:#1b1340; background:linear-gradient(135deg,#ffc15c,#f5a524); box-shadow:0 12px 30px -12px rgba(245,165,36,.8); }
.es-btn.ghost { color:#f4efff; background:rgba(255,255,255,.08); border:1px solid rgba(255,255,255,.2); }
.es-btn.danger { color:#fff; background:linear-gradient(135deg,#ff6b81,#e5484d); }
.es-device { display:inline-flex; padding:4px; border-radius:999px; background:rgba(255,255,255,.08); }
.es-device button { display:grid; place-items:center; width:36px; height:34px; border:0; border-radius:999px; color:#b9b0e0; background:transparent; cursor:pointer; }
.es-device button.on { color:#1b1340; background:var(--gold); }
.es-frame { margin:14px auto 0; border-radius:18px; overflow:hidden; background:#f3f0fb; border:1px solid rgba(255,255,255,.18); transition:max-width .4s cubic-bezier(.16,1,.3,1); }
.es-frame iframe { display:block; width:100%; height:640px; border:0; background:#f3f0fb; }
.es-warn { margin:12px 0 0; padding:10px 14px; border-radius:12px; font-size:.86rem; font-weight:600; color:#ffd88a; background:rgba(245,165,36,.14); border:1px solid rgba(245,165,36,.3); }
.es-row { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
.es-modal-bg { position:fixed; inset:0; z-index:9999; display:grid; place-items:center; padding:18px; background:rgba(8,6,22,.75); backdrop-filter:blur(6px); }
.es-modal { width:min(480px,100%); padding:28px; border-radius:26px; color:#f4efff; background:linear-gradient(160deg,#241a58,#120d33); border:1px solid rgba(255,255,255,.18); box-shadow:0 40px 80px -20px rgba(0,0,0,.8); }
.es-modal h3 { margin:0 0 6px; font-size:1.35rem; letter-spacing:-.02em; }
.es-modal dl { display:grid; gap:10px; margin:18px 0; }
.es-modal dl div { display:flex; justify-content:space-between; gap:14px; padding:10px 14px; border-radius:12px; background:rgba(255,255,255,.07); font-size:.92rem; }
.es-modal dt { color:#b9b0e0; } .es-modal dd { margin:0; font-weight:700; text-align:right; }
.es-note { font-size:.85rem; color:#b9b0e0; margin:0 0 10px; }
@media (max-width:980px) { .es-grid { grid-template-columns:1fr; } .es-brands { grid-template-columns:repeat(2,minmax(0,1fr)); } }
@media (max-width:560px) { .es-two { grid-template-columns:1fr; } .es-btn.main { min-width:100%; } }
`;

const Counter = ({ value, max }) => <small>{value.length}/{max}</small>;

const PremiumEmailBlaster = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [preview, setPreview] = useState({ html: '', recipientsCount: 0, sample: [], warnings: [] });
  const [previewLoading, setPreviewLoading] = useState(false);
  const [quota, setQuota] = useState(null);
  const [recent, setRecent] = useState([]);
  const [device, setDevice] = useState('desktop');
  const [sending, setSending] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const isHub = form.platformBrand === 'hub';
  const brand = BRANDS.find((b) => b.id === form.platformBrand) || BRANDS[0];

  const chooseBrand = (id) => {
    setForm((prev) => ({
      ...prev,
      platformBrand: id,
      audience: id === 'hub' ? prev.audience : 'specific'
    }));
  };

  const loadQuota = useCallback(async () => {
    try {
      const res = await axios.get(`${EMAIL_API}/quota`, { headers: authHeaders() });
      setQuota(res.data);
      setRecent(res.data.recent || []);
    } catch {
      /* the preview call also returns the quota, so this is not critical */
    }
  }, []);

  useEffect(() => { loadQuota(); }, [loadQuota]);

  // People you can add with one click (Subhams Hub users)
  useEffect(() => {
    axios.get(`${BACKEND_URL}/admin/all-users`, { headers: authHeaders() })
      .then((res) => setUsers(Array.isArray(res.data) ? res.data : []))
      .catch(() => setUsers([]));
  }, []);

  // Live preview: asks the server to draw the real email, 0.7 seconds after you stop typing
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await axios.post(`${EMAIL_API}/preview`, form, { headers: authHeaders(), signal: controller.signal });
        setPreview(res.data);
        if (res.data.quota) setQuota((prev) => ({ ...(prev || {}), ...res.data.quota }));
      } catch (err) {
        if (!axios.isCancel(err)) {
          setPreview((prev) => ({ ...prev, warnings: [err.response?.data?.message || 'Could not build the preview.'] }));
        }
      } finally {
        if (!controller.signal.aborted) setPreviewLoading(false);
      }
    }, 700);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [form]);

  const matches = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return [];
    return users
      .filter((u) => u.username?.toLowerCase().includes(term) || u.email?.toLowerCase().includes(term))
      .slice(0, 8);
  }, [users, search]);

  const addEmail = (email) => {
    const current = form.target_emails.split(/[\s,;]+/).filter(Boolean);
    if (!current.map((e) => e.toLowerCase()).includes(email.toLowerCase())) current.push(email);
    set('target_emails', current.join(', '));
    setSearch('');
  };

  const addressCount = form.target_emails.split(/[\s,;]+/).filter(Boolean).length;
  const contentReady = form.subject.trim() && form.headline.trim() && form.bodyText.trim();
  const canSend = contentReady && preview.recipientsCount > 0 && !previewLoading && !sending;
  const audiences = isHub ? HUB_AUDIENCES : OTHER_AUDIENCES;
  const audienceLabel = audiences.find((a) => a.id === form.audience)?.label || form.audience;
  const needsTyping = preview.recipientsCount > 1;

  const send = async (mode) => {
    setSending(true);
    try {
      const body = mode === 'test' ? { ...form, audience: 'test' } : { ...form, confirmCount: preview.recipientsCount };
      const res = await axios.post(`${EMAIL_API}/send`, body, { headers: authHeaders() });
      toast.success(mode === 'test' ? 'Test email sent to your inbox.' : res.data.message);
      if (res.data.failed > 0) toast.warn(`${res.data.failed} email(s) failed: ${res.data.failedSample.join(', ')}`);
      if (mode !== 'test') {
        setForm((prev) => ({ ...EMPTY_FORM, platformBrand: prev.platformBrand, audience: prev.audience === 'specific' ? 'specific' : prev.audience }));
        setSearch('');
      }
      setConfirmOpen(false);
      setConfirmText('');
      loadQuota();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send the email.');
    } finally {
      setSending(false);
    }
  };

  const usedPct = quota ? Math.min(100, Math.round((quota.usedToday / quota.dailyLimit) * 100)) : 0;

  return (
    <div className="es-root" style={{ '--c': brand.color }}>
      <style>{CSS}</style>

      <div className="es-top">
        <div>
          <h2 className="es-title"><Mail size={26} /> Email studio</h2>
          <p className="es-sub">Write once, preview exactly what people will see, test it, then send.</p>
        </div>
        <span className="es-secure"><ShieldCheck size={16} /> Owner only. Every send is logged.</span>
      </div>

      <div className="es-grid">
        {/* ---------------- LEFT: the form ---------------- */}
        <div>
          <section className="es-card">
            <h3 className="es-h"><Send size={18} /> 1. Brand and audience</h3>
            <div className="es-stack">
              <div className="es-brands" role="radiogroup" aria-label="Platform brand">
                {BRANDS.map((b) => (
                  <button
                    key={b.id}
                    type="button"
                    role="radio"
                    aria-checked={form.platformBrand === b.id}
                    className={`es-brand${form.platformBrand === b.id ? ' on' : ''}`}
                    style={{ '--c': b.color }}
                    onClick={() => chooseBrand(b.id)}
                  >
                    <b><i />{b.name}</b>
                    <span>{b.note}</span>
                  </button>
                ))}
              </div>

              <div>
                <p className="es-label"><span><Users size={14} style={{ verticalAlign: '-2px' }} /> Who gets this email</span></p>
                <div className="es-seg" role="radiogroup" aria-label="Audience">
                  {audiences.map((a) => (
                    <button key={a.id} type="button" role="radio" aria-checked={form.audience === a.id} className={form.audience === a.id ? 'on' : ''} onClick={() => set('audience', a.id)}>
                      {a.label}
                    </button>
                  ))}
                </div>
                {!isHub && <p className="es-note" style={{ marginTop: 10 }}>{brand.name} users are not in the Hub database. Paste their email addresses below.</p>}

                {form.audience === 'specific' && (
                  <div className="es-picker">
                    {isHub && (
                      <>
                        <input className="es-field" placeholder="Search Hub users by name or email" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search users" />
                        {matches.length > 0 && (
                          <div className="es-results">
                            {matches.map((u) => (
                              <button key={u.id} type="button" className="es-result" onClick={() => addEmail(u.email)}>
                                <strong>{u.username}</strong><span>{u.email}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                    <div>
                      <p className="es-label"><span>Email addresses</span><small>{addressCount} added</small></p>
                      <textarea className="es-field" style={{ minHeight: 90 }} placeholder="name@gmail.com, another@gmail.com" value={form.target_emails} onChange={(e) => set('target_emails', e.target.value)} aria-label="Email addresses" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="es-card">
            <h3 className="es-h"><Mail size={18} /> 2. Write the email</h3>
            <div className="es-stack">
              <div>
                <p className="es-label"><span>Subject (seen in the inbox)</span><Counter value={form.subject} max={150} /></p>
                <input className="es-field" maxLength={150} placeholder="Important update about your account" value={form.subject} onChange={(e) => set('subject', e.target.value)} />
              </div>
              <div>
                <p className="es-label"><span>Headline (big text inside the email)</span><Counter value={form.headline} max={120} /></p>
                <input className="es-field" maxLength={120} placeholder="A short, clear headline" value={form.headline} onChange={(e) => set('headline', e.target.value)} />
              </div>
              <div>
                <p className="es-label"><span>Message</span><Counter value={form.bodyText} max={5000} /></p>
                <textarea className="es-field" maxLength={5000} placeholder={'Write your message. Line breaks are kept. Use **double stars** for bold.'} value={form.bodyText} onChange={(e) => set('bodyText', e.target.value)} />
              </div>
            </div>
          </section>

          <section className="es-card">
            <h3 className="es-h"><Link2 size={18} /> 3. Button and image (optional)</h3>
            <p className="es-note">For safety, buttons can only open subhamsnetworks.in pages, and images can only come from Cloudinary or subhamsnetworks.in.</p>
            <div className="es-stack">
              <div className="es-two">
                <div>
                  <p className="es-label"><span>Button text</span><Counter value={form.ctaText} max={32} /></p>
                  <input className="es-field" maxLength={32} placeholder="Open Subhams Hub" value={form.ctaText} onChange={(e) => set('ctaText', e.target.value)} />
                </div>
                <div>
                  <p className="es-label"><span>Button link</span></p>
                  <input className="es-field" placeholder="https://hub.subhamsnetworks.in" value={form.ctaUrl} onChange={(e) => set('ctaUrl', e.target.value)} />
                </div>
              </div>
              <div>
                <p className="es-label"><span><ImageIcon size={14} style={{ verticalAlign: '-2px' }} /> Image link</span></p>
                <input className="es-field" placeholder="https://res.cloudinary.com/..." value={form.image_url} onChange={(e) => set('image_url', e.target.value)} />
              </div>
            </div>
          </section>
        </div>

        {/* ---------------- RIGHT: preview, usage, actions ---------------- */}
        <div>
          <section className="es-card">
            <div className="es-row">
              <h3 className="es-h" style={{ margin: 0 }}><Eye size={18} /> Live preview {previewLoading && <small style={{ color: '#9d94c8', fontWeight: 600 }}>updating...</small>}</h3>
              <div className="es-device" role="group" aria-label="Preview size">
                <button type="button" className={device === 'desktop' ? 'on' : ''} onClick={() => setDevice('desktop')} aria-label="Desktop preview"><Monitor size={16} /></button>
                <button type="button" className={device === 'phone' ? 'on' : ''} onClick={() => setDevice('phone')} aria-label="Phone preview"><Smartphone size={16} /></button>
              </div>
            </div>
            <div className="es-frame" style={{ maxWidth: device === 'phone' ? 390 : '100%' }}>
              <iframe title="Email preview" sandbox="" srcDoc={preview.html} />
            </div>
            {preview.warnings?.map((w) => <p key={w} className="es-warn">{w}</p>)}
          </section>

          <section className="es-card">
            <h3 className="es-h"><ShieldCheck size={18} /> Sending limits</h3>
            {quota ? (
              <>
                <div className="es-meter" aria-hidden="true"><i style={{ width: `${usedPct}%` }} /></div>
                <div className="es-meta">
                  <span>{quota.usedToday} of {quota.dailyLimit} used in 24 hours</span>
                  <span>{quota.remaining} left</span>
                </div>
                <p className="es-note" style={{ margin: '10px 0 0' }}>Up to {quota.perSend} people per send, {quota.maxSendsPerHour} sends per hour.</p>
              </>
            ) : <p className="es-note">Loading usage...</p>}

            {recent.length > 0 && (
              <ul className="es-recent">
                {recent.slice(0, 5).map((r) => (
                  <li key={r.id}>
                    <div><b>{r.subject}</b><small>{new Date(r.created_at).toLocaleString()}</small></div>
                    <div style={{ textAlign: 'right' }}>
                      <span className="es-ok">{r.sent} sent</span>
                      {r.failed > 0 && <small className="es-bad" style={{ display: 'block' }}>{r.failed} failed</small>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="es-card">
            <div className="es-row">
              <span style={{ fontWeight: 700 }}>{preview.recipientsCount} recipient{preview.recipientsCount === 1 ? '' : 's'}</span>
              {preview.sample?.length > 0 && <small style={{ color: '#9d94c8' }}>e.g. {preview.sample.join(', ')}</small>}
            </div>
            <div className="es-actions">
              <button type="button" className="es-btn ghost" disabled={!contentReady || sending} onClick={() => send('test')}>
                Send test to me
              </button>
              <button type="button" className="es-btn main" disabled={!canSend} onClick={() => setConfirmOpen(true)}>
                <Send size={18} /> Review and send
              </button>
            </div>
          </section>
        </div>
      </div>

      {confirmOpen && (
        <div className="es-modal-bg" role="dialog" aria-modal="true" aria-labelledby="es-confirm-title" onClick={() => !sending && setConfirmOpen(false)}>
          <div className="es-modal" onClick={(e) => e.stopPropagation()}>
            <h3 id="es-confirm-title">Ready to send?</h3>
            <p className="es-note">This cannot be undone. Check the details once more.</p>
            <dl>
              <div><dt>Brand</dt><dd>{brand.name}</dd></div>
              <div><dt>Audience</dt><dd>{audienceLabel}</dd></div>
              <div><dt>Recipients</dt><dd>{preview.recipientsCount}</dd></div>
              <div><dt>Subject</dt><dd style={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{form.subject}</dd></div>
            </dl>
            {needsTyping && (
              <>
                <p className="es-label"><span>Type SEND to confirm</span></p>
                <input className="es-field" value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="SEND" autoFocus aria-label="Type SEND to confirm" />
              </>
            )}
            <div className="es-actions" style={{ marginTop: 18 }}>
              <button type="button" className="es-btn ghost" disabled={sending} onClick={() => setConfirmOpen(false)}><X size={16} /> Cancel</button>
              <button type="button" className="es-btn danger" style={{ flex: 1 }} disabled={sending || (needsTyping && confirmText.trim().toUpperCase() !== 'SEND')} onClick={() => send('real')}>
                {sending ? 'Sending...' : <><Check size={16} /> Send now</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PremiumEmailBlaster;