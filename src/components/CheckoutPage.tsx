import React, { useEffect, useState } from "react";
import {
  DELIVERY_ENABLED,
  deliveryFeeFor,
  deliveryLabel,
  defaultDeliveryFee,
  defaultZone,
  fetchDeliveryZones,
  getCachedDeliveryZones,
  type DeliveryZone,
} from "../utils/delivery";

/* ---------- Types ---------- */
export interface CartLine {
  name: string;
  size: string;
  qty: number;
  delivery: string;
  image?: string;
  price?: number;
}

export interface CheckoutPageProps {
  cartItems: CartLine[];
  cartCount: number;
  account: string | null;
  onPlaced: () => void;
  onNavigate?: (label: string) => void;
  menuOpen?: boolean;
  setMenuOpen?: (v: boolean) => void;
}

const NAV_LINKS = ["New-Arrival", "All-Kits", "Best-Sellers", "Retro"];
const formatPrice = (n: number) => `Ksh ${n.toLocaleString()}`;

/* ---------- Header (mirrors landing) ---------- */
const Header: React.FC<Pick<CheckoutPageProps, "cartCount" | "onNavigate" | "menuOpen" | "setMenuOpen">> = ({
  cartCount = 0,
  onNavigate,
  menuOpen = false,
  setMenuOpen,
}) => (
  <header className="topbar">
    <a className="logo" href="#top" aria-label="MJ home" onClick={() => onNavigate?.('New-Arrival')} style={{ cursor: 'pointer' }}><img src="/logos/mjerseyss_logo.svg" alt="MJ Erseys" /></a>
    <nav aria-label="Primary">
      {NAV_LINKS.map((label) => (
        <a key={label} onClick={() => onNavigate?.(label)} style={{ cursor: 'pointer' }}>{label.toUpperCase()}</a>
      ))}
    </nav>
    <div className="tools">
      <button className="cart-trigger" aria-label={`Bag with ${cartCount} items`}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg><b key={cartCount}>{cartCount}</b></button>
      <button className="wishlist-trigger" aria-label="Wishlist"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg></button>
      <button className="profile-trigger" aria-label="Profile"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0 1 16 0v1" /></svg></button>
      <button className="menu-trigger" onClick={() => setMenuOpen?.(!menuOpen)} aria-label="Open navigation"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16" /><path d="M4 17h16" /></svg></button>
    </div>
  </header>
);

