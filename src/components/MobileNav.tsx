// Shared full-width mobile toggle menu: Home / Kits / Best-Sellers / Retro /
// Cart / Profile icon tiles. Styles live in index.css (.mobile-nav, .mn-*).
import { useEffect, useRef } from 'react'

interface MobileNavProps {
  menuOpen?: boolean
  setMenuOpen?: (v: boolean) => void
  cartCount?: number
  onHome: () => void
  onKits: () => void
  onCart: () => void
  onProfile: () => void
  onBestSellers?: () => void
  onRetro?: () => void
}

function MnIcon({ name, size = 22 }: { name: 'home' | 'jersey' | 'bag' | 'profile' | 'star' | 'disc' | 'x'; size?: number }) {
  const paths = {
    home: <><path d="M3 11.5 12 4l9 7.5" /><path d="M5.5 10V20h13V10" /><path d="M10 20v-5h4v5" /></>,
    jersey: <path d="M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />,
    bag: <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0 1 16 0v1" /></>,
    star: <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />,
    disc: <><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" /></>,
    x: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

export default function MobileNav({ menuOpen, setMenuOpen, cartCount, onHome, onKits, onCart, onProfile, onBestSellers, onRetro }: MobileNavProps) {
  // close the open menu as soon as the page starts scrolling
  useEffect(() => {
    if (!menuOpen) return
    const close = () => setMenuOpen?.(false)
    window.addEventListener('scroll', close, { passive: true })
    return () => window.removeEventListener('scroll', close)
  }, [menuOpen, setMenuOpen])

  if (!menuOpen) return null
  return (
    <nav className="mobile-nav" aria-label="Mobile navigation">
      <div className="mn-head">
        <span className="mn-title">MENU</span>
        <button className="mn-close" onClick={() => setMenuOpen?.(false)} aria-label="Close menu"><MnIcon name="x" size={16} /></button>
      </div>
      <div className="mn-grid">
        <button className="mn-tile" onClick={onHome}><MnIcon name="home" size={20} /><span>Home</span></button>
        <button className="mn-tile" onClick={onKits}><MnIcon name="jersey" size={20} /><span>Kits</span></button>
        {onBestSellers && <button className="mn-tile" onClick={onBestSellers}><MnIcon name="star" size={20} /><span>Best</span></button>}
        {onRetro && <button className="mn-tile" onClick={onRetro}><MnIcon name="disc" size={20} /><span>Retro</span></button>}
        <button className="mn-tile" onClick={onCart}>
          <MnIcon name="bag" size={20} />
          <span>Cart</span>
          {(cartCount ?? 0) > 0 && <b className="mn-badge">{cartCount}</b>}
        </button>
        <button className="mn-tile" onClick={onProfile}><MnIcon name="profile" size={20} /><span>Profile</span></button>
      </div>
    </nav>
  )
}

// App-style bottom navigation bar: Home / Kits / Cart / Profile, fixed to the
// bottom of the screen on mobile only (CSS: .bm-* inside the 620px block).
export function BottomNav({ active, cartCount, onHome, onKits, onCart, onProfile }: {
  active: 'home' | 'kits' | 'cart' | 'profile'
  cartCount?: number
  onHome: () => void
  onKits: () => void
  onCart: () => void
  onProfile: () => void
}) {
  const navRef = useRef<HTMLElement | null>(null)

  // fade away while scrolling down; fade back up when scrolling stops or reverses
  useEffect(() => {
    const el = navRef.current
    if (!el) return
    let lastY = window.scrollY
    let hidden = false
    let stopTimer: number | undefined
    const hide = () => { if (!hidden) { hidden = true; el.classList.add('bm-hidden') } }
    const show = () => { if (hidden) { hidden = false; el.classList.remove('bm-hidden') } }
    const onScroll = () => {
      const y = window.scrollY
      const delta = y - lastY
      lastY = y
      window.clearTimeout(stopTimer)
      if (delta > 4) hide()
      else if (delta < -4) show()
      stopTimer = window.setTimeout(show, 400)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.clearTimeout(stopTimer)
      el.classList.remove('bm-hidden')
    }
  }, [])

  return (
    <nav ref={navRef} className="bm-nav" aria-label="Bottom navigation">
      <button className={`bm-item${active === 'home' ? ' active' : ''}`} onClick={onHome}><MnIcon name="home" size={21} /><span>Home</span></button>
      <button className={`bm-item${active === 'kits' ? ' active' : ''}`} onClick={onKits}><MnIcon name="jersey" size={21} /><span>Kits</span></button>
      <button className={`bm-item${active === 'cart' ? ' active' : ''}`} onClick={onCart}>
        <span className="bm-icon-wrap">
          <MnIcon name="bag" size={21} />
          {(cartCount ?? 0) > 0 && <b className="bm-badge">{cartCount}</b>}
        </span>
        <span>Cart</span>
      </button>
      <button className={`bm-item${active === 'profile' ? ' active' : ''}`} onClick={onProfile}><MnIcon name="profile" size={21} /><span>Profile</span></button>
    </nav>
  )
}
