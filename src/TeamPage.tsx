import React, { useRef, useEffect, useState } from "react";
import { findTeam, teamSlug } from "./teams";
import { leagues } from "./leagues";
import { CLOUDINARY_CLOUD_NAME, fetchCloudinaryKits } from "./cloudinary";

type PageName = "landing" | "jerseys" | "retro" | "league" | "archive";

interface TeamPageProps {
  teamId: string;
  cartCount: number;
  menuOpen: boolean;
  setMenuOpen: (v: boolean) => void;
  onNavigate: (page: PageName) => void;
  onBack: () => void;
  onAdd: (name: string, image?: string) => void;
}

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

const css = `
@import url("https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@800&display=swap");

.tp-root {
  position: relative;
  color: #fff;
  background: linear-gradient(180deg, #000 0%, #000 34%, #1c2630 52%, #34475a 74%, #5b7189 100%);
}

.tp-hero {
  position: relative;
  height: clamp(380px, 60vh, 550px);
  overflow: hidden;
  perspective: 900px;
}
.tp-title {
  position: absolute;
  z-index: 4;
  left: clamp(20px, 6vw, 70px);
  top: clamp(40px, 9vh, 90px);
  margin: 0;
  font-family: "Barlow Condensed", "Oswald", "Arial Narrow", sans-serif;
  font-weight: 800;
  font-size: clamp(56px, 9vw, 112px);
  line-height: .78;
  letter-spacing: -.055em;
  text-transform: uppercase;
  text-shadow: 0 4px 4px rgba(0,0,0,.45), 0 10px 24px rgba(0,0,0,.6);
  animation: tp-slide .9s cubic-bezier(.2,.8,.2,1) both;
}
.tp-back {
  position: absolute;
  z-index: 5;
  left: clamp(20px, 6vw, 70px);
  top: clamp(14px, 3vh, 28px);
  background: transparent;
  color: #fff;
  border: 1px solid rgba(255,255,255,.35);
  padding: 7px 12px;
  font-size: 10px;
  letter-spacing: .1em;
  cursor: pointer;
  transition: background .25s ease, color .25s ease, transform .25s ease;
}
.tp-back:hover { background: #fff; color: #0b0f13; transform: translateX(-3px); }

.tp-shirt {
  position: absolute;
  z-index: 2;
  left: 50%;
  top: 18%;
  height: 86%;
  width: auto;
  max-width: 70%;
  object-fit: contain;
  transform: translateX(-50%) scale(2);
  filter: brightness(.7) saturate(.9);
  animation: tp-float 6s ease-in-out infinite;
  will-change: transform, opacity;
  backface-visibility: hidden;
}
.tp-season {
  position: absolute;
  z-index: 1;
  left: -2%;
  bottom: 6%;
  font-size: clamp(130px, 24vw, 340px);
  line-height: .8;
  font-weight: 900;
  font-style: italic;
  white-space: nowrap;
  color: rgba(255,255,255,.09);
  transform: rotate(-16deg);
  user-select: none;
  pointer-events: none;
  animation: tp-drift 9s ease-in-out infinite alternate;
}
.tp-wash {
  position: absolute;
  z-index: 3;
  left: 0; right: 0; bottom: 0;
  height: 42%;
  background: linear-gradient(180deg, rgba(0,0,0,0) 0%, #1c2630 100%);
  pointer-events: none;
}
.tp-count {
  position: absolute;
  z-index: 4;
  right: clamp(20px, 6vw, 70px);
  bottom: 22%;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 10px;
  letter-spacing: .1em;
}
.tp-count i {
  display: block;
  height: 1px;
  background: #fff;
  width: 0;
  animation: tp-line 1.2s .4s cubic-bezier(.2,.8,.2,1) forwards;
}

.tp-kits { padding: 6px clamp(20px, 6vw, 70px) 90px; margin-top: -40px; position: relative; z-index: 10; }
.tp-kits-label {
  text-align: center;
  font-size: 18px;
  font-weight: 700;
  letter-spacing: .12em;
  margin: 0 0 38px;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.5);
  position: relative;
  z-index: 3;
}
.tp-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 40px clamp(24px, 6vw, 80px);
  max-width: 900px;
  margin: 0 auto;
  position: relative;
  z-index: 2;
}
.tp-card {
  opacity: 0;
  transform: translateY(30px);
  animation: tp-rise .8s cubic-bezier(.2,.8,.2,1) forwards;
}
.tp-img {
  position: relative;
  display: block;
  width: 100%;
  aspect-ratio: 4 / 3;
  padding: 0;
  border: 0;
  overflow: hidden;
  cursor: pointer;
  background: #b6c9d9;
  clip-path: polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%);
}
.tp-img img {
  width: 100%; height: 100%;
  object-fit: cover;
  transition: transform .7s cubic-bezier(.2,.8,.2,1);
}
.tp-img::after {
  content: "";
  position: absolute; inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgba(255,255,255,.35) 50%, transparent 65%);
  transform: translateX(-120%);
  transition: transform .9s ease;
  pointer-events: none;
}
.tp-add {
  position: absolute; left: 0; right: 0; bottom: 0;
  padding: 10px 0;
  font-size: 10px; letter-spacing: .1em; text-align: center;
  background: rgba(11,15,19,.88); color: #fff;
  transform: translateY(100%);
  transition: transform .35s ease;
  z-index: 2;
}
.tp-card:hover .tp-img img { transform: scale(1.07); }
.tp-card:hover .tp-img::after { transform: translateX(120%); }
.tp-card:hover .tp-add, .tp-img:focus-visible .tp-add { transform: none; }
.tp-img:focus-visible { outline: 2px solid #fff; outline-offset: 3px; }

.tp-name { margin: 12px 0 8px; font-size: 13px; letter-spacing: .05em; text-transform: uppercase; font-weight: 700; }
.tp-meta { display: flex; justify-content: space-between; font-size: 9px; letter-spacing: .08em; }
.tp-meta i { font-style: normal; color: #d8f7a8; }
.tp-meta b { font-weight: 400; }

.tp-missing { padding: 140px 20px; text-align: center; }
.tp-missing h2 { font-size: 48px; margin: 6px 0 24px; font-weight: 800; }

@keyframes tp-slide { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: none; } }
@keyframes tp-fade  { from { opacity: 0; } to { opacity: 1; } }
@keyframes tp-float { 0%, 100% { margin-top: 0; } 50% { margin-top: -10px; } }
@keyframes tp-drift { from { transform: rotate(-16deg) translateX(0); } to { transform: rotate(-14deg) translateX(24px); } }
@keyframes tp-line  { to { width: 120px; } }
@keyframes tp-rise  { to { opacity: 1; transform: none; } }

@media (max-width: 700px) {
  .tp-grid { grid-template-columns: 1fr; gap: 30px; }
  .tp-shirt { max-width: 90%; height: 70%; top: 22%; }
  .tp-count { display: none; }
}
@media (prefers-reduced-motion: reduce) {
  .tp-title, .tp-shirt, .tp-season, .tp-card { animation: none; opacity: 1; transform: none; }
  .tp-shirt { transform: translateX(-50%) scale(2); }
  .tp-count i { animation: none; width: 120px; }
  .tp-img img, .tp-img::after, .tp-add { transition: none; }
}
`;

