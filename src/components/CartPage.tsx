import { useState } from "react";
import { findTeam, teamSlug } from "../data/teams";

const KIT_IMAGE_MAP: Record<string, string> = {
  "Barcelona Kit": "/images/jerseys/barcelona.jpg",
  "Chelsea Kit": "/images/jerseys/chelsea.jpg",
  "Manchester United": "/images/jerseys/man-united.jpg",
  "Real Madrid Kit": "/images/jerseys/real-madrid.jpg",
  "Real Madrid": "/images/jerseys/real-madrid.jpg",
  "PSG": "/images/jerseys/psg.jpg",
  "Arsenal": "/images/jerseys/arsenal.jpg",
  "Manchester City": "/images/jerseys/man-city.jpg",
  "Liverpool": "/images/jerseys/liverpool.jpg",
};

function resolveImage(item: { name: string; image?: string }): string | undefined {
  if (item.image) return item.image;
  if (KIT_IMAGE_MAP[item.name]) return KIT_IMAGE_MAP[item.name];
  try {
    const t = findTeam(teamSlug(item.name.split(" ")[0]));
    if (t) return t.jersey;
  } catch {}
  // handle "PSG" etc already in map
  return undefined;
}

type PN = "landing" | "jerseys" | "retro" | "bestsellers" | "cart" | "checkout";

interface CartItem {
  name: string;
  size: string;
  qty: number;
  delivery: string;
  image?: string;
  price?: number;
}

interface CartPageProps {
  cartItems: CartItem[];
  setCartItems: (v: CartItem[] | ((p: CartItem[]) => CartItem[])) => void;
  cartCount: number;
  userEmail: string | null;
  setUserEmail: (v: string | null) => void;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  onNavigate: (page: PN) => void;
  onBack: () => void;
  setToast: (v: string) => void;
}

const formatPrice = (n: number) => `Ksh ${n.toLocaleString()}`;

