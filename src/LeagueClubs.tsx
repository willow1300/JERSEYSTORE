import type { League } from "./leagues";
import { clubImage } from "./leagues";
import { findTeam, teamSlug } from "./teams";
import { clubBadge } from "./clubBadges";

type PageName = "landing" | "jerseys" | "retro" | "league" | "team" | "archive";

interface LeagueClubsProps {
  league: League;
  cartCount: number;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  onNavigate: (page: PageName) => void;
  onBack: () => void;
  onSelect: (teamId: string) => void;
}

/* Scoped styles: prefixed with lc- so they never clash with the global .product / .catalog rules */
const css = `
.lc-root {
  position: relative;
  width: 100%;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: linear-gradient(180deg, #5b7189 0%, #3a4d60 18%, #1c2630 48%, #090c10 75%, #000 100%);
}
.lc-fixed { flex: 0 0 auto; position: relative; z-index: 5; }
.lc-fixed .topbar { position: relative !important; }
.lc-head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  padding: 18px 40px 22px;
  color: #fff;
}
.lc-head span { font-size: 11px; letter-spacing: .12em; opacity: .75; }
.lc-head h2 { margin: 4px 0 0; font-size: clamp(32px, 5vw, 56px); line-height: .95; font-weight: 400; }
.lc-head .lc-data { font-size: 10px; line-height: 1.7; letter-spacing: .08em; opacity: .7; text-align: left; }
.lc-head button {
  background: #fff; color: #0b0f13; border: 0; padding: 10px 16px;
  font-size: 11px; letter-spacing: .08em; cursor: pointer;
  transition: transform .25s ease, background .25s ease;
}
.lc-head button:hover { transform: translateX(-4px); background: #dfe8f1; }
.lc-scroll {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 14px 40px 90px;
  scrollbar-width: none;
  -webkit-mask-image: linear-gradient(to bottom, transparent 0, #000 26px, #000 calc(100% - 48px), transparent 100%);
          mask-image: linear-gradient(to bottom, transparent 0, #000 26px, #000 calc(100% - 48px), transparent 100%);
}
.lc-scroll::-webkit-scrollbar { display: none; }
.lc-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
  gap: 22px 16px;
  max-width: 1100px;
  margin: 0 auto;
}
.lc-card {
  position: relative;
  opacity: 0;
  transform: translateY(26px) scale(.96);
  animation: lc-rise .7s cubic-bezier(.2, .8, .2, 1) forwards;
}
@keyframes lc-rise { to { opacity: 1; transform: none; } }
.lc-tile {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 4 / 5;
  padding: 0;
  border: 0;
  cursor: pointer;
  overflow: hidden;
  background: #b6c9d9;
  clip-path: polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%);
  transition: transform .45s cubic-bezier(.2, .8, .2, 1), filter .45s ease;
}
.lc-tile img {
  position: absolute; inset: 14%;
  width: 72%; height: 72%;
  object-fit: contain;
  transition: transform .6s cubic-bezier(.2, .8, .2, 1);
  filter: drop-shadow(0 6px 10px rgba(0,0,0,.35));
}
.lc-initials {
  position: absolute; inset: 0;
  display: grid; place-items: center;
  font-size: 34px; color: rgba(11,15,19,.35);
}
.lc-tile::after {
  content: "";
  position: absolute; inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,.45) 50%, transparent 65%);
  transform: translateX(-120%);
  transition: transform .8s ease;
  pointer-events: none;
}
.lc-view {
  position: absolute; left: 0; right: 0; bottom: 0;
  padding: 7px 0;
  font-size: 9px; letter-spacing: .1em; text-align: center;
  color: #fff; background: rgba(11,15,19,.82);
  transform: translateY(100%);
  transition: transform .35s ease;
}
.lc-card:hover .lc-tile { transform: translateY(-6px); filter: brightness(1.06); }
.lc-card:hover .lc-tile img { transform: scale(1.12) rotate(-3deg); }
.lc-card:hover .lc-tile::after { transform: translateX(120%); }
.lc-card:hover .lc-view,
.lc-tile:focus-visible .lc-view { transform: none; }
.lc-tile:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }
.lc-name {
  margin-top: 9px;
  text-align: center;
  font-size: 11px;
  letter-spacing: .06em;
  color: #c7d4e0;
  text-transform: uppercase;
  transition: color .3s ease;
}
.lc-card:hover .lc-name { color: #fff; }
.lc-no {
  position: absolute; top: 5px; right: 20px;
  font-size: 9px; color: rgba(11,15,19,.6);
  pointer-events: none;
}
@media (max-width: 700px) {
  .lc-head { flex-wrap: wrap; padding: 14px 18px 16px; }
  .lc-head .lc-data { display: none; }
  .lc-scroll { padding: 12px 18px 80px; }
  .lc-grid { grid-template-columns: repeat(3, 1fr); gap: 16px 10px; }
}
@media (prefers-reduced-motion: reduce) {
  .lc-card { animation: none; opacity: 1; transform: none; }
  .lc-tile, .lc-tile img, .lc-tile::after, .lc-view { transition: none; }
}
`;