/* ---------- Page ---------- */
const CheckoutPage: React.FC<CheckoutPageProps> = ({
  cartItems,
  cartCount,
  account,
  onPlaced,
  onNavigate,
  menuOpen = false,
  setMenuOpen,
}) => {
  const [placed, setPlaced] = useState(false);
  const [orderRef] = useState(() => 'MJ-' + Math.random().toString(36).slice(2, 8).toUpperCase());
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [paidTotal, setPaidTotal] = useState(0);
  const [placedArea, setPlacedArea] = useState('');

  // Areas + fees come from BaseRow; empty means the flat fallback fee applies.
  const [zones, setZones] = useState<DeliveryZone[]>(() => getCachedDeliveryZones() ?? []);
  const [zoneId, setZoneId] = useState('');

  useEffect(() => {
    if (!DELIVERY_ENABLED || zones.length) return;
    let alive = true;
    fetchDeliveryZones()
      .then((z) => { if (alive) setZones(z); })
      .catch((e) => console.warn('[Checkout] delivery areas unavailable:', e));
    return () => { alive = false; };
  }, []);

  const linesTotal = cartItems.reduce((s, i) => s + (i.price ?? 0) * i.qty, 0);
  const hasDelivery = cartItems.some((i) => i.delivery === 'delivery');
  const zoneFee = deliveryFeeFor(zones, zoneId);
  const shipping = hasDelivery ? zoneFee : 0;
  const total = linesTotal + shipping;

  const defaultFee = defaultDeliveryFee(zones);
  const areaZone = defaultZone(zones);
  // The default option shows the flagged row's name when there is one.
  const defaultLabel = areaZone ? areaZone.location : 'DEFAULT AREA';
  // Only the one row acting as default is folded into the default option; if two
  // rows are flagged the rest still stay selectable.
  const listedZones = zones.filter((z) => z.id !== (areaZone?.id ?? ''));
  const areaLabel = hasDelivery ? deliveryLabel(zones, zoneId) : 'PICK AT SHOP';

  const confirm = () => {
    if (!name.trim()) { setError('ENTER YOUR NAME'); return; }
    if (phone.trim().length < 9) { setError('ENTER A VALID PHONE FOR M-PESA'); return; }
    setError('');
    setPaidTotal(total);
    setPlacedArea(`${areaLabel} · ${shipping ? formatPrice(shipping) : 'FREE'}`);
    setPlaced(true);
    onPlaced();
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="ak-page">
      <Header cartCount={cartCount} onNavigate={onNavigate} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      {menuOpen && (
        <nav className="mobile-nav">
          {NAV_LINKS.map((label) => (
            <a key={label} onClick={() => { onNavigate?.(label); setMenuOpen?.(false); }} style={{ cursor: 'pointer' }}>{label.toUpperCase()}</a>
          ))}
          <a onClick={() => { setMenuOpen?.(false); }} style={{ cursor: 'pointer' }}>PROFILE</a>
        </nav>
      )}

      <main className="ak-main">
        <div className="pp-crumb">
          <a className="ak-home" onClick={() => onNavigate?.('New-Arrival')} role="button" tabIndex={0}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10V20h13V10" /><path d="M10 20v-5h4v5" />
            </svg>
            <span>HOME</span>
          </a>
          <span className="ak-sep">/</span>
          <span className="ak-current">CHECKOUT</span>
        </div>

        {placed ? (
          <section className="ck-success">
            <div className="ck-check">✓</div>
            <h2 className="ck-success-title">ORDER PLACED</h2>
            <p className="ck-success-ref">[ REF {orderRef} ]</p>
            <p className="ck-success-note">
              {formatPrice(paidTotal)} WILL BE SENT TO {phone.trim()} AS AN M-PESA PROMPT
              {placedArea ? ` · ${placedArea.toUpperCase()}` : ''}
              {account ? ` · ACCOUNT ${account.toUpperCase()}` : ''}
            </p>
            <button className="ck-back" onClick={() => onNavigate?.('New-Arrival')}>CONTINUE SHOPPING</button>
          </section>
        ) : cartItems.length === 0 ? (
          <div className="ak-empty">[ YOUR CART IS EMPTY — ADD SOME KITS ]</div>
        ) : (
          <section className="ck-grid">
            <div className="ck-form">
              <h3 className="ck-heading">DELIVERY DETAILS</h3>

              <div className="ck-field">
                <label className="pp-label">FULL NAME</label>
                <input className="ck-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name on the order" />
              </div>

              <div className="ck-field">
                <label className="pp-label">PHONE (M-PESA)</label>
                <input className="ck-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="07XX XXX XXX" inputMode="tel" />
              </div>

              {hasDelivery && listedZones.length > 0 && (
                <div className="ck-field">
                  <label className="pp-label" htmlFor="ck-area">DELIVERY AREA</label>
                  <select
                    id="ck-area"
                    className="ck-input ck-select"
                    value={zoneId}
                    onChange={(e) => setZoneId(e.target.value)}
                  >
                    <option value="">{defaultLabel} — {formatPrice(defaultFee)}</option>
                    {listedZones.map((z) => (
                      <option key={z.id} value={z.id}>{z.location} — {formatPrice(z.fee)}</option>
                    ))}
                  </select>
                </div>
              )}

              {hasDelivery && (
                <div className="ck-field">
                  <label className="pp-label">ORDER NOTE / AREA</label>
                  <input className="ck-input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Nearest landmark, estate, etc." />
                </div>
              )}

              <div className="ck-fulfill-list">
                {cartItems.map((i, idx) => (
                  <div className="ck-fulfill-row" key={idx}>
                    <span>{i.name} · {i.size} · ×{i.qty}</span>
                    <b>{i.delivery === 'delivery' ? 'DELIVERY' : 'PICK AT SHOP'}</b>
                  </div>
                ))}
              </div>

              {account ? (
                <p className="ck-account">ORDER SAVED TO {account.toUpperCase()}</p>
              ) : (
                <p className="ck-account dim">NO ACCOUNT — THIS ORDER WILL NOT BE SAVED AFTER CHECKOUT</p>
              )}

              {error && <p className="ck-error">{error}</p>}

              <button className="ck-confirm" onClick={confirm}>
                CONFIRM ORDER — {formatPrice(total)}
              </button>
              <button className="ck-edit" onClick={() => onNavigate?.('cart')}>← EDIT CART</button>
            </div>

            <aside className="ck-summary">
              <h3 className="ck-heading">ORDER SUMMARY</h3>
              {cartItems.map((i, idx) => (
                <div className="ck-item" key={idx}>
                  <div className="ck-item-img">{i.image ? <img src={i.image} alt={i.name} /> : <span>KIT</span>}</div>
                  <div className="ck-item-body">
                    <div className="ck-item-name">{i.name}</div>
                    <div className="ck-item-meta">SIZE {i.size} · QTY {i.qty} · {i.delivery === 'delivery' ? 'DELIVERY' : 'PICKUP'}</div>
                    <div className="ck-item-price">{formatPrice((i.price ?? 0) * i.qty)}</div>
                  </div>
                </div>
              ))}
              <div className="ck-totals">
                <div className="ck-total-row"><span>SUBTOTAL</span><b>{formatPrice(linesTotal)}</b></div>
                <div className="ck-total-row"><span>DELIVERY{hasDelivery && zones.length ? ` · ${areaLabel}` : ''}</span><b>{shipping ? formatPrice(shipping) : 'FREE'}</b></div>
                <div className="ck-total-row ck-grand"><span>TOTAL</span><b>{formatPrice(total)}</b></div>
              </div>
            </aside>
          </section>
        )}
      </main>

      <footer>
        <div className="logo"><img src="/logos/mjerseyss_logo.svg" alt="MJ Erseys" /></div>
        <p>INDEPENDENT FOOTBALL ARCHIVE<br />EST. 2026 / WORLDWIDE</p>
        <div><a href="#shop">SHOP</a><a href="#story">STORY</a><a href="#top">TOP ↑</a></div>
      </footer>
    </div>
  );
};

export default CheckoutPage;
