import { useState } from "react";
import { findTeam, teamSlug } from "./teams";

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

type PN = "landing" | "jerseys" | "retro" | "league" | "team" | "cart" | "archive";

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

function Icon({ name, size = 17 }: { name: "arrow" | "bag" | "menu" | "profile" | "search" | "x" | "chat"; size?: number }) {
  const paths: Record<string, any> = {
    arrow: <><path d="M5 19 19 5" /><path d="M10 5h9v9" /></>,
    bag: <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    menu: <><path d="M4 7h16" /><path d="M4 17h16" /></>,
    profile: <><circle cx="12" cy="8" r="3" /><path d="M5 21v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    x: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
    chat: <><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
const css = `
.cp-root {
  position: relative; width: 100%; height: 100vh; display: flex; flex-direction: column; overflow: hidden;
  background: linear-gradient(180deg, #5b7189 0%, #3a4d60 18%, #1c2630 48%, #090c10 75%, #000 100%);
}
.cp-fixed { flex: 0 0 auto; position: relative; z-index: 5; }
.cp-fixed .topbar { position: relative !important; }
.cp-head {
  display: flex; align-items: flex-start; justify-content: space-between; gap: 24px;
  padding: 18px 40px 22px; color: #fff;
}
.cp-head span { font-size: 11px; letter-spacing: .12em; opacity: .75; }
.cp-head h2 { margin: 4px 0 0; font-size: clamp(32px, 5vw, 56px); line-height: .95; font-weight: 400; }
.cp-head .cp-data { font-size: 10px; line-height: 1.7; letter-spacing: .08em; opacity: .7; text-align: left; }
.cp-head button {
  background: #fff; color: #0b0f13; border: 0; padding: 10px 16px;
  font-size: 11px; letter-spacing: .08em; cursor: pointer;
  transition: transform .25s ease, background .25s ease;
  margin-left: auto;
}
.cp-head button:hover { transform: translateX(-4px); background: #dfe8f1; }
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
  background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12);
  padding: 12px; cursor: pointer; transition: background .2s, border-color .2s, transform .2s;
  animation: cp-rise .5s cubic-bezier(.2,.8,.2,1) both;
}
.cp-row:hover { background: rgba(255,255,255,.1); border-color: rgba(255,255,255,.25); }
.cp-row.cp-selected { background: rgba(74,222,128,.12); border-color: #4ade80; }
.cp-row-img {
  width: 84px; height: 100px; flex-shrink: 0; display: grid; place-items: center;
  background: rgba(255,255,255,.08); overflow: hidden;
}
.cp-row-img img { width: 78%; height: 78%; object-fit: contain; filter: drop-shadow(0 6px 10px rgba(0,0,0,.4)); }
.cp-row-body { flex: 1; min-width: 0; color: #fff; }
.cp-row-name { font-size: 14px; font-weight: 700; letter-spacing: .02em; text-transform: uppercase; }
.cp-row-meta { font-size: 10px; opacity: .7; letter-spacing: .06em; margin-top: 4px; }
.cp-row-price { font-size: 13px; font-weight: 700; margin-top: 6px; color: #4ade80; }
.cp-row-remove {
  background: transparent; border: 1px solid rgba(255,255,255,.2); color: #fff; width: 28px; height: 28px;
  cursor: pointer; font-size: 14px; opacity: .6; transition: opacity .15s, background .15s, color .15s;
}
.cp-row-remove:hover { opacity: 1; background: #fff; color: #000; }
.cp-panel {
  position: sticky; top: 14px; background: rgba(255,255,255,.06); border: 1px solid rgba(255,255,255,.12);
  padding: 20px; color: #fff; animation: cp-rise .6s cubic-bezier(.2,.8,.2,1) both;
}
.cp-panel-img {
  width: 100%; aspect-ratio: 4/5; display: grid; place-items: center;
  background: rgba(255,255,255,.08); margin-bottom: 16px; overflow: hidden;
}
.cp-panel-img img { width: 78%; height: 78%; object-fit: contain; filter: drop-shadow(0 12px 20px rgba(0,0,0,.5)); }
.cp-panel-name { font-size: 18px; font-weight: 700; text-transform: uppercase; letter-spacing: .02em; }
.cp-panel-meta { font-size: 10px; opacity: .7; letter-spacing: .06em; margin-top: 4px; }
.cp-panel-total { display: flex; justify-content: space-between; align-items: center; margin-top: 16px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,.15); font-size: 12px; letter-spacing: .08em; }
.cp-panel-total b { font-size: 18px; color: #4ade80; }
.cp-email { margin-top: 14px; }
.cp-email label { display: block; font-size: 9px; letter-spacing: .14em; text-transform: uppercase; opacity: .7; margin-bottom: 6px; }
.cp-email input {
  width: 100%; border: 1px solid rgba(255,255,255,.2); background: rgba(255,255,255,.08); color: #fff;
  padding: 10px 12px; font-size: 12px; outline: none;
}
.cp-email input:focus { border-color: #4ade80; }
.cp-actions { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
.cp-buy {
  background: #4ade80; color: #0b0f13; border: 0; padding: 14px 16px; font-size: 12px; font-weight: 700;
  letter-spacing: .1em; cursor: pointer; transition: transform .2s, background .2s;
}
.cp-buy:hover { background: #22c55e; transform: translateY(-2px); }
.cp-chat {
  background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.3); padding: 12px 16px;
  font-size: 11px; letter-spacing: .1em; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px;
  transition: background .2s, border-color .2s;
}
.cp-chat:hover { background: rgba(255,255,255,.1); border-color: #fff; }
.cp-empty { text-align: center; color: #fff; padding: 60px 20px; opacity: .7; font-size: 12px; letter-spacing: .08em; }
@keyframes cp-rise { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: none; } }
@media (max-width: 600px) {
  .cp-head { flex-direction: column; align-items: flex-start; gap: 12px; padding: 14px 16px 18px; }
  .cp-head h2 { font-size: 32px; }
  .cp-head .cp-data { text-align: left; font-size: 9px; }
  .cp-scroll { padding: 10px 16px 80px; }
  .cp-row { gap: 10px; padding: 8px; }
  .cp-row-img { width: 64px; height: 78px; }
  .cp-row-name { font-size: 12px; }
  .cp-row-meta { font-size: 9px; }
  .cp-row-price { font-size: 12px; }
  .cp-panel-name { font-size: 15px; }
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
    setCartItems([]);
    setToast("Order placed successfully");
    window.setTimeout(() => setToast(""), 2200);
    onBack();
  };

  return (
    <div className="cp-root">
      <style>{css}</style>
      <div className="cp-fixed">
        <header className="topbar" style={{ background: "transparent" }}>
          <a className="logo" href="#top" onClick={(e) => { e.preventDefault(); go("landing"); }}>
            MJ<span>//</span>
          </a>
          <nav>
            <a onClick={() => go("landing")} style={{ cursor: "pointer" }}>[ COLLECTION ]</a>
            <a onClick={() => go("jerseys")} style={{ cursor: "pointer" }}>[ JERSEYS ]</a>
            <a onClick={() => go("retro")} style={{ cursor: "pointer" }}>[ RETRO ]</a>
            <a onClick={() => go("archive")} style={{ cursor: "pointer" }}>[ ARCHIVE ]</a>
          </nav>
          <div className="tools">
            <button className="profile-trigger" aria-label="Profile"><Icon name="profile" /></button>
            <button className="cart-trigger" aria-label={`Bag with ${cartCount} items`}>
              <Icon name="bag" /><b>{cartCount}</b>
            </button>
            <button className="menu-trigger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation">
              <Icon name={menuOpen ? "x" : "menu"} size={17} />
            </button>
          </div>
        </header>
        {menuOpen && (
          <nav className="mobile-nav" style={{ background: "var(--deep)" }}>
            <a onClick={() => go("landing")} style={{ cursor: "pointer" }}>[ Collection ]</a>
            <a onClick={() => go("jerseys")} style={{ cursor: "pointer" }}>[ Jerseys ]</a>
            <a onClick={() => go("retro")} style={{ cursor: "pointer" }}>[ Retro ]</a>
            <a onClick={() => go("archive")} style={{ cursor: "pointer" }}>[ Archive ]</a>
          </nav>
        )}
        <div className="cp-head">
          <div>
            <span>[ YOUR CART ]</span>
            <h2>CART</h2>
          </div>
          <div className="cp-data">
            [ {cartCount} ITEMS ]<br />
            [ £{cartItems[0]?.price ?? 85} / ITEM ]<br />
            [ 72H HOLD ]
          </div>
          <button onClick={onBack}>← CONTINUE SHOPPING</button>
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
                    {resolveImage(item) ? <img src={resolveImage(item)} alt={item.name} /> : <span style={{ color: "rgba(255,255,255,.3)", fontSize: 24 }}>Jersey</span>}
                  </div>
                  <div className="cp-row-body">
                    <div className="cp-row-name">{item.name}</div>
                    <div className="cp-row-meta">Size {item.size} · Qty {item.qty} · {item.delivery === "delivery" ? "Delivery" : "Pick up"}</div>
                    <div className="cp-row-price">£{(item.qty * (item.price ?? 85)).toFixed(2)}</div>
                  </div>
                  <button className="cp-row-remove" onClick={(e) => { e.stopPropagation(); removeItem(i); }} aria-label="Remove">×</button>
                </div>
              ))}
            </div>

            <div className="cp-panel">
              {selectedItem && (
                <>
                  <div className="cp-panel-img">
                    {resolveImage(selectedItem) ? <img src={resolveImage(selectedItem)} alt={selectedItem.name} /> : <span style={{ color: "rgba(255,255,255,.3)" }}>Jersey</span>}
                  </div>
                  <div className="cp-panel-name">{selectedItem.name}</div>
                  <div className="cp-panel-meta">Size {selectedItem.size} · Qty {selectedItem.qty} · {selectedItem.delivery === "delivery" ? "Delivery" : "Pick up"}</div>
                  <div className="cp-panel-total">
                    <span>TOTAL</span>
                    <b>£{total}.00</b>
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
                    <button className="cp-buy" onClick={buy}>BUY NOW — £{total}.00</button>
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
            <div style={{ maxHeight: 200, overflowY: "auto", marginBottom: 12, padding: 8, background: "rgba(0,0,0,.04)", fontSize: 11, color: "#183c52" }}>
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
