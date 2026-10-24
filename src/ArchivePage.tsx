import React, { useState, useMemo, useEffect } from "react";
import { fetchAllCloudinaryKits, getCachedAllCloudinaryKits, CLOUDINARY_CLOUD_NAME } from "./cloudinary";
import { teamSlug } from "./teams";

export interface ArchiveEntry {
  id: string;
  club: string;
  season: string;
  kit: "Home" | "Away" | "Third" | "Goalkeeper";
  price: number;
  status: "IN STOCK" | "SOLD OUT";
  image?: string;
  teamId?: string;
}

export interface ArchiveProps {
  cartCount?: number;
  menuOpen?: boolean;
  setMenuOpen?: (v: boolean) => void;
  onNavigate?: (label: string) => void;
  onSelect?: (teamId: string) => void;
  onAdd?: (name: string, image?: string, price?: number) => void;
  onNotify?: (email: string, entry: ArchiveEntry) => void;
  onCartClick?: () => void;
  onProfileClick?: () => void;
}

const NAV_LINKS = ["Collection", "Jerseys", "Retro", "Archive"];

const formatPrice = (n: number) => `$${n.toFixed(2)}`;

function Icon({ name, size = 17 }: { name: "arrow" | "bag" | "menu" | "profile" | "search" | "x"; size?: number }) {
  const paths: Record<string, React.ReactNode> = {
    arrow: <><path d="M5 19 19 5" /><path d="M10 5h9v9" /></>,
    bag: <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    menu: <><path d="M4 7h16" /><path d="M4 17h16" /></>,
    profile: <><circle cx="12" cy="8" r="3" /><path d="M5 21v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    x: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}
function parseSeason(name: string): string {
  const m = name.match(/\d{4}(?:\/\d{2,4})?/);
  return m ? m[0] : "2000/01";
}

function parseKit(name: string): ArchiveEntry["kit"] {
  const lower = name.toLowerCase();
  if (lower.includes("goalkeeper")) return "Goalkeeper";
  if (lower.includes("third")) return "Third";
  if (lower.includes("away")) return "Away";
  return "Home";
}

function parseClub(name: string): string {
  let c = name;
  c = c.replace(/\d{4}(?:\/\d{2,4})?/g, "");
  c = c.replace(/\b(Home|Away|Third|Goalkeeper|Kit|Adidas|Nike|Puma|Umbro|Kappa|New Balance)\b/gi, "");
  c = c.replace(/\s+/g, " ").trim();
  return c || name;
}

function decadeOf(season: string): string {
  const y = parseInt(season.slice(0, 4), 10);
  if (y >= 2020) return "2020s";
  if (y >= 2010) return "2010s";
  if (y >= 2000) return "2000s";
  return "1990s";
}

const SAMPLE_ENTRIES: ArchiveEntry[] = [
  { id: "s1", club: "Arsenal", season: "2003/04", kit: "Home", price: 120, status: "SOLD OUT", teamId: "arsenal" },
  { id: "s2", club: "Manchester United", season: "1998/99", kit: "Home", price: 150, status: "IN STOCK", teamId: "manchester-united" },
  { id: "s3", club: "Barcelona", season: "2010/11", kit: "Away", price: 95, status: "SOLD OUT" },
  { id: "s4", club: "Real Madrid", season: "2016/17", kit: "Third", price: 110, status: "IN STOCK" },
  { id: "s5", club: "Liverpool", season: "2004/05", kit: "Home", price: 130, status: "SOLD OUT" },
  { id: "s6", club: "Chelsea", season: "2011/12", kit: "Home", price: 100, status: "IN STOCK" },
  { id: "s7", club: "AC Milan", season: "2006/07", kit: "Home", price: 140, status: "SOLD OUT" },
  { id: "s8", club: "Juventus", season: "2015/16", kit: "Third", price: 85, status: "IN STOCK" },
];

const css = `
.ar-root { position: relative; width: 100%; min-height: 100vh; display: flex; flex-direction: column; background: linear-gradient(180deg, #5b7189 0%, #3a4d60 18%, #1c2630 48%, #090c10 75%, #000 100%); color: #fff; font-family: "Inter", system-ui, sans-serif; }
.ar-fixed { flex: 0 0 auto; position: relative; z-index: 5; }
.ar-fixed .topbar { position: relative !important; }
.ar-title { padding: 28px 40px 18px; max-width: 1280px; margin: 0 auto; width: 100%; }
.ar-title .ar-bracket { font-size: 11px; letter-spacing: .18em; opacity: .7; display: block; margin-bottom: 6px; }
.ar-title h1 { margin: 0; font-family: "Barlow Condensed", "Inter", sans-serif; font-weight: 800; font-size: clamp(56px, 11vw, 128px); text-transform: uppercase; letter-spacing: -0.055em; line-height: 0.82; text-shadow: 0 4px 18px rgba(0,0,0,.55); }
.ar-title .ar-info { margin-top: 14px; font-size: 10px; letter-spacing: .12em; opacity: .65; line-height: 1.8; }
.ar-filterbar { position: sticky; top: 0; z-index: 4; background: rgba(9,12,16,.72); backdrop-filter: blur(8px); padding: 14px 40px; display: flex; flex-wrap: wrap; gap: 12px 18px; align-items: center; max-width: 1280px; margin: 0 auto; width: 100%; box-sizing: border-box; }
.ar-chipgroup { display: flex; gap: 6px; flex-wrap: wrap; }
.ar-chip { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.35); padding: 6px 10px; font-size: 10px; letter-spacing: .12em; cursor: pointer; transition: background .2s, color .2s, transform .2s; }
.ar-chip[aria-pressed="true"] { background: #fff; color: #0b0f13; }
.ar-chip:hover { transform: translateY(-1px); }
.ar-search { flex: 1 1 220px; min-width: 180px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.35); color: #fff; padding: 7px 10px; font-size: 11px; letter-spacing: .06em; outline: none; }
.ar-search::placeholder { color: rgba(255,255,255,.5); }
.ar-colhead { display: grid; grid-template-columns: 48px 1.6fr 1fr 1fr 90px 120px; gap: 12px; padding: 10px 40px; font-size: 9px; letter-spacing: .16em; opacity: .55; max-width: 1280px; margin: 0 auto; width: 100%; box-sizing: border-box; border-bottom: 1px solid rgba(255,255,255,.15); }
.ar-list { padding: 8px 40px 120px; max-width: 1280px; margin: 0 auto; width: 100%; box-sizing: border-box; }
.ar-row { position: relative; display: grid; grid-template-columns: 48px 1.6fr 1fr 1fr 90px 120px; gap: 12px; align-items: center; padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,.08); opacity: 0; transform: translateY(18px); animation: ar-rise .6s cubic-bezier(.2,.8,.2,1) forwards; transition: background .2s, transform .25s; cursor: default; }
@keyframes ar-rise { to { opacity: 1; transform: none; } }
.ar-row:hover { background: rgba(255,255,255,.06); transform: translateX(6px); }
.ar-row.ar-sold { opacity: .55; }
.ar-row.ar-sold .ar-price { text-decoration: line-through; opacity: .6; }
.ar-no { font-size: 10px; letter-spacing: .1em; opacity: .5; }
.ar-club { font-size: 13px; font-weight: 600; letter-spacing: .04em; }
.ar-kit { font-size: 11px; letter-spacing: .1em; opacity: .75; }
.ar-season { font-size: 11px; letter-spacing: .1em; opacity: .75; }
.ar-price { font-size: 12px; font-weight: 600; }
.ar-status { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.ar-tag { font-size: 9px; letter-spacing: .14em; padding: 3px 6px; border: 1px solid; }
.ar-tag.in { color: #4ade80; border-color: #4ade80; }
.ar-tag.out { color: #f87171; border-color: #f87171; }
.ar-btn { background: #fff; color: #0b0f13; border: 0; padding: 6px 10px; font-size: 9px; letter-spacing: .12em; cursor: pointer; transition: transform .2s, background .2s; }
.ar-btn:hover { transform: translateX(2px); background: #dfe8f1; }
.ar-btn.ghost { background: transparent; color: #fff; border: 1px solid rgba(255,255,255,.4); }
.ar-btn.ghost:hover { background: rgba(255,255,255,.1); }
.ar-notifyform { grid-column: 1 / -1; display: flex; gap: 8px; margin-top: 8px; align-items: center; flex-wrap: wrap; }
.ar-notifyform input { flex: 1 1 220px; min-width: 180px; background: rgba(255,255,255,.08); border: 1px solid rgba(255,255,255,.35); color: #fff; padding: 7px 10px; font-size: 11px; }
.ar-notifyform .ar-msg { font-size: 10px; letter-spacing: .12em; color: #4ade80; }
.ar-empty { text-align: center; padding: 80px 20px; font-size: 11px; letter-spacing: .2em; opacity: .55; }
.ar-preview { position: fixed; pointer-events: none; z-index: 50; width: 160px; aspect-ratio: 3 / 4; background: #b6c9d9; clip-path: polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%); overflow: hidden; transform: translate(18px, -50%); box-shadow: 0 12px 30px rgba(0,0,0,.5); display: grid; place-items: center; }
.ar-preview img { width: 70%; height: 70%; object-fit: contain; filter: drop-shadow(0 6px 10px rgba(0,0,0,.35)); }
.ar-preview .ar-ph { font-size: 26px; color: rgba(11,15,19,.35); text-align: center; line-height: 1.2; padding: 8px; }
@media (max-width: 768px) { .ar-colhead { display: none; } .ar-row { grid-template-columns: 1fr auto; } .ar-no, .ar-kit, .ar-season { display: none; } .ar-preview { display: none !important; } .ar-search { flex: 1 1 100%; } .ar-title, .ar-filterbar, .ar-list, .ar-colhead { padding-left: 18px; padding-right: 18px; } }
@media (prefers-reduced-motion: reduce) { .ar-row { animation: none !important; opacity: 1 !important; transform: none !important; } }
`;

export default function ArchivePage({
  cartCount = 0,
  menuOpen = false,
  setMenuOpen,
  onNavigate,
  onSelect,
  onAdd,
  onNotify,
  onCartClick,
  onProfileClick,
}: ArchiveProps) {
  const go = (label: string) => {
    onNavigate?.(label);
    setMenuOpen?.(false);
  };

  const [entries, setEntries] = useState<ArchiveEntry[]>(() => {
    const c = getCachedAllCloudinaryKits();
    if (!c) return [];
    return c.map((k) => ({
      id: k.id,
      club: parseClub(k.name),
      season: parseSeason(k.name),
      kit: parseKit(k.name),
      price: k.price,
      status: k.inStock ? "IN STOCK" : "SOLD OUT",
      image: k.image,
      teamId: teamSlug(parseClub(k.name)),
    }));
  });
  const [loading, setLoading] = useState(() => !getCachedAllCloudinaryKits());
  const [statusFilter, setStatusFilter] = useState<"ALL" | "IN STOCK" | "SOLD OUT">("ALL");
  const [decadeFilter, setDecadeFilter] = useState<"ALL" | "1990s" | "2000s" | "2010s" | "2020s">("ALL");
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [notified, setNotified] = useState<Set<string>>(new Set());
  const [hovered, setHovered] = useState<ArchiveEntry | null>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [emailError, setEmailError] = useState("");

  useEffect(() => {
    const cached = getCachedAllCloudinaryKits();
    if (cached) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      try {
        if (CLOUDINARY_CLOUD_NAME) {
          const kits = await fetchAllCloudinaryKits();
          const mapped: ArchiveEntry[] = kits.map((k) => ({
            id: k.id,
            club: parseClub(k.name),
            season: parseSeason(k.name),
            kit: parseKit(k.name),
            price: k.price,
            status: k.inStock ? "IN STOCK" : "SOLD OUT",
            image: k.image,
            teamId: teamSlug(parseClub(k.name)),
          }));
          if (!cancelled) setEntries(mapped.length ? mapped : SAMPLE_ENTRIES);
        } else {
          if (!cancelled) setEntries(SAMPLE_ENTRIES);
        }
      } catch {
        if (!cancelled) setEntries(SAMPLE_ENTRIES);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries
      .filter((e) => (statusFilter === "ALL" ? true : e.status === statusFilter))
      .filter((e) => (decadeFilter === "ALL" ? true : decadeOf(e.season) === decadeFilter))
      .filter((e) => (!q ? true : (e.club.toLowerCase().includes(q) || e.season.toLowerCase().includes(q))))
      .sort((a, b) => parseInt(b.season.slice(0, 4), 10) - parseInt(a.season.slice(0, 4), 10));
  }, [entries, statusFilter, decadeFilter, search]);

  const handleNotify = (entry: ArchiveEntry) => {
    const ok = /\S+@\S+\.\S+/.test(email);
    if (!ok) { setEmailError("Invalid email"); return; }
    setEmailError("");
    onNotify?.(email.trim(), entry);
    setNotified((prev) => new Set(prev).add(entry.id));
    setExpandedId(null);
    setEmail("");
  };

  return (
    <div className="ar-root">
      <style>{css}</style>
      <div className="ar-fixed">
        <header className="topbar" style={{ background: "transparent" }}>
          <a className="logo" href="#top" onClick={(e) => { e.preventDefault(); go("Collection"); }}>MJ<span>//</span></a>
          <nav>
            {NAV_LINKS.map((label) => (
              <a key={label} onClick={() => go(label)} style={{ cursor: "pointer", fontWeight: label === "Archive" ? 700 : 400 }}>
                [ {label.toUpperCase()} ]
              </a>
            ))}
          </nav>
          <div className="tools">
            <button className="profile-trigger" aria-label="Profile" onClick={onProfileClick}><Icon name="profile" /></button>
            <button className="cart-trigger" aria-label={`Bag with ${cartCount} items`} onClick={onCartClick}>
              <Icon name="bag" /><b>{cartCount}</b>
            </button>
            <button className="menu-trigger" onClick={() => setMenuOpen?.(!menuOpen)} aria-label="Open navigation">
              <Icon name={menuOpen ? "x" : "menu"} size={17} />
            </button>
          </div>
        </header>
        {menuOpen && (
          <nav className="mobile-nav" style={{ background: "var(--deep)" }}>
            {NAV_LINKS.map((label) => (
              <a key={label} onClick={() => go(label)} style={{ cursor: "pointer" }}>[ {label} ]</a>
            ))}
          </nav>
        )}
      </div>
      <div className="ar-title">
        <span className="ar-bracket">[ THE VAULT ]</span>
        <h1>ARCHIVE</h1>
        <div className="ar-info">
          [ {entries.length} KITS INDEXED ]<br />
          [ NEWEST SEASON FIRST ]<br />
          [ HOVER A ROW FOR PREVIEW ]
        </div>
      </div>
      <div className="ar-filterbar">
        <div className="ar-chipgroup" role="group" aria-label="Status filter">
          {(["ALL", "IN STOCK", "SOLD OUT"] as const).map((s) => (
            <button key={s} className="ar-chip" aria-pressed={statusFilter === s} onClick={() => setStatusFilter(s)}>{s}</button>
          ))}
        </div>
        <div className="ar-chipgroup" role="group" aria-label="Decade filter">
          {(["ALL", "1990s", "2000s", "2010s", "2020s"] as const).map((d) => (
            <button key={d} className="ar-chip" aria-pressed={decadeFilter === d} onClick={() => setDecadeFilter(d)}>{d}</button>
          ))}
        </div>
        <input className="ar-search" type="search" placeholder="SEARCH CLUB OR SEASON" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search club or season" />
      </div>
      <div className="ar-colhead">
        <span>NO</span><span>CLUB</span><span>KIT</span><span>SEASON</span><span>PRICE</span><span>STATUS</span>
      </div>
      <main className="ar-list" onMouseMove={(e) => setMouse({ x: e.clientX, y: e.clientY })}>
        {loading ? (
          <div className="ar-empty">[ LOADING VAULT... ]</div>
        ) : filtered.length === 0 ? (
          <div className="ar-empty">[ NOTHING IN THE VAULT MATCHES ]</div>
        ) : (
          filtered.map((entry, index) => {
            const isSold = entry.status === "SOLD OUT";
            const isNotified = notified.has(entry.id);
            return (
              <div key={entry.id} className={`ar-row ${isSold ? "ar-sold" : ""}`} style={{ animationDelay: `${Math.min(index, 20) * 30}ms` }} onMouseEnter={() => setHovered(entry)} onMouseLeave={() => setHovered(null)}>
                <span className="ar-no">{String(index + 1).padStart(2, "0")}</span>
                <span className="ar-club">{entry.club}</span>
                <span className="ar-kit">{entry.kit.toUpperCase()}</span>
                <span className="ar-season">{entry.season}</span>
                <span className="ar-price">{formatPrice(entry.price)}</span>
                <div className="ar-status">
                  <span className={`ar-tag ${isSold ? "out" : "in"}`}>{isSold ? "× SOLD OUT" : "● IN STOCK"}</span>
                  {!isSold ? (
                    <button className="ar-btn" onClick={() => { if (entry.teamId && onSelect) onSelect(entry.teamId); else if (onAdd) onAdd(`${entry.club} ${entry.season} ${entry.kit}`, entry.image, entry.price); }} disabled={!entry.teamId && !onAdd}>VIEW →</button>
                  ) : isNotified ? (
                    <span className="ar-msg">✓ WE'LL TELL YOU</span>
                  ) : (
                    <button className="ar-btn ghost" onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}>NOTIFY ME</button>
                  )}
                </div>
                {isSold && expandedId === entry.id && !isNotified && (
                  <div className="ar-notifyform">
                    <input type="email" placeholder="you@email.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email for notify" />
                    <button className="ar-btn" onClick={() => handleNotify(entry)}>SEND</button>
                    {emailError && <span style={{ color: "#f87171", fontSize: 10 }}>{emailError}</span>}
                  </div>
                )}
              </div>
            );
          })
        )}
      </main>
      {hovered && (
        <div className="ar-preview" style={{ left: mouse.x, top: mouse.y }}>
          {hovered.image ? (
            <img src={hovered.image} alt={hovered.club} />
          ) : (
            <div className="ar-ph">
              {hovered.club.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase()}
              <br />
              {hovered.season}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