export default function TeamPage({
  teamId,
  cartCount,
  menuOpen,
  setMenuOpen,
  onNavigate,
  onBack,
  onAdd,
}: TeamPageProps) {
  const foundTeam = findTeam(teamId);
  // Fall back to a generated team so clubs without a dedicated entry (e.g. Fulham)
  // still open a team page instead of "[ NOT FOUND ]". Jersey image won't exist,
  // so the Coming Soon state kicks in automatically.
  const leagueForClub = leagues.find((l) =>
    l.clubs.some((c) => teamSlug(c) === teamId)
  );
  const team =
    foundTeam ??
    (teamId
      ? {
          id: teamId,
          name: teamId
            .split("-")
            .map((w) => (w ? w.charAt(0).toUpperCase() + w.slice(1) : w))
            .join(" "),
          league: leagueForClub?.name ?? "",
          crest: `/images/clubs/${teamId}.png`,
          jersey: `/images/jerseys/${teamId}.png`,
          price: leagueForClub?.price ?? "$12.00",
        }
      : null);
  const go = (page: PageName) => {
    onNavigate(page);
    setMenuOpen(false);
  };

  /* Home kit uses team.jersey. For an away kit, add an optional `awayJersey`
     (image path) to the team in teams.ts and it will show up automatically.
     For a cleaner hero, add an optional `heroJersey` (transparent-bg image). */
  const awayJersey = team ? (team as { awayJersey?: string }).awayJersey : undefined;
  const localKits = team
    ? [
        { label: "Home Kit", image: team.jersey },
        ...(awayJersey ? [{ label: "Away Kit", image: awayJersey }] : []),
      ]
    : [];

  // Cloudinary 26/27 jerseys are stored under the tag "NewSeason2627".
  // Match resources to this team by name/public_id. If none match -> Coming Soon.
  const [cloudKits, setCloudKits] = useState<{ name: string; image: string }[]>([]);
  const [cloudChecked, setCloudChecked] = useState(false);
  useEffect(() => {
    if (!team) {
      setCloudChecked(true);
      return;
    }
    if (!CLOUDINARY_CLOUD_NAME) {
      setCloudChecked(true);
      return;
    }
    let cancelled = false;
    fetchCloudinaryKits("NewSeason2627")
      .then((res) => {
        if (cancelled) return;
        const tn = team.name.toLowerCase();
        const matches = res.filter((k) => {
          const n = k.name.toLowerCase();
          return (
            n.includes(tn) ||
            tn.includes(n) ||
            k.id.toLowerCase().includes(team.id)
          );
        });
        setCloudKits(matches.map((k) => ({ name: k.name, image: k.image })));
        setCloudChecked(true);
      })
      .catch(() => {
        if (cancelled) return;
        setCloudKits([]);
        setCloudChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [team]);

  // Fall back to local image-availability check when Cloudinary isn't configured.
  const [jerseyAvailable, setJerseyAvailable] = useState<boolean | null>(null);
  useEffect(() => {
    if (CLOUDINARY_CLOUD_NAME) return;
    if (!team || !team.jersey) {
      setJerseyAvailable(false);
      return;
    }
    const img = new Image();
    img.onload = () => setJerseyAvailable(true);
    img.onerror = () => setJerseyAvailable(false);
    img.src = team.jersey;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [team]);

  const cloudConfigured = !!CLOUDINARY_CLOUD_NAME;
  const showComingSoon = cloudConfigured
    ? cloudChecked && cloudKits.length === 0
    : jerseyAvailable === false;

  const kits = team
    ? cloudConfigured
      ? cloudChecked
        ? cloudKits.length > 0
          ? cloudKits.map((k, i) => ({
              label: k.name || (i === 0 ? "Home Kit" : `Kit ${i + 1}`),
              image: k.image,
            }))
          : []
        : localKits
      : jerseyAvailable === false
        ? []
        : localKits
    : [];

  const heroRef = useRef<HTMLElement>(null);
  const shirtRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const hero = heroRef.current;
    const shirt = shirtRef.current;
    if (!hero || !shirt) return;

    let mouseX = 0;
    let mouseY = 0;
    let scrollProgress = 0;
    let rafId = 0;
    let currentOpacity = 0;

    const fadeIn = () => {
      currentOpacity = Math.min(1, currentOpacity + 0.025);
      shirt.style.opacity = String(currentOpacity);
      if (currentOpacity < 1) rafId = requestAnimationFrame(fadeIn);
    };
    rafId = requestAnimationFrame(fadeIn);

    const updateTransform = () => {
      const cursorX = mouseX * 18;
      const cursorY = mouseY * 18;
      const rotX = scrollProgress * 22;
      const rotY = scrollProgress * -14;
      const scrollOpacity = Math.max(0.12, 1 - scrollProgress * 0.75);
      const finalOpacity = Math.min(currentOpacity, scrollOpacity);
      shirt.style.transform = `rotateY(${rotY}deg) rotateX(${rotX}deg) translate(${cursorX}px, ${cursorY}px) translateX(-50%) scale(2)`;
      shirt.style.opacity = String(finalOpacity);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      mouseX = (e.clientX - cx) / (rect.width / 2);
      mouseY = (e.clientY - cy) / (rect.height / 2);
      mouseX = Math.max(-1, Math.min(1, mouseX));
      mouseY = Math.max(-1, Math.min(1, mouseY));
      updateTransform();
    };

    const handleScroll = () => {
      const rect = hero.getBoundingClientRect();
      const scrolled = -rect.top;
      const heroHeight = rect.height;
      scrollProgress = Math.max(0, Math.min(1, scrolled / (heroHeight * 0.7)));
      updateTransform();
    };

    hero.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      hero.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("scroll", handleScroll);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <style>{css}</style>

      <header className="topbar">
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
        <nav className="mobile-nav">
          <a onClick={() => go("landing")} style={{ cursor: "pointer" }}>[ Collection ]</a>
          <a onClick={() => go("jerseys")} style={{ cursor: "pointer" }}>[ Jerseys ]</a>
          <a onClick={() => go("retro")} style={{ cursor: "pointer" }}>[ Retro ]</a>
          <a onClick={() => go("archive")} style={{ cursor: "pointer" }}>[ Archive ]</a>
        </nav>
      )}

      <main id="top" className="tp-root">
        {team ? (
          <>
            <section className="tp-hero" ref={heroRef}>
              <button className="tp-back" onClick={onBack}>← BACK TO CLUBS</button>
              <h1 className="tp-title">{team.name}<br />Kits</h1>
              <div className="tp-season" aria-hidden="true">26/27</div>
              <img className="tp-shirt" ref={shirtRef} src="/images/forTeams/HeroTM.png" alt={`${team.name} jersey`} style={{ opacity: 0 }} />
              <div className="tp-wash" />
              <div className="tp-count"><span>2024</span><i /><span>2026</span></div>
            </section>

            <section className="tp-kits">
              <h2 className="tp-kits-label">{showComingSoon ? "Coming Soon" : "26/27 Jersey"}</h2>
              {showComingSoon ? (
                <div style={{ padding: "40px 0", textAlign: "center", opacity: .7, fontSize: 13, letterSpacing: ".08em" }}>
                  Our 26/27 kit for {team.name} is on its way — check back soon.
                </div>
              ) : (
                <div className="tp-grid">
                  {kits.map((kit, i) => (
                    <article className="tp-card" key={kit.label} style={{ animationDelay: `${0.15 + i * 0.15}s` }}>
                      <button
                        className="tp-img"
                        onClick={() => onAdd(`${team.name} ${kit.label}`, kit.image)}
                        aria-label={`Add ${team.name} ${kit.label} to bag`}
                      >
                        <img src={kit.image} alt={`${team.name} ${kit.label}`} loading="lazy" />
                        <span className="tp-add">+ QUICK ADD →</span>
                      </button>
                      <div className="tp-name">{kit.label}</div>
                      <div className="tp-meta"><i>● IN STOCK</i><b>{team.price}</b></div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        ) : (
          <section className="tp-missing">
            <span>[ NOT FOUND ]</span>
            <h2>TEAM</h2>
            <button className="tp-back" style={{ position: "static" }} onClick={onBack}>← BACK TO CLUBS</button>
          </section>
        )}
      </main>
    </>
  );
}

