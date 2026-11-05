import React, { useEffect, useState } from "react";
import { retroKits as localKits } from "../data/retroKits";
import { fetchKits, getCachedKits, REMOTE_ENABLED, type Kit } from "../utils/kits";

/* ---------- Types ---------- */
export type { Kit } from "../utils/kits";

export interface RetroProps {
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

/* ---------- Sub-components ---------- */
const Header: React.FC<Pick<RetroProps, "cartCount" | "onNavigate" | "onCartClick" | "onProfileClick" | "menuOpen" | "setMenuOpen">> = ({
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
        <a
          key={label}
          onClick={() => onNavigate?.(label)}
          style={{ cursor: 'pointer' }}
        >
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

const RetroCard: React.FC<{ kit: Kit; idx?: number; onSelect?: (kit: Kit) => void; onAdd?: (name: string, image?: string, price?: number) => void }> = ({ kit, idx = 0, onSelect, onAdd }) => {
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

/* ---------- Page ---------- */
const Retro: React.FC<RetroProps> = ({
  cartCount = 0,
  onNavigate,
  onSelectKit,
  onCartClick,
  onProfileClick,
  onAdd,
  menuOpen = false,
  setMenuOpen,
}) => {
  const cachedKits = getCachedKits();
  const [kits, setKits] = useState<Kit[]>(
    cachedKits ? cachedKits.filter((k) => k.retro) : []
  );
  const [loading, setLoading] = useState<boolean>(!cachedKits && REMOTE_ENABLED);
  const [filterOpen, setFilterOpen] = useState(false);
  const [sort, setSort] = useState<'DEFAULT' | 'A-Z' | 'Z-A'>('DEFAULT');

  useEffect(() => {
    if (cachedKits) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        if (REMOTE_ENABLED) {
          const all = await fetchKits();
          const retro = all.filter((k) => k.retro);
          if (!cancelled) setKits(retro.length ? retro : localKits.map((k) => ({ ...k, retro: true, sizes: [], gallery: [k.image], isNew: false })));
        } else {
          if (!cancelled)
            setKits(
              localKits.map((k) => ({
                id: k.id,
                name: k.name,
                image: k.image,
                price: k.price,
                inStock: k.inStock,
                retro: true,
                sizes: [],
                gallery: [k.image],
                isNew: false,
              }))
            );
        }
      } catch (e) {
        console.error("Failed to load retro kits", e);
        if (!cancelled) setKits([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const displayKits = React.useMemo(() => {
    if (sort === 'DEFAULT') return kits;
    const arr = [...kits];
    arr.sort((a, b) => sort === 'A-Z' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
    return arr;
  }, [kits, sort]);

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
            <a
              key={label}
              onClick={() => { onNavigate?.(label); setMenuOpen?.(false); }}
              style={{ cursor: 'pointer' }}
            >
              {label.toUpperCase()}
            </a>
          ))}
          <a onClick={() => { onProfileClick?.(); setMenuOpen?.(false); }} style={{ cursor: 'pointer' }}>PROFILE</a>
        </nav>
      )}

      <main className="ak-main">
        <div className="ak-head-row">
          <div className="ak-breadcrumb">
            <a className="ak-home" onClick={() => onNavigate?.('New-Arrival')} role="button" tabIndex={0} aria-label="Home">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11.5 12 4l9 7.5" />
                <path d="M5.5 10V20h13V10" />
                <path d="M10 20v-5h4v5" />
              </svg>
              <span>HOME</span>
            </a>
            <span className="ak-sep">/</span>
            <span className="ak-current">RETRO</span>
          </div>
          <button className="ak-filters" onClick={() => setFilterOpen(!filterOpen)}>
            FILTERS {filterOpen ? '−' : '+'}
          </button>
        </div>
        {filterOpen && (
          <div className="ak-filter-tray">
            {(['DEFAULT','A-Z','Z-A'] as const).map((item) => (
              <button
                key={item}
                className={sort === item ? 'active' : ''}
                onClick={() => setSort(item)}
              >
                [ {item} ]
              </button>
            ))}
          </div>
        )}
        {loading ? (
          <div className="ak-empty">[ LOADING RETRO KITS… ]</div>
        ) : displayKits.length === 0 ? (
          <div className="ak-empty">[ NO RETRO KITS YET ]</div>
        ) : (
          <div className="ak-grid">
            {displayKits.map((kit, i) => (
              <RetroCard key={kit.id} idx={i} kit={kit} onSelect={onSelectKit} onAdd={onAdd} />
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

export default Retro;