/* Small local icon set (same drawings as the Icon in App.tsx) */
function Icon({ name, size = 15 }: { name: "bag" | "menu" | "profile" | "x"; size?: number }) {
  const paths = {
    bag: (<><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>),
    menu: (<><path d="M4 7h16" /><path d="M4 17h16" /></>),
    profile: (<><circle cx="12" cy="8" r="3" /><path d="M5 21v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" /></>),
    x: (<><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>),
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

export default function LeagueClubs({
  league,
  cartCount,
  menuOpen,
  setMenuOpen,
  onNavigate,
  onBack,
  onSelect,
}: LeagueClubsProps) {
  const go = (page: PageName) => {
    onNavigate(page);
    setMenuOpen(false);
  };

  return (
    <div className="lc-root">
      <style>{css}</style>

      <div className="lc-fixed">
        <header className="topbar" style={{ background: "transparent" }}>
          <a className="logo" href="#top" onClick={(e) => { e.preventDefault(); go("landing"); }}>
            MJ<span>//</span>
          </a>
          <nav>
            <a onClick={() => go("landing")}>[ COLLECTION ]</a>
            <a onClick={() => go("jerseys")}>[ JERSEYS ]</a>
            <a onClick={() => go("retro")}>[ RETRO ]</a>
            <a onClick={() => go("archive")}>[ ARCHIVE ]</a>
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

        <div className="lc-head">
          <div>
            <span>[ {league.country.toUpperCase()} ]</span>
            <h2>{league.name.toUpperCase()}</h2>
          </div>
          <div className="lc-data">
            [ {league.clubs.length} CLUBS ]<br />
            [ AUTHENTIC + RETRO ]<br />
            [ WORLDWIDE DELIVERY ]
          </div>
          <button onClick={onBack}>← ALL LEAGUES</button>
        </div>
      </div>

      <main id="top" className="lc-scroll">
        <div className="lc-grid">
          {league.clubs.map((club, index) => {
            const id = teamSlug(club);
            const t = findTeam(id);
            const initials = club.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase();
            return (
              <article className="lc-card" key={club} style={{ animationDelay: `${Math.min(index, 14) * 55}ms` }}>
                <button
                  className="lc-tile"
                  onClick={() => onSelect(t ? t.id : id)}
                  aria-label={`View ${club} jersey`}
                >
                  <span className="lc-initials" aria-hidden="true">{initials}</span>
                  <img
                    src={clubBadge(club) ?? (t ? t.crest : clubImage(club))}
                    alt={club}
                    loading="lazy"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                  <span className="lc-view">VIEW JERSEY →</span>
                </button>
                <span className="lc-no">{String(index + 1).padStart(2, "0")}</span>
                <div className="lc-name">{club}</div>
              </article>
            );
          })}
        </div>
      </main>
    </div>
  );
}