function Icon({ name, size = 17 }: { name: "arrow" | "bag" | "menu" | "profile" | "search" | "x" | "chat" | "heart"; size?: number }) {
  const paths: Record<string, any> = {
    arrow: <><path d="M5 19 19 5" /><path d="M10 5h9v9" /></>,
    bag: <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>,
    menu: <><path d="M4 7h16" /><path d="M4 17h16" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0 1 16 0v1" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    x: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
    chat: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>,
    heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
const css = `
.cp-root {
  position: relative; width: 100%; height: 100vh; height: 100dvh; display: flex; flex-direction: column; overflow: hidden;
  background: #fff; color: maroon;
}
.cp-fixed { flex: 0 0 auto; position: relative; z-index: 5; }
.cp-fixed .topbar { position: relative !important; }
.cp-head {
  display: grid;
  grid-template-columns: 1fr auto auto;
  grid-template-areas: "label data button" "title data button";
  column-gap: 24px; align-items: start;
  padding: 18px 40px 22px; color: maroon;
}
.cp-head .cp-label { grid-area: label; font-size: 14px; font-weight: 700; letter-spacing: .12em; opacity: .75; }
.cp-head h2 { grid-area: title; margin: 4px 0 0; font-size: clamp(32px, 5vw, 56px); line-height: .95; font-weight: 400; }
.cp-head .cp-data { grid-area: data; font-size: 10px; line-height: 1.7; letter-spacing: .08em; opacity: .7; }
.cp-head button {
  grid-area: button;
  background: #fff; color: maroon; border: 1px solid maroon; padding: 10px 16px;
  font-size: 11px; letter-spacing: .08em; cursor: pointer;
  transition: transform .25s ease, background .25s ease;
}
.cp-head button:hover { transform: translateX(-4px); background: #f7efef; }
.cp-scroll {
  flex: 1 1 auto; min-height: 0; overflow-y: auto; overflow-x: hidden;
  padding: 14px 40px 90px;
  scrollbar-width: none;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 26px, #000 calc(100% - 48px), transparent 100%);
          mask-image: linear-gradient(to bottom, transparent 0, #000 26px, #000 calc(100% - 48px), transparent 100%);
}
.cp-scroll::-webkit-scrollbar { display: none; }
.cp-layout {
  display: grid; grid-template-columns: 1fr 360px; gap: 32px; max-width: 1200px; margin: 0 auto; align-items: start;
}
@media (max-width: 900px) { .cp-layout { grid-template-columns: 1fr; } }
.cp-rows { display: flex; flex-direction: column; gap: 14px; }
.cp-row {
  display: flex; gap: 16px; align-items: center;
  background: #fff; border: 1px solid rgba(128,0,0,.18);
  padding: 12px; cursor: pointer; transition: background .2s, border-color .2s, transform .2s;
  animation: cp-rise .5s cubic-bezier(.2,.8,.2,1) both;
}
.cp-row:hover { background: #f7efef; border-color: maroon; }
.cp-row.cp-selected { background: rgba(0,128,0,.06); border-color: green; }
.cp-row-img {
  width: 84px; height: 100px; flex-shrink: 0; display: grid; place-items: center;
  background: #f2ede6; overflow: hidden;
}
.cp-row-img img { width: 78%; height: 78%; object-fit: contain; }
.cp-row-body { flex: 1; min-width: 0; color: maroon; }
.cp-row-name { font-size: 14px; font-weight: 700; letter-spacing: .02em; text-transform: uppercase; }
.cp-row-meta { font-size: 10px; opacity: .7; letter-spacing: .06em; margin-top: 4px; }
.cp-row-price { font-size: 13px; font-weight: 700; margin-top: 6px; color: green; }
.cp-row-remove {
  background: transparent; border: 1px solid rgba(128,0,0,.3); color: maroon; width: 28px; height: 28px;
  cursor: pointer; font-size: 14px; opacity: .6; transition: opacity .15s, background .15s, color .15s;
}
.cp-row-remove:hover { opacity: 1; background: maroon; color: #fff; }
.cp-panel {
  position: sticky; top: 14px; background: #fff; border: 1px solid maroon;
  padding: 20px; color: maroon; animation: cp-rise .6s cubic-bezier(.2,.8,.2,1) both;
}
.cp-panel-img {
  width: 100%; aspect-ratio: 4/5; display: grid; place-items: center;
  background: #f2ede6; margin-bottom: 16px; overflow: hidden;
}
.cp-panel-img img { width: 78%; height: 78%; object-fit: contain; }
.cp-panel-name { font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: .02em; }
.cp-panel-meta { font-size: 10px; opacity: .7; letter-spacing: .06em; margin-top: 4px; }
.cp-panel-total { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(128,0,0,.2); font-size: 12px; letter-spacing: .08em; }
.cp-panel-total b { font-size: 18px; color: green; }
.cp-email { margin-top: 14px; }
.cp-email label { display: block; font-size: 9px; letter-spacing: .14em; text-transform: uppercase; opacity: .7; margin-bottom: 6px; }
.cp-email input {
  width: 100%; border: 1px solid maroon; background: #fff; color: maroon;
  padding: 10px 12px; font-size: 12px; outline: none;
}
.cp-email input:focus { border-color: green; }
.cp-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
.cp-buy {
  background: maroon; color: #fff; border: 1px solid maroon; padding: 14px 16px; font-size: 12px; font-weight: 700;
  letter-spacing: .1em; cursor: pointer; transition: transform .2s, background .2s;
}
.cp-buy:hover { background: #6d0000; transform: translateY(-2px); }
.cp-chat {
  background: transparent; color: maroon; border: 1px solid maroon; padding: 12px 16px;
  font-size: 11px; letter-spacing: .1em; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: background .2s, color .2s;
}
.cp-chat:hover { background: #f7efef; }
.cp-empty { text-align: center; color: maroon; padding: 60px 20px; opacity: .7; font-size: 12px; letter-spacing: .08em; }
@keyframes cp-rise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
@media (max-width: 600px) {
  .cp-head {
    grid-template-columns: 1fr auto;
    grid-template-areas: "label button" "title title" "data data";
    row-gap: 6px; align-items: center;
    padding: 14px 16px 18px;
  }
  .cp-head h2 { font-size: 32px; }
  .cp-head .cp-data { font-size: 9px; margin-top: 6px; }
  .cp-head button { padding: 8px 12px; font-size: 10px; }
  .cp-scroll { padding: 10px 16px 80px; }
  .cp-row { gap: 10px; padding: 8px; }
  .cp-row-img { width: 64px; height: 78px; }
  .cp-row-name { font-size: 12px; }
  .cp-row-meta { font-size: 9px; }
  .cp-row-price { font-size: 12px; }
  .cp-panel-name { font-size: 15px; }
  .cp-email input { font-size: 16px; }
}
`;
export default function CartPage(props: CartPageProps) {
  const { cartItems, setCartItems, cartCount, userEmail, setUserEmail, menuOpen, setMenuOpen, onNavigate, onBack, setToast } = props;
  const [selected, setSelected] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMsg, setChatMsg] = useState("");

  const go = (p: PN) => { onNavigate(p); setMenuOpen(false); };

  const safeSelected = Math.min(selected, Math.max(0, cartItems.length - 1));
  const selectedItem = cartItems[safeSelected];

  const total = cartItems.reduce((s, i) => s + i.qty * (i.price ?? 85), 0);

  const removeItem = (idx: number) => {
    setCartItems((prev) => prev.filter((_, i) => i !== idx));
    if (safeSelected >= cartItems.length - 1) setSelected(Math.max(0, cartItems.length - 2));
  };

  const buy = () => {
    if (!userEmail) {
      const input = document.querySelector(".cp-email input") as HTMLInputElement | null;
      const v = input?.value?.trim();
      if (v) setUserEmail(v);
    }
    onNavigate("checkout");
  };

  return (
    <div className="cp-root">
      <style>{css}</style>
      <div className="cp-fixed">
        <header className="topbar">
          <a className="logo" href="#top" onClick={(e) => { e.preventDefault(); go("landing"); }}>
            <img src="/logos/mjerseyss_logo.svg" alt="MJ Erseys" />
          </a>
          <nav>
            <a onClick={() => go("landing")} style={{ cursor: "pointer" }}>NEW-ARRIVAL</a>
            <a onClick={() => go("jerseys")} style={{ cursor: "pointer" }}>ALL-KITS</a>
            <a onClick={() => go("bestsellers")} style={{ cursor: "pointer" }}>BEST-SELLERS</a>
            <a onClick={() => go("retro")} style={{ cursor: "pointer" }}>RETRO</a>
          </nav>
          <div className="tools">
            <button className="cart-trigger" aria-label={`Bag with ${cartCount} items`}>
              <Icon name="bag" /><b>{cartCount}</b>
            </button>
            <button className="wishlist-trigger" aria-label="Wishlist"><Icon name="heart" /></button>
            <button className="profile-trigger" aria-label="Profile"><Icon name="profile" /></button>
            <button className="menu-trigger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation">
              <Icon name={menuOpen ? "x" : "menu"} size={17} />
            </button>
          </div>
        </header>
        {menuOpen && (
          <nav className="mobile-nav">
            <a onClick={() => go("landing")} style={{ cursor: "pointer" }}>New-Arrival</a>
            <a onClick={() => go("jerseys")} style={{ cursor: "pointer" }}>All-Kits</a>
            <a onClick={() => go("bestsellers")} style={{ cursor: "pointer" }}>Best-Sellers</a>
            <a onClick={() => go("retro")} style={{ cursor: "pointer" }}>Retro</a>
          </nav>
        )}
        <div className="cp-head">
        <span className="cp-label">[ YOUR CART ]</span>
        <button onClick={onBack}>← CONTINUE SHOPPING</button>
        <h2>CART</h2>
        <div className="cp-data">
          [ {cartCount} ITEMS ]<br />
          [ {formatPrice(cartItems[0]?.price ?? 1500)} / ITEM ]<br />
          [ 72H HOLD ]
        </div>
      </div>
      </div>

      <main className="cp-scroll">
        {cartItems.length === 0 ? (
          <div className="cp-empty">
            <div style={{ fontSize: 48, marginBottom: 12, opacity: .4 }}>🛒</div>
            YOUR CART IS EMPTY — ADD SOME KITS!
          </div>
        ) : (
          <div className="cp-layout">
            <div className="cp-rows">
              {cartItems.map((item, i) => (
                <div
                  key={i}
                  className={`cp-row ${i === safeSelected ? "cp-selected" : ""}`}
                  style={{ animationDelay: `${i * 60}ms` }}
                  onClick={() => setSelected(i)}
                >
                  <div className="cp-row-img">
                    {resolveImage(item) ? <img src={resolveImage(item)} alt={item.name} /> : <span style={{ color: "rgba(128,0,0,.35)", fontSize: 24 }}>Jersey</span>}
                  </div>
                  <div className="cp-row-body">
                    <div className="cp-row-name">{item.name}</div>
                    <div className="cp-row-meta">Size {item.size} · Qty {item.qty} · {item.delivery === "delivery" ? "Delivery" : "Pick up"}</div>
                    <div className="cp-row-price">{formatPrice(item.qty * (item.price ?? 1500))}</div>
                  </div>
                  <button className="cp-row-remove" onClick={(e) => { e.stopPropagation(); removeItem(i); }} aria-label="Remove">×</button>
                </div>
              ))}
            </div>

            <div className="cp-panel">
              {selectedItem && (
                <>
                  <div className="cp-panel-img">
                    {resolveImage(selectedItem) ? <img src={resolveImage(selectedItem)} alt={selectedItem.name} /> : <span style={{ color: "rgba(128,0,0,.35)" }}>Jersey</span>}
                  </div>
                  <div className="cp-panel-name">{selectedItem.name}</div>
                  <div className="cp-panel-meta">Size {selectedItem.size} · Qty {selectedItem.qty} · {selectedItem.delivery === "delivery" ? "Delivery" : "Pick up"}</div>
                  <div className="cp-panel-total">
                    <span>TOTAL</span>
                    <b>{formatPrice(total)}</b>
                  </div>
                  {!userEmail && (
                    <div className="cp-email">
                      <label>Email (save cart 72h)</label>
                      <input type="email" placeholder="you@email.com" onKeyDown={(e) => { if (e.key === "Enter") { const v = (e.target as HTMLInputElement).value.trim(); if (v) setUserEmail(v); } }} />
                    </div>
                  )}
                  {userEmail && (
                    <p style={{ fontSize: 10, opacity: .7, marginTop: 10, letterSpacing: ".06em" }}>Saved to {userEmail} · expires in 72h</p>
                  )}
                  <div className="cp-actions">
                    <button className="cp-buy" onClick={buy}>BUY NOW — {formatPrice(total)}</button>
                    <button className="cp-chat" onClick={() => setChatOpen(true)}>
                      <Icon name="chat" size={14} /> CHAT WITH US
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </main>

      {chatOpen && (
        <div className="checkout-overlay" onClick={() => setChatOpen(false)}>
          <div className="checkout-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
            <button className="checkout-close" onClick={() => setChatOpen(false)}>×</button>
            <h2 className="checkout-title">Chat Support</h2>
            <p className="checkout-note" style={{ opacity: .7, fontSize: 11, marginBottom: 12 }}>Ask us anything about your order.</p>
            <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 12, padding: 8, background: "rgba(128,0,0,.05)", fontSize: 11, color: "maroon" }}>
              <p style={{ opacity: .6 }}>Support: Hi! How can we help with your {selectedItem?.name}?</p>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input className="qa-input" placeholder="Type a message…" value={chatMsg} onChange={(e) => setChatMsg(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && chatMsg.trim()) { setToast("Message sent"); window.setTimeout(() => setToast(""), 1800); setChatMsg(""); } }} />
              <button className="qa-qty-btn" onClick={() => { if (chatMsg.trim()) { setToast("Message sent"); window.setTimeout(() => setToast(""), 1800); setChatMsg(""); } }}>→</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
