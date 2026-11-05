import React, { useState, useEffect, useMemo, useRef } from "react";
import type { Product } from "../data/types";

/* ---------- Types ---------- */
export interface ProductPageProps {
  product: Product | null;
  catalog: Product[];
  cartCount?: number;
  onNavigate?: (label: string) => void;
  onHome?: () => void;
  onAddToCart?: (name: string, image: string, price: number, qty: number, size: string, delivery: 'delivery' | 'pickup') => void;
  wishlistIds?: string[];
  onToggleWishlist?: (p: Product) => void;
  onOpenAuth?: () => void;
  menuOpen?: boolean;
  setMenuOpen?: (v: boolean) => void;
}

const NAV_LINKS = ["New-Arrival", "All-Kits", "Best-Sellers", "Retro"];
const DEFAULT_SIZES = ["S", "M", "L", "XL", "XXL"];

const formatPrice = (n: number) => `Ksh ${n.toLocaleString()}`;

/* ---------- Header (mirrors landing) ---------- */
const Header: React.FC<Pick<ProductPageProps, "cartCount" | "onNavigate" | "menuOpen" | "setMenuOpen" | "onHome" | "onOpenAuth">> = ({
  cartCount = 0,
  onNavigate,
  menuOpen = false,
  setMenuOpen,
  onHome,
  onOpenAuth,
}) => (
  <header className="topbar">
    <a className="logo" href="#top" aria-label="MJ home" onClick={() => onNavigate?.('New-Arrival')} style={{ cursor: 'pointer' }}><img src="/logos/mjerseyss_logo.svg" alt="MJ Erseys" /></a>
    <nav aria-label="Primary">
      {NAV_LINKS.map((label) => (
        <a key={label} onClick={() => onNavigate?.(label)} style={{ cursor: 'pointer' }}>{label.toUpperCase()}</a>
      ))}
    </nav>
    <div className="tools">
      <button className="cart-trigger" aria-label={`Bag with ${cartCount} items`}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg><b>{cartCount}</b></button>
      <button className="wishlist-trigger" aria-label="Wishlist"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" /></svg></button>
      <button className="profile-trigger" aria-label="Profile" onClick={() => onOpenAuth?.()} style={{ cursor: 'pointer' }}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0 1 16 0v1" /></svg></button>
      <button className="menu-trigger" onClick={() => setMenuOpen?.(!menuOpen)} aria-label="Open navigation"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16" /><path d="M4 17h16" /></svg></button>
    </div>
  </header>
);

/* ---------- Card used inside the related carousel ---------- */
const RelatedCard: React.FC<{ item: Product; idx?: number; onOpen: (p: Product) => void }> = ({ item, idx = 0, onOpen }) => (
  <article className="na-card" style={{ animationDelay: `${Math.min(idx, 14) * 0.055}s` }}>
    <div className="na-image" onClick={() => onOpen(item)} role="button" tabIndex={0}>
      <img src={item.image} alt={item.name} loading="lazy" />
    </div>
    <h3 className="na-name">{item.name}</h3>
    <p className="na-price">{formatPrice(item.price)}</p>
    <button className="na-btn" onClick={() => onOpen(item)}>SELECT OPTION</button>
  </article>
);

/* ---------- Single-row carousel for related products ---------- */
const RelatedCarousel: React.FC<{ items: Product[]; onOpen: (p: Product) => void }> = ({ items, onOpen }) => {
  const topRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: -1 | 1) => {
    const el = topRef.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('.na-card');
    const step = card ? card.offsetWidth + 24 : 480;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  if (!items.length) return <div className="ak-empty">[ NO RELATED PRODUCTS YET ]</div>;

  return (
    <div className="na-carousel">
      <div className="na-row">
        <button className="na-arrow na-arrow-left" onClick={() => scroll(-1)} aria-label="Scroll left">‹</button>
        <div className="na-track" ref={topRef}>
          {items.map((p, i) => <RelatedCard key={p.id} item={p} idx={i} onOpen={onOpen} />)}
        </div>
        <button className="na-arrow na-arrow-right" onClick={() => scroll(1)} aria-label="Scroll right">›</button>
      </div>
    </div>
  );
};

