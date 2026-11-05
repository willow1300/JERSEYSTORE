import React, { useEffect, useMemo, useState } from "react";
import { fetchKits, getCachedKits, REMOTE_ENABLED, type Kit } from "../utils/kits";

/* ---------- Types ---------- */
export type { Kit } from "../utils/kits";

export interface BestSellersProps {
  kits?: Kit[];
  cartCount?: number;
  onNavigate?: (label: string) => void;
  onSelectKit?: (kit: Kit) => void;
  onCartClick?: () => void;
  onProfileClick?: () => void;
  onAdd?: (name: string, image?: string, price?: number) => void;
  menuOpen?: boolean;
  setMenuOpen?: (v: boolean) => void;
}

const NAV_LINKS = ["New-Arrival", "All-Kits", "Best-Sellers", "Retro"];

const formatPrice = (n: number) => `Ksh ${n.toLocaleString()}`;

const DEFAULT_KITS: Kit[] = [
  { id: "real-madrid",  name: "Real Madrid",       image: "/images/jerseys/real-madrid.jpg",   price: 2500, inStock: true },
  { id: "barcelona",    name: "Barcelona",         image: "/images/jerseys/barcelona.jpg",     price: 2000, inStock: true },
  { id: "man-united",   name: "Manchester United", image: "/images/jerseys/man-united.jpg",    price: 2000, inStock: true },
  { id: "liverpool",    name: "Liverpool",         image: "/images/jerseys/liverpool.jpg",     price: 2500, inStock: true },
  { id: "arsenal",      name: "Arsenal",           image: "/images/jerseys/arsenal.jpg",       price: 2000, inStock: true },
  { id: "man-city",     name: "Manchester City",   image: "/images/jerseys/man-city.jpg",      price: 1500, inStock: true },
  { id: "chelsea",      name: "Chelsea",           image: "/images/jerseys/chelsea.jpg",       price: 2000, inStock: true },
  { id: "psg",          name: "PSG",               image: "/images/jerseys/psg.jpg",           price: 1500, inStock: true },
];

/* ---------- Sub-components ---------- */
const Header: React.FC<Pick<BestSellersProps, "cartCount" | "onNavigate" | "onCartClick" | "onProfileClick" | "menuOpen" | "setMenuOpen">> = ({
  cartCount = 0,
  onNavigate,
  onCartClick,
  onProfileClick,
  menuOpen = false,
  setMenuOpen,
}) => (
  <header className="topbar">
    <a className="logo" href="#top" aria-label="MJ home" onClick={() => onNavigate?.('New-Arrival')} style={{ cursor: 'pointer' }}><img src="/logos/mjerseyss_logo.svg" alt="MJ Erseys" /></a>

    <nav aria-label="Primary">
      {NAV_LINKS.map((label) => (
        <a key={label} onClick={() => onNavigate?.(label)} style={{ cursor: 'pointer' }}>
          {label.toUpperCase()}
        </a>
      ))}
    </nav>

    <div className="tools">
      <button className="cart-trigger" aria-label={`Bag with ${cartCount} items`} onClick={onCartClick}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg><b>{cartCount}</b></button>
      <button className="wishlist-trigger" aria-label="Wishlist"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg></button>
      <button className="profile-trigger" aria-label="Profile" onClick={onProfileClick}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0 1 16 0v1" /></svg></button>
      <button className="menu-trigger" onClick={() => setMenuOpen?.(!menuOpen)} aria-label="Open navigation"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16" /><path d="M4 17h16" /></svg></button>
    </div>
  </header>
);

const BestCard: React.FC<{ kit: Kit; idx?: number; onSelect?: (kit: Kit) => void; onAdd?: (name: string, image?: string, price?: number) => void }> = ({ kit, idx = 0, onSelect, onAdd }) => {
  const handle = () => {
    if (!kit.inStock) { onSelect?.(kit); return }
    onAdd?.(kit.name, kit.image, kit.price);
    onSelect?.(kit);
  };
  return (
    <article className={`na-card ${kit.inStock ? '' : 'is-out'}`.trim()} style={{ animationDelay: `${Math.min(idx, 14) * 0.055}s` }}>
      <div className="na-image" onClick={handle} role="button" tabIndex={0}>
        <img src={kit.image} alt={kit.name} loading="lazy" />
        {!kit.inStock && <span className="na-stock">SOLD OUT</span>}
      </div>
      <h3 className="na-name">{kit.name}</h3>
      <p className="na-price">{formatPrice(kit.price)}</p>
      <button className="na-btn" onClick={handle} disabled={!kit.inStock}>
        {kit.inStock ? 'SELECT OPTION' : 'NOT IN STOCK'}
      </button>
    </article>
  );
};

const Marquee: React.FC = () => (
  <div className="bs-marquee" aria-hidden="true">
    <div className="bs-marquee-track">
      <span className="bs-marquee-group">
        {Array.from({ length: 6 }).map((_, i) => (
          <React.Fragment key={i}>
            <span className="bs-marquee-word">BEST SELLERS</span>
            <span className="bs-marquee-dot">•</span>
          </React.Fragment>
        ))}
      </span>
      <span className="bs-marquee-group">
        {Array.from({ length: 6 }).map((_, i) => (
          <React.Fragment key={i}>
            <span className="bs-marquee-word">BEST SELLERS</span>
            <span className="bs-marquee-dot">•</span>
          </React.Fragment>
        ))}
      </span>
    </div>
  </div>
);

/* ---------- Page ---------- */
const BestSellers: React.FC<BestSellersProps> = ({
  kits: kitsProp,
  cartCount = 0,
  onNavigate,
  onSelectKit,
  onCartClick,
  onProfileClick,
  onAdd,
  menuOpen = false,
  setMenuOpen,
}) => {
  const cached = getCachedKits();
  const [kits, setKits] = useState<Kit[]>(cached ?? kitsProp ?? (REMOTE_ENABLED ? [] : DEFAULT_KITS));
  const [loading, setLoading] = useState<boolean>(!cached && REMOTE_ENABLED);

  useEffect(() => {
    if (cached) return;
    if (!REMOTE_ENABLED) { setLoading(false); return; }
    let cancelled = false;
    fetchKits()
      .then((res) => {
        if (cancelled) return;
        if (res.length) setKits(res);
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const displayKits = useMemo(() => kits.slice(0, 12), [kits]);

  return (
    <div className="ak-page">
      <Header
        cartCount={cartCount}
        onNavigate={onNavigate}
        onCartClick={onCartClick}
        onProfileClick={onProfileClick}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
      />

      {menuOpen && (
        <nav className="mobile-nav">
          {NAV_LINKS.map((label) => (
            <a key={label} onClick={() => { onNavigate?.(label); setMenuOpen?.(false); }} style={{ cursor: 'pointer' }}>
              {label.toUpperCase()}
            </a>
          ))}
          <a onClick={() => { onProfileClick?.(); setMenuOpen?.(false); }} style={{ cursor: 'pointer' }}>PROFILE</a>
        </nav>
      )}

      <main className="ak-main">
        <Marquee />
        {loading ? (
          <div className="ak-empty">[ LOADING BEST SELLERS… ]</div>
        ) : displayKits.length === 0 ? (
          <div className="ak-empty">[ NO BEST SELLERS YET ]</div>
        ) : (
          <div className="ak-grid">
            {displayKits.map((kit, i) => (
              <BestCard key={kit.id} idx={i} kit={kit} onSelect={onSelectKit} onAdd={onAdd} />
            ))}
          </div>
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

export default BestSellers;
