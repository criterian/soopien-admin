'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { saveAffiliateConfig } from './actions';
import {
  AWIN_PROVIDERS,
  COUNTRY_LABEL,
  OFFER_COUNTRY,
  OFFER_PROVIDER,
  OFFER_PROVIDER_META,
  OFFER_PROVIDERS_BY_COUNTRY,
  type AffiliateConfig,
  type OfferCountry,
  type OfferProvider,
} from '../constants';

type StrMap = Record<string, string>;

const toMap = (p: Partial<Record<string, string>>): StrMap => {
  const out: StrMap = {};
  for (const [k, v] of Object.entries(p)) if (v) out[k] = v;
  return out;
};
const clean = (m: StrMap): Record<string, string> => {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(m)) if (v.trim()) out[k] = v.trim();
  return out;
};

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '9px 0', borderBottom: '1px solid var(--divider)' }}>
      <span style={{ width: 150, fontSize: 13.5, color: 'var(--text2)' }}>{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        spellCheck={false}
        style={{ flex: 1, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, fontFamily: 'var(--font-sans)', fontSize: 13 }}
      />
    </label>
  );
}

export function AffiliateForm({ initial }: { initial: AffiliateConfig }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [amazon, setAmazon] = useState<StrMap>(toMap(initial.amazonTags));
  const [bookshop, setBookshop] = useState(initial.bookshopId ?? '');
  const [awinPub, setAwinPub] = useState(initial.awinPublisherId ?? '');
  const [awinAdv, setAwinAdv] = useState<StrMap>(toMap(initial.awinAdvertisers));
  const [tr, setTr] = useState({
    kitapyurdu: initial.turkish.kitapyurdu ?? '',
    dr: initial.turkish.dr ?? '',
    idefix: initial.turkish.idefix ?? '',
  });
  const [disabled, setDisabled] = useState<Set<OfferProvider>>(new Set(initial.disabledProviders));

  const dirty = () => setSaved(false);
  const setAmazonTag = (c: OfferCountry, v: string) => { setAmazon((m) => ({ ...m, [c]: v })); dirty(); };
  const setAdv = (p: OfferProvider, v: string) => { setAwinAdv((m) => ({ ...m, [p]: v })); dirty(); };
  const toggle = (p: OfferProvider) => {
    setDisabled((s) => { const n = new Set(s); n.has(p) ? n.delete(p) : n.add(p); return n; });
    dirty();
  };

  const save = () => {
    setError(null);
    const config: AffiliateConfig = {
      amazonTags: clean(amazon) as AffiliateConfig['amazonTags'],
      bookshopId: bookshop.trim() || null,
      awinPublisherId: awinPub.trim() || null,
      awinAdvertisers: clean(awinAdv) as AffiliateConfig['awinAdvertisers'],
      turkish: {
        kitapyurdu: tr.kitapyurdu.trim() || null,
        dr: tr.dr.trim() || null,
        idefix: tr.idefix.trim() || null,
      },
      disabledProviders: [...disabled],
    };
    start(async () => {
      const res = await saveAffiliateConfig(config);
      if (res?.error) setError(res.error);
      else { setSaved(true); router.refresh(); }
    });
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24, alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Amazon — per marketplace */}
        <section className="card" style={{ padding: '4px 20px 16px' }}>
          <h2 style={{ fontSize: 15, margin: '14px 0 4px' }}>Amazon Associates</h2>
          <p className="muted" style={{ fontSize: 12.5, marginBottom: 6 }}>One tracking tag per marketplace (e.g. <code>soopien-20</code>).</p>
          {OFFER_COUNTRY.map((c) => (
            <Field key={c} label={`${c} · ${COUNTRY_LABEL[c]}`} value={amazon[c] ?? ''} onChange={(v) => setAmazonTag(c, v)} placeholder="tag (blank = no affiliate)" />
          ))}
        </section>

        {/* Bookshop.org */}
        <section className="card" style={{ padding: '4px 20px 16px' }}>
          <h2 style={{ fontSize: 15, margin: '14px 0 4px' }}>Bookshop.org</h2>
          <p className="muted" style={{ fontSize: 12.5, marginBottom: 6 }}>Affiliate id — used for US / GB / ES.</p>
          <Field label="Affiliate id" value={bookshop} onChange={(v) => { setBookshop(v); dirty(); }} placeholder="a=…" />
        </section>

        {/* Awin network */}
        <section className="card" style={{ padding: '4px 20px 16px' }}>
          <h2 style={{ fontSize: 15, margin: '14px 0 4px' }}>Awin network (EU specialists)</h2>
          <p className="muted" style={{ fontSize: 12.5, marginBottom: 6 }}>Your publisher id, then each merchant’s advertiser id. Both needed to monetize a seller.</p>
          <Field label="Publisher id" value={awinPub} onChange={(v) => { setAwinPub(v); dirty(); }} placeholder="awinaffid" />
          {AWIN_PROVIDERS.map((p) => (
            <Field key={p} label={OFFER_PROVIDER_META[p].label} value={awinAdv[p] ?? ''} onChange={(v) => setAdv(p, v)} placeholder="advertiser id (awinmid)" />
          ))}
        </section>

        {/* Turkish booksellers */}
        <section className="card" style={{ padding: '4px 20px 16px' }}>
          <h2 style={{ fontSize: 15, margin: '14px 0 4px' }}>Turkish booksellers</h2>
          <Field label="Kitapyurdu" value={tr.kitapyurdu} onChange={(v) => { setTr((s) => ({ ...s, kitapyurdu: v })); dirty(); }} placeholder="ref id" />
          <Field label="D&R" value={tr.dr} onChange={(v) => { setTr((s) => ({ ...s, dr: v })); dirty(); }} placeholder="ref id" />
          <Field label="İdefix" value={tr.idefix} onChange={(v) => { setTr((s) => ({ ...s, idefix: v })); dirty(); }} placeholder="ref id" />
        </section>

        {/* Provider visibility */}
        <section className="card" style={{ padding: '4px 20px 18px' }}>
          <h2 style={{ fontSize: 15, margin: '14px 0 4px' }}>Sellers shown</h2>
          <p className="muted" style={{ fontSize: 12.5, marginBottom: 10 }}>Uncheck to hide a seller from the app entirely, even if it has a tag.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '6px 18px' }}>
            {OFFER_PROVIDER.map((p) => (
              <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, cursor: 'pointer' }}>
                <input type="checkbox" checked={!disabled.has(p)} onChange={() => toggle(p)} />
                <span style={{ width: 9, height: 9, borderRadius: 2, background: OFFER_PROVIDER_META[p].color, display: 'inline-block' }} />
                {OFFER_PROVIDER_META[p].label}
              </label>
            ))}
          </div>
        </section>
      </div>

      {/* Sticky save + help */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, position: 'sticky', top: 16 }}>
        <div className="card" style={{ padding: 18 }}>
          <button className="btn primary" disabled={pending} onClick={save} style={{ width: '100%', justifyContent: 'center' }}>
            {pending ? 'Saving…' : 'Save config'}
          </button>
          {error ? <div style={{ color: 'var(--rose)', fontSize: 12.5, marginTop: 10 }}>{error}</div> : null}
          {saved ? <div style={{ color: 'var(--green)', fontSize: 12.5, marginTop: 10 }}>✓ Saved — buy-links update within seconds</div> : null}
        </div>
        <div className="card" style={{ padding: 18 }}>
          <h2 style={{ fontSize: 15, marginBottom: 8 }}>How this works</h2>
          <p className="muted" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
            Config is stored in <code>app_config</code> and read by the API (cached). A seller becomes a
            <em> monetized</em> affiliate link only once its tag/id is set; otherwise the app still shows a
            plain buy-link. The app picks each reader’s marketplace automatically.
          </p>
          <div style={{ marginTop: 12, fontSize: 12.5 }} className="muted">
            Providers per marketplace:
            <ul style={{ margin: '6px 0 0', paddingLeft: 16, lineHeight: 1.7 }}>
              {OFFER_COUNTRY.map((c) => (
                <li key={c}>
                  <strong style={{ color: 'var(--text2)' }}>{c}</strong>: {OFFER_PROVIDERS_BY_COUNTRY[c].map((p) => OFFER_PROVIDER_META[p].label).join(', ')}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
