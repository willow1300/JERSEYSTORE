import React, { useEffect, useState } from "react";
import {
  DELIVERY_ENABLED,
  countyHasAreas,
  deliveryOptions,
  fetchCountyPrices,
  fetchDeliveryZones,
  getCachedCountyPrices,
  getCachedDeliveryZones,
  type DeliveryZone,
} from "../utils/delivery";
import { WHATSAPP_NUMBER, WHATSAPP_ORDER_TEXT } from "../utils/constants";
import { ORDERS_ENABLED, submitOrder } from "../utils/orders";
import { INTASEND_ENABLED, startIntaSendCheckout } from "../utils/payments";
import MobileNav, { BottomNav } from "./MobileNav";

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
  onProfileClick?: () => void;
  menuOpen?: boolean;
  setMenuOpen?: (v: boolean) => void;
}

const NAV_LINKS = ["New-Arrival", "All-Kits", "Best-Sellers", "Retro"];
const formatPrice = (n: number) => `Ksh ${n.toLocaleString()}`;

/* ---------- Header (mirrors landing) ---------- */
const Header: React.FC<Pick<CheckoutPageProps, "cartCount" | "onNavigate" | "onProfileClick" | "menuOpen" | "setMenuOpen">> = ({
  cartCount = 0,
  onNavigate,
  onProfileClick,
  menuOpen = false,
  setMenuOpen,
}) => (
  <header className="topbar">
    <a className="logo" href="#top" aria-label="MJ home" onClick={() => onNavigate?.('New-Arrival')} style={{ cursor: 'pointer' }}><img src="/logos/mjerseyss_logo.svg" alt="mjerseyss" /></a>
    <nav aria-label="Primary">
      {NAV_LINKS.map((label) => (
        <a key={label} onClick={() => onNavigate?.(label)} style={{ cursor: 'pointer' }}>{label.toUpperCase()}</a>
      ))}
    </nav>
    <div className="tools">
      <button className="cart-trigger" aria-label={`Bag with ${cartCount} items`}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg><b key={cartCount}>{cartCount}</b></button>
      <button className="wishlist-trigger" aria-label="Wishlist"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg></button>
      <button className="profile-trigger" aria-label="Profile" onClick={onProfileClick}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0 1 16 0v1" /></svg></button>
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
  onProfileClick,
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
  const [chatUrl, setChatUrl] = useState('');
  const [orderSaved, setOrderSaved] = useState<boolean | null>(null);
  const [paying, setPaying] = useState(false);

  // Priced areas come from BaseRow; every Kenyan county is offered alongside
  // them. Priced areas are charged at checkout, counties without a price go to
  // WhatsApp after the order is placed to agree the fee.
  const [zones, setZones] = useState<DeliveryZone[]>(() => getCachedDeliveryZones() ?? []);
  const [countyFees, setCountyFees] = useState<Map<string, number>>(() => getCachedCountyPrices() ?? new Map());
  const [countyId, setCountyId] = useState('');
  const [zoneId, setZoneId] = useState('');

  useEffect(() => {
    let alive = true;
    if (DELIVERY_ENABLED && !zones.length) {
      fetchDeliveryZones()
        .then((z) => { if (alive) setZones(z); })
        .catch((e) => console.warn('[Checkout] delivery areas unavailable:', e));
    }
    fetchCountyPrices()
      .then((f) => { if (alive) setCountyFees(f); })
      .catch((e) => console.warn('[Checkout] county prices unavailable:', e));
    return () => { alive = false; };
  }, []);

  const linesTotal = cartItems.reduce((s, i) => s + (i.price ?? 0) * i.qty, 0);
  const hasDelivery = cartItems.some((i) => i.delivery === 'delivery');

  // Counties are always listed; choosing one that the table prices (Nairobi)
  // opens a second picker for the specific area, whose fee is charged at
  // checkout. Other counties carry a flat fee from the County table
  // (near-Nairobi 250, western/northern/coastal 350); without either, the fee
  // is agreed on WhatsApp after the order.
  const countyOptions = deliveryOptions(zones, countyFees).filter((o) => o.kind === 'county');
  const chosenCounty = countyOptions.find((o) => o.id === countyId) ?? null;
  const countyLabel = chosenCounty?.label ?? '';
  const hasAreas = Boolean(chosenCounty && countyHasAreas(zones, chosenCounty.label));
  const chosenArea = hasAreas ? (zones.find((z) => z.id === zoneId) ?? null) : null;
  // Fee sources, most specific first: a priced area (Nairobi), then a flat
  // county price, otherwise null and the fee is agreed on WhatsApp.
  const deliveryFee = chosenArea?.fee ?? chosenCounty?.fee ?? null;
  const areaLabel = hasDelivery
    ? (hasAreas && chosenArea ? `${countyLabel} · ${chosenArea.location}` : countyLabel || 'PICK AT SHOP')
    : 'PICK AT SHOP';
  const deliveryPriced = hasDelivery && deliveryFee != null;
  // The delivery fee is charged at checkout only when the picked area/county has a price.
  const total = linesTotal + (deliveryPriced ? (deliveryFee ?? 0) : 0);

  // WhatsApp message carrying the order details so the delivery fee can be
  // agreed in chat instead of being charged at checkout.
  const deliveryChatUrl = () => {
    const lines = cartItems
      .map((i) => `• ${i.name} · ${i.size} · ×${i.qty} (${i.delivery === 'delivery' ? 'Delivery' : 'Pickup'})`)
      .join('\n');
    const greeting = WHATSAPP_ORDER_TEXT.replace('{orderRef}', orderRef);
    const msg = [
      greeting,
      `Name: ${name.trim()}`,
      `Phone: ${phone.trim()}`,
      'Items:',
      lines,
      note.trim() ? `Area / Note: ${note.trim()}` : '',
      `I have paid ${formatPrice(total)} for the kits — let's agree on the delivery fee for ${areaLabel}.`,
    ].filter(Boolean).join('\n');
    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;
  };

  const confirm = async () => {
    if (!name.trim()) { setError('ENTER YOUR NAME'); return; }
    if (phone.trim().length < 9) { setError('ENTER A VALID PHONE FOR M-PESA'); return; }
    if (hasDelivery && !chosenCounty) { setError('SELECT YOUR DELIVERY COUNTY'); return; }
    if (hasDelivery && hasAreas && !chosenArea) { setError(`SELECT YOUR AREA IN ${countyLabel.toUpperCase()}`); return; }
    setError('');

    const itemsText = cartItems
      .map((i) => `${i.name} · ${i.size} · ×${i.qty} · ${i.delivery === 'delivery' ? 'Delivery' : 'Pickup'}`)
      .join('\n');

    // IntaSend route (when enabled): the checkout function validates the order,
    // saves it to BaseRow and returns the hosted payment URL. The webhook marks
    // the order paid once the money lands.
    if (INTASEND_ENABLED && !paying) {
      setPaying(true);
      try {
        const url = await startIntaSendCheckout({
          name: name.trim(),
          phone: phone.trim(),
          items: itemsText,
          amount: total,
          fulfillment: hasDelivery ? 'Delivery' : 'Pickup',
          area: hasDelivery ? areaLabel : 'Pick at shop',
          note: note.trim(),
          account: account || '',
        });
        window.location.assign(url);
        return;
      } catch (e) {
        setPaying(false);
        setError(e instanceof Error ? e.message : 'PAYMENT UNAVAILABLE — TRY AGAIN');
        return;
      }
    }

    setPaidTotal(total);
    setPlacedArea(hasDelivery
      ? (deliveryPriced ? `${areaLabel} · ${formatPrice(deliveryFee ?? 0)} INCLUDED` : `${areaLabel} · FEE AGREED ON CHAT`)
      : 'PICK AT SHOP · FREE');
    // Areas without a price go straight to WhatsApp so the fee is agreed there;
    // priced areas are charged at checkout and need no chat.
    if (hasDelivery && !deliveryPriced) {
      const url = deliveryChatUrl();
      setChatUrl(url);
      // Straight to chat after paying so the delivery fee is agreed there.
      window.open(url, '_blank', 'noopener');
    }
    // Save the order to BaseRow so the shop has a record of it (never blocks checkout).
    if (ORDERS_ENABLED) {
      submitOrder({
        orderRef,
        name: name.trim(),
        phone: phone.trim(),
        items: itemsText,
        amount: total,
        fulfillment: hasDelivery ? 'Delivery' : 'Pickup',
        area: hasDelivery ? areaLabel : 'Pick at shop',
        note: note.trim(),
        account: account || '',
        placedAt: new Date().toISOString(),
      }).then(setOrderSaved).catch(() => {});
    }
    setPlaced(true);
    onPlaced();
    window.scrollTo({ top: 0 });
  };

  return (
    <div className="ak-page">
      <Header cartCount={cartCount} onNavigate={onNavigate} onProfileClick={onProfileClick} menuOpen={menuOpen} setMenuOpen={setMenuOpen} />

      <MobileNav
        menuOpen={menuOpen} setMenuOpen={setMenuOpen} cartCount={cartCount}
        onHome={() => { onNavigate?.("New-Arrival"); setMenuOpen?.(false); }}
        onKits={() => { onNavigate?.("All-Kits"); setMenuOpen?.(false); }}
        onCart={() => { onNavigate?.("cart"); setMenuOpen?.(false); }}
        onProfile={() => { onProfileClick?.(); setMenuOpen?.(false); }}
        onBestSellers={() => { onNavigate?.("Best-Sellers"); setMenuOpen?.(false); }}
        onRetro={() => { onNavigate?.("Retro"); setMenuOpen?.(false); }}
      />
      <BottomNav
        active="cart"
        cartCount={cartCount}
        onHome={() => { onNavigate?.("New-Arrival"); setMenuOpen?.(false); }}
        onKits={() => { onNavigate?.("All-Kits"); setMenuOpen?.(false); }}
        onCart={() => { onNavigate?.("cart"); setMenuOpen?.(false); }}
        onProfile={() => { onProfileClick?.(); setMenuOpen?.(false); }}
      />

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
            {orderSaved && (
              <p className="ck-account">ORDER SAVED TO OUR RECORDS ✓ — WE'LL CONFIRM VIA WHATSAPP</p>
            )}
            {hasDelivery && !deliveryPriced && (
              <a className="ck-confirm" href={chatUrl} target="_blank" rel="noopener noreferrer">
                AGREE DELIVERY FEE ON WHATSAPP
              </a>
            )}
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

              {hasDelivery && (
                <>
                  <div className="ck-field">
                    <label className="pp-label" htmlFor="ck-area">DELIVERY COUNTY</label>
                    <select
                      id="ck-area"
                      className="ck-input ck-select"
                      value={countyId}
                      onChange={(e) => { setCountyId(e.target.value); setZoneId(''); }}
                    >
                      <option value="">[ SELECT YOUR COUNTY ]</option>
                      {countyOptions.map((o) => (
                        <option key={o.id} value={o.id}>{o.label}{o.fee != null ? ` — ${formatPrice(o.fee)}` : ''}</option>
                      ))}
                    </select>
                    <p className="ck-hint">PRICED COUNTIES ARE CHARGED AT CHECKOUT · OTHERS ARE AGREED ON WHATSAPP</p>
                  </div>
                  {hasAreas && (
                    <div className="ck-field">
                      <label className="pp-label" htmlFor="ck-zone">SPECIFIC AREA IN {countyLabel.toUpperCase()}</label>
                      <select
                        id="ck-zone"
                        className="ck-input ck-select"
                        value={zoneId}
                        onChange={(e) => setZoneId(e.target.value)}
                      >
                        <option value="">[ SELECT YOUR AREA ]</option>
                        {zones.map((z) => (
                          <option key={z.id} value={z.id}>{z.location} — {formatPrice(z.fee)}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </>
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
                <>
                  <p className="ck-account dim">CHECKING OUT AS GUEST — NO ACCOUNT NEEDED</p>
                  <button type="button" className="ck-edit" onClick={() => onProfileClick?.()} style={{ marginBottom: 8 }}>
                    CREATE ACCOUNT / SIGN IN (OPTIONAL)
                  </button>
                </>
              )}

              {error && <p className="ck-error">{error}</p>}

              <button className="ck-confirm" onClick={confirm} disabled={paying}>
                {paying ? 'OPENING PAYMENT…' : INTASEND_ENABLED ? 'PAY NOW' : 'CONFIRM ORDER'} — {formatPrice(total)}
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
                <div className="ck-total-row"><span>DELIVERY{hasDelivery && countyLabel ? ` · ${countyLabel}${hasAreas && chosenArea ? ` · ${chosenArea.location}` : ''}${deliveryPriced ? ` · ${formatPrice(deliveryFee ?? 0)}` : ''}` : ''}</span><b>{hasDelivery ? (deliveryPriced ? formatPrice(deliveryFee ?? 0) : 'AGREE ON CHAT') : 'FREE'}</b></div>
                <div className="ck-total-row ck-grand"><span>TOTAL</span><b>{formatPrice(total)}</b></div>
              </div>
            </aside>
          </section>
        )}
      </main>
    </div>
  );
};

export default CheckoutPage;
