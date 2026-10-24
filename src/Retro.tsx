import React, { useEffect, useState } from "react";
import { retroKits as localKits } from "./retroKits";
import {
  fetchAllCloudinaryKits,
  getCachedAllCloudinaryKits,
  CLOUDINARY_CLOUD_NAME,
} from "./cloudinary";

/* ---------- Types ---------- */
export interface Kit {
  id: string;
  name: string;
  image: string;
  price: number;
  inStock: boolean;
}

export interface RetroProps {
  kits?: Kit[];
  cartCount?: number;
  onNavigate?: (label: string) => void;
  onSelectKit?: (kit: Kit) => void;
  onCartClick?: () => void;
  onProfileClick?: () => void;
  onAdd?: (name: string, image?: string) => void;
  menuOpen?: boolean;
  setMenuOpen?: (v: boolean) => void;
}

const NAV_LINKS = ["Collection", "Jerseys", "Retro", "Archive"];

const formatPrice = (n: number) => `$${n.toFixed(2)}`;

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

const KitCard: React.FC<{ kit: Kit; onSelect?: (kit: Kit) => void; onAdd?: (name: string, image?: string) => void }> = ({ kit, onSelect, onAdd }) => (
  <article className="flex flex-col">
    <button
      type="button"
      className="kit-image"
      onClick={() => {
        onAdd?.(kit.name, kit.image);
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
  const cachedRetro = getCachedAllCloudinaryKits();
  const [kits, setKits] = useState<Kit[]>(cachedRetro ? cachedRetro.filter((k) => k.retro).map((k) => ({ id: k.id, name: k.name, image: k.image, price: k.price, inStock: k.inStock })) : []);
  const [loading, setLoading] = useState<boolean>(!cachedRetro);

  useEffect(() => {
    if (cachedRetro) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        if (CLOUDINARY_CLOUD_NAME) {
          const all = await fetchAllCloudinaryKits();
          const cloudKits = all.filter((k) => k.retro);
          if (!cancelled) setKits(cloudKits.map((k) => ({ id: k.id, name: k.name, image: k.image, price: k.price, inStock: k.inStock })));
        } else {
          if (!cancelled)
            setKits(
              localKits.map((k) => ({
                id: k.id,
                name: k.name,
                image: k.image,
                price: k.price,
                inStock: k.inStock,
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
    return () => {
      cancelled = true;
    };
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
            RETRO
          </span>
          <span className="absolute font-mj-display font-black text-[120px] sm:text-[180px] md:text-[250px] leading-[0.8] tracking-[-0.02em] whitespace-nowrap text-mj-ghost rotate-[-15deg] origin-top-left select-none top-[180px] sm:top-[240px] md:top-[310px] left-[160px] sm:left-[240px] md:left-[330px]">
            RETRO
          </span>
          <div
            className="absolute left-0 right-0 top-[53px] h-[156px] border-b border-[rgba(255,255,255,0.12)]"
            style={{ background: "linear-gradient(180deg, rgba(0, 0, 0, 0) 78%, rgba(60, 74, 88, 0.55) 100%)" }}
          />
        </div>

        <main className="relative z-[2] px-[48px] pb-[30px] max-md:px-5 max-md:pb-7">
          {loading && (
            <div className="pt-[182px] max-md:pt-[167px] text-center font-mj-mono text-[11px] tracking-[0.12em] uppercase text-mj-white opacity-60">
              [ LOADING RETRO KITS... ]
            </div>
          )}
          {!loading && kits.length > 0 && (
            <>
              <div className="pt-[182px] max-md:pt-[167px]">
                <div className="ml-[calc((100%-714px)/2)] max-md:ml-0 mb-18">
                  <span className="font-mj-mono text-[11px] tracking-[0.12em] uppercase text-mj-white opacity-80">[ ENTIRE COLLECTION ]</span>
                </div>
              </div>
              <div className="grid grid-cols-[repeat(2,282px)] justify-center gap-x-[130px] gap-y-[84px] mt-[39px] p-0 max-md:grid-cols-1 max-md:gap-y-8">
                {kits.map((kit) => (
                  <KitCard
                    key={kit.id}
                    kit={kit}
                    onSelect={onSelectKit}
                    onAdd={onAdd}
                  />
                ))}
              </div>
            </>
          )}
          {!loading && kits.length === 0 && (
            <div className="pt-[182px] max-md:pt-[167px] text-center font-mj-mono text-[11px] tracking-[0.12em] uppercase text-mj-white opacity-60">
              [ NO RETRO KITS YET ]
            </div>
          )}
        </main>
      </div>
    </section>
  );
};

export default Retro;