/* ---------- Page ---------- */
const ProductPage: React.FC<ProductPageProps & { onSelectProduct?: (p: Product) => void }> = ({
  product,
  catalog,
  cartCount = 0,
  onNavigate,
  onHome,
  onAddToCart,
  wishlistIds = [],
  onToggleWishlist,
  menuOpen = false,
  setMenuOpen,
  onSelectProduct,
}) => {
  const [sizeOpen, setSizeOpen] = useState(false);
  const [size, setSize] = useState<string | null>(null);
  const [delivery, setDelivery] = useState<'delivery' | 'pickup'>('delivery');
  const [qty, setQty] = useState(1);
  const [mainImage, setMainImage] = useState<string>('');
  const [added, setAdded] = useState(false);

  // Reset state when navigating to a different product
  useEffect(() => {
    setSizeOpen(false);
    setSize(null);
    setQty(1);
    setDelivery('delivery');
    setAdded(false);
    if (product) setMainImage(product.image);
  }, [product?.id]);

  const availableSizes = product?.sizes && product.sizes.length ? product.sizes : DEFAULT_SIZES;
  const gallery = useMemo(() => {
    if (!product) return [] as string[];
    const g = product.gallery && product.gallery.length ? product.gallery : [product.image];
    return Array.from(new Set(g));
  }, [product]);

  const related = useMemo(() => {
    if (!product) return [] as Product[];
    const key = (product.club || product.id).toLowerCase();
    const nameFirst = product.name.toLowerCase().split(/\s+/)[0];
    const sameClub = catalog.filter((p) =>
      p.id !== product.id &&
      (
        (p.club && p.club.toLowerCase() === key) ||
        p.id.toLowerCase().startsWith(key) ||
        p.name.toLowerCase().startsWith(nameFirst)
      )
    );
    if (sameClub.length >= 2) return sameClub.slice(0, 12);
    // Fall back to any other products, still keeping same-club first
    const others = catalog.filter((p) => p.id !== product.id);
    const extras = others.filter((p) => !sameClub.some((s) => s.id === p.id));
    return [...sameClub, ...extras].slice(0, 12);
  }, [product, catalog]);

  if (!product) {
    return (
      <div className="ak-page">
        <Header cartCount={cartCount} onNavigate={onNavigate} menuOpen={menuOpen} setMenuOpen={setMenuOpen} onHome={onHome} />
        <main className="ak-main"><div className="ak-empty">[ PRODUCT NOT FOUND ]</div></main>
        <footer>
          <div className="logo"><img src="/logos/mjerseyss_logo.svg" alt="MJ Erseys" /></div>
          <p>INDEPENDENT FOOTBALL ARCHIVE<br />EST. 2026 / WORLDWIDE</p>
          <div><a href="#shop">SHOP</a><a href="#story">STORY</a><a href="#top">TOP ↑</a></div>
        </footer>
      </div>
    );
  }

  // Stock comes from the BaseRow column; undefined is treated as available.
  const outOfStock = product.inStock === false;
  const canAdd = size !== null && !outOfStock;
  const wishlisted = wishlistIds.includes(product.id);
  const handleAdd = () => {
    if (outOfStock) return;
    if (!canAdd) { setSizeOpen(true); return; }
    onAddToCart?.(product.name, product.image, product.price, qty, size, delivery);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div className="ak-page">
      <Header cartCount={cartCount} onNavigate={onNavigate} menuOpen={menuOpen} setMenuOpen={setMenuOpen} onHome={onHome} />

      {menuOpen && (
        <nav className="mobile-nav">
          {NAV_LINKS.map((label) => (
            <a key={label} onClick={() => { onNavigate?.(label); setMenuOpen?.(false); }} style={{ cursor: 'pointer' }}>{label.toUpperCase()}</a>
          ))}
          <a onClick={() => { setMenuOpen?.(false); }} style={{ cursor: 'pointer' }}>PROFILE</a>
        </nav>
      )}

      <main className="ak-main pp-main">
        <div className="pp-crumb">
          <a className="ak-home" onClick={() => onNavigate?.('New-Arrival')} role="button" tabIndex={0}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10V20h13V10" /><path d="M10 20v-5h4v5" />
            </svg>
            <span>HOME</span>
          </a>
          <span className="ak-sep">/</span>
          <span className="ak-current">{product.name.toUpperCase()}</span>
        </div>

        <section className="pp-hero" key={product.id}>
          <div className="pp-media">
            <div className="pp-main-image">
              <img src={mainImage || product.image} alt={product.name} />
            </div>
            {gallery.length > 1 && (
              <div className="pp-thumbs">
                {gallery.map((g) => (
                  <button
                    key={g}
                    className={`pp-thumb ${g === (mainImage || product.image) ? 'active' : ''}`}
                    onClick={() => setMainImage(g)}
                    aria-label="Preview image"
                  >
                    <img src={g} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="pp-info">
            <h1 className="pp-name">{product.name}</h1>
            <p className="pp-price">{formatPrice(product.price)}</p>
            {outOfStock && <p className="pp-stock pp-stock-out">NOT IN STOCK</p>}

            <div className="pp-field">
              <label className="pp-label">SIZE</label>
              <div className="pp-size-wrap">
                <button
                  type="button"
                  className={`pp-size-trigger ${size ? 'filled' : ''}`}
                  onClick={() => setSizeOpen((o) => !o)}
                  aria-expanded={sizeOpen}
                >
                  <span>{size ? `SIZE: ${size}` : 'SELECT OPTION'}</span>
                  <span className="pp-caret">{sizeOpen ? '▲' : '▼'}</span>
                </button>
                {sizeOpen && (
                  <div className="pp-size-menu" role="listbox">
                    {availableSizes.map((s) => (
                      <button
                        key={s}
                        role="option"
                        aria-selected={size === s}
                        className={size === s ? 'active' : ''}
                        onClick={() => { setSize(s); setSizeOpen(false); }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pp-field">
              <label className="pp-label">FULFILLMENT</label>
              <div className="pp-fulfill">
                <button className={delivery === 'delivery' ? 'active' : ''} onClick={() => setDelivery('delivery')}>DELIVERY</button>
                <button className={delivery === 'pickup' ? 'active' : ''} onClick={() => setDelivery('pickup')}>PICK AT SHOP</button>
              </div>
            </div>

            <div className="pp-buy">
              <div className="pp-qty" role="group" aria-label="Quantity">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="Decrease">−</button>
                <span>{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} aria-label="Increase">+</button>
              </div>
              <button className={`pp-add ${outOfStock ? 'disabled' : canAdd ? '' : 'warn'}`} onClick={handleAdd} disabled={outOfStock}>
                {outOfStock ? 'NOT IN STOCK' : added ? '✓ ADDED' : 'ADD TO CART'}
              </button>
            </div>

            <div className="pp-divider" />

            <div className="pp-social">
              <button className="pp-social-btn" onClick={() => onToggleWishlist?.(product)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                <span>{wishlisted ? 'Added to Wishlist' : 'Add to Wishlist'}</span>
              </button>
              <button className="pp-social-btn" onClick={() => {
                const url = typeof window !== 'undefined' ? window.location.href : '';
                if (navigator.clipboard && url) navigator.clipboard.writeText(url).catch(() => {});
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
                  <path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" />
                </svg>
                <span>Share</span>
              </button>
            </div>
          </div>
        </section>

        <section className="pp-related">
          <h2 className="pp-related-title">RELATED PRODUCTS</h2>
          <RelatedCarousel items={related} onOpen={(p) => onSelectProduct?.(p)} />
        </section>
      </main>

      <footer>
        <div className="logo"><img src="/logos/mjerseyss_logo.svg" alt="MJ Erseys" /></div>
        <p>INDEPENDENT FOOTBALL ARCHIVE<br />EST. 2026 / WORLDWIDE</p>
        <div><a href="#shop">SHOP</a><a href="#story">STORY</a><a href="#top">TOP ↑</a></div>
      </footer>
    </div>
  );
};

export default ProductPage;
