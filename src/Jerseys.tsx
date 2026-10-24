import React, { useState, useEffect } from "react";
import { fetchAllCloudinaryKits, getCachedAllCloudinaryKits, CLOUDINARY_CLOUD_NAME } from "./cloudinary";

/* ---------- Types ---------- */
export interface Kit {
  id: string;
  name: string;
  image: string;
  price: number;
  inStock: boolean;
  retro?: boolean;
}

export interface JerseysProps {
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

/* ---------- Placeholder data ---------- */
const DEFAULT_KITS: Kit[] = [
  { id: "barcelona", name: "Barcelona Kit", image: "/images/jerseys/barcelona.jpg", price: 12, inStock: true },
  { id: "chelsea", name: "Chelsea Kit", image: "/images/jerseys/chelsea.jpg", price: 12, inStock: true },
  { id: "man-united", name: "Manchester United", image: "/images/jerseys/man-united.jpg", price: 12, inStock: true },
  { id: "real-madrid", name: "Real Madrid", image: "/images/jerseys/real-madrid.jpg", price: 12, inStock: true },
  { id: "psg", name: "PSG", image: "/images/jerseys/psg.jpg", price: 12, inStock: true },
  { id: "arsenal", name: "Arsenal", image: "/images/jerseys/arsenal.jpg", price: 12, inStock: true },
  { id: "man-city", name: "Manchester City", image: "/images/jerseys/man-city.jpg", price: 12, inStock: true },
  { id: "liverpool", name: "Liverpool", image: "/images/jerseys/liverpool.jpg", price: 12, inStock: true },
];

const NAV_LINKS = ["Collection", "Jerseys", "Retro", "Archive"];

const formatPrice = (n: number) => `$${n.toFixed(2)}`;

/* ---------- Sub-components ---------- */
const Header: React.FC<Pick<JerseysProps, "cartCount" | "onNavigate" | "onCartClick" | "onProfileClick" | "menuOpen" | "setMenuOpen">> = ({
  cartCount = 0,
  onNavigate,
  onCartClick,
  onProfileClick,
  menuOpen = false,
  setMenuOpen,
}) => (
  <header className="topbar">
    <a className="logo" href="#top" aria-label="MJ home" onClick={() => onNavigate?.('Collection')} style={{ cursor: 'pointer' }}>MJ<span>//</span></a>

    <nav aria-label="Primary">
      {NAV_LINKS.map((label) => (
        <a
          key={label}
          onClick={() => onNavigate?.(label)}
          style={{ cursor: 'pointer' }}
        >
          [ {label.toUpperCase()} ]
        </a>
      ))}
    </nav>

    <div className="tools">
      <button className="profile-trigger" aria-label="Profile" onClick={onProfileClick}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="3" /><path d="M5 21v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" /></svg></button>
      <button className="cart-trigger" aria-label={`Bag with ${cartCount} items`} onClick={onCartClick}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></svg><b>{cartCount}</b></button>
      <button className="menu-trigger" onClick={() => setMenuOpen?.(!menuOpen)} aria-label="Open navigation"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16" /><path d="M4 17h16" /></svg></button>
    </div>
  </header>
);

const KitCard: React.FC<{ kit: Kit; onSelect?: (kit: Kit) => void; onAdd?: (name: string, image?: string, price?: number) => void }> = ({ kit, onSelect, onAdd }) => (
  <article className="flex flex-col">
    <button
      type="button"
      className="kit-image"
      onClick={() => {
        onAdd?.(kit.name, kit.image, kit.price);
        onSelect?.(kit);
      }}
      aria-label={`Add ${kit.name} to bag`}
    >
      <img className="block w-full h-full object-cover" src={kit.image} alt={kit.name} loading="lazy" />
      <span>+ QUICK ADD</span>
    </button>
    <h3 className="mt-2 font-mj-display font-bold text-[9px] tracking-[0.02em] uppercase text-mj-white max-md:text-[13px]">
      {kit.name}
    </h3>
    <div className="flex items-center justify-between mt-[13px] font-mj-mono text-[5px] tracking-[0.06em] uppercase max-md:text-[8px]">
      <span className="inline-flex items-center gap-1">
        <i className={`w-1 h-1 rounded-full ${kit.inStock ? "bg-[#d7ff5a]" : "bg-[#ff6a5a]"}`} />
        {kit.inStock ? "In stock" : "Sold out"}
      </span>
      <span>{formatPrice(kit.price)}</span>
    </div>
  </article>
);

/* ---------- Page ---------- */
const Jerseys: React.FC<JerseysProps> = ({
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
  const cachedJerseys = getCachedAllCloudinaryKits();
  const [kits, setKits] = useState<Kit[]>(cachedJerseys ? cachedJerseys.map((k) => ({ id: k.id, name: k.name, image: k.image, price: k.price, inStock: k.inStock, retro: k.retro })) : (kitsProp ?? DEFAULT_KITS));
  const [filterOpen, setFilterOpen] = useState(false);
  const [tone, setTone] = useState('ALL');

  useEffect(() => {
    if (cachedJerseys) return;
    if (!CLOUDINARY_CLOUD_NAME) return;
    let cancelled = false;
    fetchAllCloudinaryKits()
      .then((res) => {
        if (cancelled) return;
        if (res.length) {
          setKits(res.map((k) => ({
            id: k.id,
            name: k.name,
            image: k.image,
            price: k.price,
            inStock: k.inStock,
            retro: k.retro,
          })));
        }
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);
  return (
    <section className="mj-page relative flex justify-center items-start min-h-screen px-0 pt-0 pb-0 text-mj-white bg-transparent max-md:p-0">
    <div
      className="relative w-full max-w-[1180px] m-0 min-h-screen overflow-visible shadow-[0_30px_80px_rgba(0,0,0,0.45)]"
      style={{ background: "linear-gradient(180deg, #000 0%, #000 28%, #0b0f13 40%, #1c2630 62%, #34475a 80%, #5b7189 100%)" }}
    >
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
              [ {label.toUpperCase()} ]
            </a>
          ))}
          <a onClick={() => { onProfileClick?.(); setMenuOpen?.(false); }} style={{ cursor: 'pointer' }}>[ PROFILE ]</a>
        </nav>
      )}

      <div className="absolute inset-x-0 top-0 h-[220px] sm:h-[280px] md:h-[330px] pointer-events-none z-[1] overflow-hidden" aria-hidden="true">
        <span className="absolute font-mj-display font-black text-[120px] sm:text-[180px] md:text-[250px] leading-[0.8] tracking-[-0.02em] whitespace-nowrap text-mj-ghost rotate-[-15deg] origin-top-left select-none top-[120px] sm:top-[160px] md:top-[190px] left-[12px] sm:left-[18px]">
          26/27
        </span>
        <span className="absolute font-mj-display font-black text-[120px] sm:text-[180px] md:text-[250px] leading-[0.8] tracking-[-0.02em] whitespace-nowrap text-mj-ghost rotate-[-15deg] origin-top-left select-none top-[180px] sm:top-[240px] md:top-[310px] left-[160px] sm:left-[240px] md:left-[330px]">
          26/27
        </span>
        <div
          className="absolute left-0 right-0 top-[53px] h-[156px] border-b border-[rgba(255,255,255,0.12)]"
          style={{ background: "linear-gradient(180deg, rgba(0, 0, 0, 0) 78%, rgba(60, 74, 88, 0.55) 100%)" }}
        />
      </div>

      <main className="relative z-[2] px-[48px] pb-[30px] max-md:px-5 max-md:pb-7">
        <div className="pt-[182px] max-md:pt-[167px]">
          <div className="flex justify-end mb-4 max-md:justify-start" style={{ marginRight: 'calc((100% - 694px) / 2)' }}>
            <button
              onClick={() => setFilterOpen(!filterOpen)}
              style={{ border: 0, background: 'var(--white, #fff)', color: 'var(--deep, #0d2737)', padding: '8px 14px', font: '500 8px "DM Mono", ui-monospace, monospace', cursor: 'pointer' }}
            >
              FILTERS {filterOpen ? '−' : '+'}
            </button>
          </div>
          {filterOpen && (
            <div className="filter-tray" style={{ margin: '0 0 18px 0' }}>
              {['ALL', 'LIGHT', 'DARK', 'RETRO'].map((item) => (
                <button
                  key={item}
                  className={tone === item ? 'active' : ''}
                  onClick={() => setTone(item)}
                  style={{ border: 0, background: 'transparent', opacity: tone === item ? 1 : 0.5, font: '400 8px "DM Mono", ui-monospace, monospace', cursor: 'pointer', color: tone === item ? '#fff' : 'inherit' }}
                >
                  [ {item} ]
                </button>
              ))}
            </div>
          )}
          <div className="ml-[calc((100%-714px)/2)] max-md:ml-0 mb-18">
            <span className="font-mj-mono text-[11px] tracking-[0.12em] uppercase text-mj-white opacity-80">[ ENTIRE COLLECTION ]</span>
          </div>
          <h1 className="m-0 ml-[calc((100%-714px)/2)] font-mj-block text-[52px] leading-[0.9] tracking-[-0.03em] uppercase text-mj-white max-md:ml-0" style={{ textShadow: "0 0 30px rgba(255,255,255,0.3), 0 4px 24px rgba(0,0,0,0.7), 0 2px 6px rgba(0,0,0,0.5)", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.5))", WebkitTextStroke: "1px rgba(255,255,255,0.15)" }}>
            Trendy Kits
          </h1>
        </div>

        <div className="grid grid-cols-[repeat(2,282px)] justify-center gap-x-[130px] gap-y-[84px] mt-[39px] p-0 max-md:grid-cols-1 max-md:gap-y-8">
          {(tone === 'RETRO' ? kits.filter((k) => k.retro) : kits).map((kit) => (
            <KitCard key={kit.id} kit={kit} onSelect={onSelectKit} onAdd={onAdd} />
          ))}
        </div>
      </main>
    </div>
  </section>
); }

export default Jerseys;