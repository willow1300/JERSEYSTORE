import { useState, useEffect, useRef } from 'react'
import Jerseys from './Jerseys'
import Retro from './Retro'
import BestSellers from './BestSellers'
import CartPage from './CartPage'
import ProductPage from './ProductPage'
import CheckoutPage from './CheckoutPage'
import type { Product } from '../data/types'
import { useLandingMotion } from '../utils/landingMotion'
import { WHATSAPP_LINK, CART_STORAGE_KEY, CART_EXPIRY_HOURS } from '../utils/constants'
import { NEW_ARRIVALS, gangImages } from '../data/newArrivals'
import { fetchKits, getCachedKits, REMOTE_ENABLED, type Kit } from '../utils/kits'

function Icon({ name, size = 17 }: { name: 'arrow' | 'bag' | 'menu' | 'profile' | 'search' | 'x' | 'heart'; size?: number }) {
  const paths = {
    arrow: <><path d="M5 19 19 5" /><path d="M10 5h9v9" /></>,
    bag: <><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></>,
    menu: <><path d="M4 7h16" /><path d="M4 17h16" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-1a8 8 0 0 1 16 0v1" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    x: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
    heart: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

// WhatsApp enquiries link lives in src/utils/constants.ts (configured via .env.local)

function toProduct(a: Kit): Product {
  return { id: a.id, name: a.name, image: a.image, price: a.price, sizes: a.sizes, gallery: a.gallery, retro: a.retro, club: a.club, inStock: a.inStock };
}

// Shown on the landing page only when no remote source is configured; otherwise
// the real (unsold) BaseRow kits would be preceded by a flash of placeholder ones.
const STATIC_ARRIVALS: Kit[] = NEW_ARRIVALS.map((a) => ({ ...a, sizes: [], gallery: [a.image], inStock: true, isNew: true, retro: false }))
const SEED_ARRIVALS: Kit[] = REMOTE_ENABLED ? [] : STATIC_ARRIVALS

// Kits flagged "new" in BaseRow; fall back to the first rows when no flag is set.
function pickArrivals(kits: Kit[]): Kit[] {
  const flagged = kits.filter((k) => k.isNew)
  return flagged.length ? flagged : kits.slice(0, STATIC_ARRIVALS.length)
}

function ArrivalCard({ item, onOpen }: { item: Kit; onOpen: (p: Product) => void }) {
  return (
    <article className={`na-card ${item.inStock ? '' : 'is-out'}`.trim()}>
      <div className="na-image" onClick={() => onOpen(toProduct(item))} role="button" tabIndex={0}>
        <img src={item.image} alt={item.name} />
        {!item.inStock && <span className="na-stock">SOLD OUT</span>}
      </div>
      <h3 className="na-name">{item.name}</h3>
      <p className="na-price">{`Ksh ${item.price.toLocaleString()}`}</p>
      <button className="na-btn" onClick={() => onOpen(toProduct(item))} disabled={!item.inStock}>
        {item.inStock ? 'SELECT OPTION' : 'NOT IN STOCK'}
      </button>
    </article>
  )
}

function LandingPage({
  menuOpen, setMenuOpen, cartCount, setCartCount,
  filterOpen, setFilterOpen, tone, setTone,
  toast, setToast, setPage, onSelectProduct, onProfileClick, onWishlistClick, arrivals,
}: {
  menuOpen: boolean; setMenuOpen: (v: boolean) => void
  cartCount: number; setCartCount: (v: number) => void
  filterOpen: boolean; setFilterOpen: (v: boolean) => void
  tone: string; setTone: (v: string) => void
  toast: string; setToast: (v: string) => void
  setPage: (v: string) => void
  onSelectProduct: (p: Product) => void
  onProfileClick: () => void
  onWishlistClick: () => void
  arrivals: Kit[]
}) {
  const [featureIdx, setFeatureIdx] = useState(0);
  const [featureFade, setFeatureFade] = useState(false);
  const naRef = useRef<HTMLDivElement>(null);
  const naRef2 = useRef<HTMLDivElement>(null);
  const scrollNa = (dir: -1 | 1, which: 1 | 2 = 1) => {
    const el = (which === 1 ? naRef : naRef2).current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('.na-card');
    const step = card ? (card.offsetWidth + 24) : 480;
    el.scrollBy({ left: dir * step, behavior: 'smooth' });
  };

  useEffect(() => {
    for (let i = 1; i <= 7; i++) {
      const img = new Image();
      img.src = `/images/campaignbg/feature${i}.jpg`;
    }
    const timer = setInterval(() => {
      setFeatureFade(true);
      setTimeout(() => {
        setFeatureIdx((i) => (i + 1) % 7);
        setFeatureFade(false);
      }, 600);
    }, 180000);
    return () => clearInterval(timer);
  }, []);

  return (
    <>
      <header className="topbar">
        <a className="logo" href="#top"><img src="/logos/mjerseyss_logo.svg" alt="MJ Erseys" /></a>
        <nav>
          <a onClick={() => setPage('landing')}>NEW-ARRIVAL</a>
          <a onClick={() => setPage('jerseys')}>ALL-KITS</a>
          <a onClick={() => setPage('retro')}>BEST-SELLERS</a>
          <a onClick={() => setPage('retro')}>RETRO</a>
        </nav>
        <div className="tools">
          <button className="cart-trigger" aria-label={`Bag with ${cartCount} items`}><Icon name="bag" size={15} /><b key={cartCount}>{cartCount}</b></button>
          <button className="wishlist-trigger" aria-label="Wishlist" onClick={onWishlistClick}><Icon name="heart" size={15} /></button>
          <button className="profile-trigger" aria-label="Profile" onClick={onProfileClick}><Icon name="profile" size={15} /></button>
          <button className="menu-trigger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation"><Icon name={menuOpen ? 'x' : 'menu'} /></button>
        </div>
      </header>

      {menuOpen && <nav className="mobile-nav">
  <a onClick={() => { setPage('landing'); setMenuOpen(false); }} style={{ cursor: 'pointer' }}>New-Arrival</a>
  <a onClick={() => { setPage('jerseys'); setMenuOpen(false); }} style={{ cursor: 'pointer' }}>All-Kits</a>
  <a onClick={() => { setPage('bestsellers'); setMenuOpen(false); }} style={{ cursor: 'pointer' }}>Best-Sellers</a>
  <a onClick={() => { setPage('retro'); setMenuOpen(false); }} style={{ cursor: 'pointer' }}>Retro</a>
  <a onClick={() => { onProfileClick(); setMenuOpen(false); }} style={{ cursor: 'pointer' }}>PROFILE</a>
</nav>}

      <main id="top">
        <section className="campaign" id="drop">
            <img className="campaign-bg" src="https://images.unsplash.com/photo-1606484527234-71e5b89ffcc6?auto=format&fit=crop&w=1600&q=90" alt="" />
            <div className="blue-wash" />
            <div className="season-code">[ FOOTBALL CULTURE 25.1 ] [ SERIES 01 ]</div>
            <div className="campaign-title">
              <p>COLLECTION</p>
              <div className="buy-lockup">
                <button onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })} aria-label="Shop collection"><Icon name="arrow" size={22} /></button>
                <span>ADD TO KIT</span>
              </div>
              <div className="hero-tags">[ ALL LEAGUES ]<br />[ AUTHENTIC + RETRO ]<br />[ WORLDWIDE DELIVERY ]</div>
            </div>
            <img className="hero-player" src="/images/hero/NewHero.jpg" alt="Hero player" />
            <div className="preview-stack">
              {[gangImages[0], gangImages[1]].map((img, i) => (
                <figure key={img}>
                  <img src={`/images/legacy/${img}`} alt={`Gang ${img}`} />
                  <figcaption>{String(i + 1).padStart(2, '0')}</figcaption>
                </figure>
              ))}
            </div>
            <div className="slide-count"><b>01</b><i /><span>07</span></div>
            <div className="socials"><span>IG</span><span>TK</span><span>X</span></div>
          </section>

          <section className="catalog" id="shop">
            <div className="catalog-head">
              <div className="catalog-title-center"><span>[ 26/27 COLLECTION ]</span><h2>NEW ARRIVAL</h2></div>
            </div>
            <div className="na-carousel">
              {arrivals.length === 0 && (
                <div className="ak-empty">[ LOADING LATEST KITS… ]</div>
              )}
              <div className="na-row" hidden={arrivals.length === 0}>
                <button className="na-arrow na-arrow-left" onClick={() => scrollNa(-1, 1)} aria-label="Previous arrivals (top row)">‹</button>
                <div className="na-track" ref={naRef}>
                  {arrivals.slice(0, Math.ceil(arrivals.length / 2)).map((item) => <ArrivalCard key={item.id} item={item} onOpen={onSelectProduct} />)}
                </div>
                <button className="na-arrow na-arrow-right" onClick={() => scrollNa(1, 1)} aria-label="More arrivals (top row)">›</button>
              </div>
              <div className="na-row" hidden={arrivals.length === 0}>
                <button className="na-arrow na-arrow-left" onClick={() => scrollNa(-1, 2)} aria-label="Previous arrivals (bottom row)">‹</button>
                <div className="na-track" ref={naRef2}>
                  {arrivals.slice(Math.ceil(arrivals.length / 2)).map((item) => <ArrivalCard key={item.id} item={item} onOpen={onSelectProduct} />)}
                </div>
                <button className="na-arrow na-arrow-right" onClick={() => scrollNa(1, 2)} aria-label="More arrivals (bottom row)">›</button>
              </div>
            </div>
          </section>

          <section className="manifesto" id="story">
            <img src="https://images.unsplash.com/photo-1549494592-af5ed0eadf2a?auto=format&fit=crop&w=1600&q=92" alt="A steep snow-covered mountain" />
            <img className="manifesto-player" src="/images/legacy/travis-scott.png" alt="" />
            <div className="manifesto-wash" />
            <div className="tag-wall" aria-hidden="true">FULLTIME</div>
            <p className="manifesto-note">GOOD KITS WERE NEVER<br />MADE TO STAY FOLDED.<br />WE SOURCE SHIRTS<br />WITH A PAST.</p>
            <h2>BUILT FOR THE TERRACE.<br />MADE FOR THE CITY.<br />FORGED TO LAST.</h2>
            <div className="peak-note">FOR THOSE WHO<br />SHOW UP. HOME<br />OR AWAY.</div>
            <div className="barcode" aria-label="Full Time Supply Company">|||| || ||| ||||| ||</div>
          </section>
        </main>

        <footer id="archive">
          <div className="logo"><img src="/logos/mjerseyss_logo.svg" alt="MJ Erseys" /></div>
          <p>INDEPENDENT FOOTBALL ARCHIVE<br />EST. 2026 / WORLDWIDE</p>
          <div><a href="#shop">SHOP</a><a href="#story">STORY</a><a href="#top">TOP ↑</a></div>
        </footer>
    </>
  )
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [filterOpen, setFilterOpen] = useState(false)
  const [tone, setTone] = useState('ALL')
  const [toast, setToast] = useState('')
  const [page, setPage] = useState('landing')
  const [gangIndex, setGangIndex] = useState(0)
  const [pendingAdd, setPendingAdd] = useState<string | null>(null)
  const [pendingImage, setPendingImage] = useState<string>('')
  const [pendingPrice, setPendingPrice] = useState<number>(85)
  const [addSize, setAddSize] = useState('M')
  const [addQty, setAddQty] = useState(1)
  const [addDelivery, setAddDelivery] = useState<'delivery' | 'pickup'>('delivery')
  const [addSuccess, setAddSuccess] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [cartItems, setCartItems] = useState<{name:string;size:string;qty:number;delivery:string;image?:string;price?:number}[]>([])
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [catalog, setCatalog] = useState<Product[]>(() => SEED_ARRIVALS.map(toProduct))
  const [arrivals, setArrivals] = useState<Kit[]>(() => getCachedKits() ? pickArrivals(getCachedKits()!) : SEED_ARRIVALS)

  // Account + wishlist (wishlist only exists while signed in; cleared on logout)
  const [account, setAccount] = useState<string | null>(() => localStorage.getItem('mj_account'))
  const [wishlist, setWishlist] = useState<string[]>(() => { try { return JSON.parse(localStorage.getItem('mj_wishlist') || '[]') } catch { return [] } })
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'register'>('signin')
  const [authEmail, setAuthEmail] = useState('')
  const [authPass, setAuthPass] = useState('')

  // Load the BaseRow table (Cloudinary fallback) and feed NEW ARRIVAL + related products.
  useEffect(() => {
    const cached = getCachedKits()
    if (cached?.length) {
      setCatalog(cached.map(toProduct))
      setArrivals(pickArrivals(cached))
      return
    }
    if (!REMOTE_ENABLED) return
    let cancelled = false
    fetchKits()
      .then((res) => {
        if (cancelled || !res?.length) return
        setCatalog(res.map(toProduct))
        setArrivals(pickArrivals(res))
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const addToCartFromDetail = (name: string, image: string, price: number, qty: number, size: string, delivery: 'delivery' | 'pickup') => {
    setCartItems(prev => [...prev, { name, size, qty, delivery, image, price }])
    setToast(`ADDED: ${name} · ${size} · ×${qty}`)
    window.setTimeout(() => setToast(''), 1600)
  }

  // Keep the detail page in sync once BaseRow supplies full metadata for a kit.
  const openProduct = (p: Product) => {
    const fresh = catalog.find(c => c.id === p.id) || p
    setSelectedProduct(fresh)
    setPage('product')
    window.scrollTo({ top: 0 })
  }

  const flash = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(''), 1800)
  }

  // Keep the wishlist cached in localStorage while signed in
  useEffect(() => {
    if (account) localStorage.setItem('mj_wishlist', JSON.stringify(wishlist))
  }, [wishlist, account])

  const toggleWishlist = (p: Product) => {
    if (!account) {
      setAuthOpen(true)
      flash('SIGN IN TO KEEP YOUR WISHLIST')
      return
    }
    const has = wishlist.includes(p.id)
    setWishlist(has ? wishlist.filter((x) => x !== p.id) : [...wishlist, p.id])
    flash(has ? `REMOVED FROM WISHLIST: ${p.name}` : `SAVED TO WISHLIST: ${p.name}`)
  }

  const submitAuth = () => {
    const email = authEmail.trim().toLowerCase()
    if (!/^\S+@\S+\.\S+$/.test(email)) { flash('ENTER A VALID EMAIL'); return }
    if (authPass.length < 4) { flash('PASSWORD TOO SHORT'); return }
    let accounts: Record<string, string> = {}
    try { accounts = JSON.parse(localStorage.getItem('mj_accounts') || '{}') } catch {}
    if (authMode === 'register') {
      if (accounts[email]) { flash('ACCOUNT EXISTS — SIGN IN INSTEAD'); return }
      accounts[email] = authPass
      localStorage.setItem('mj_accounts', JSON.stringify(accounts))
      setAccount(email)
      localStorage.setItem('mj_account', email)
      setAuthOpen(false); setAuthEmail(''); setAuthPass('')
      flash('ACCOUNT CREATED — WISHLIST UNLOCKED')
    } else {
      if (!accounts[email] || accounts[email] !== authPass) { flash('WRONG EMAIL OR PASSWORD'); return }
      setAccount(email)
      localStorage.setItem('mj_account', email)
      setAuthOpen(false); setAuthEmail(''); setAuthPass('')
      flash(`WELCOME BACK, ${email.toUpperCase()}`)
    }
  }

  const signOut = () => {
    localStorage.removeItem('mj_account')
    localStorage.removeItem('mj_wishlist')
    setAccount(null)
    setWishlist([])
    setAuthOpen(false)
    flash('SIGNED OUT — WISHLIST CLEARED')
  }

  useLandingMotion(page === 'landing')

  // Browser history support so the back button works between pages.
  const isPopRef = useRef(false)
  const prevRef = useRef({ page: 'landing' })
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const st = (e.state as any) || { page: 'landing' }
      isPopRef.current = true
      setPage(st.page || 'landing')
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])
  useEffect(() => {
    if (isPopRef.current) { isPopRef.current = false; return }
    const prev = prevRef.current
    if (prev.page === page) return
    prevRef.current = { page }
    if (prev.page === 'landing' && page === 'landing') return
    window.history.pushState({ page }, '', '')
  }, [page])


  useEffect(() => {
    const timer = setInterval(() => {
      setGangIndex((prev) => (prev + 1) % gangImages.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  const STORAGE_KEY = CART_STORAGE_KEY
  const EXPIRY_HOURS = CART_EXPIRY_HOURS

  // Load cart from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          setCartItems(parsed.items || [])
          setUserEmail(parsed.email || null)
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
    } catch {}
  }, [])

  // Persist cart to localStorage whenever it changes
  useEffect(() => {
    if (cartItems.length > 0 || userEmail) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        items: cartItems,
        email: userEmail,
        expiresAt: Date.now() + EXPIRY_HOURS * 60 * 60 * 1000,
      }))
    } else {
      localStorage.removeItem(STORAGE_KEY)
    }
  }, [cartItems, userEmail])

  // Keep cartCount in sync
  useEffect(() => {
    setCartCount(cartItems.reduce((sum, i) => sum + i.qty, 0))
  }, [cartItems])

  const requestAdd = (name: string, image?: string, price?: number) => {
    setPendingAdd(name)
    setPendingImage(image || '')
    setPendingPrice(price ?? 85)
    setAddSize('M')
    setAddQty(1)
    setAddDelivery('delivery')
  }

  const confirmAdd = () => {
    if (!pendingAdd) return
    setCartItems((prev) => [...prev, { name: pendingAdd, size: addSize, qty: addQty, delivery: addDelivery, image: pendingImage, price: pendingPrice }])
    setAddSuccess(true)
    window.setTimeout(() => {
      setAddSuccess(false)
      setPendingAdd(null)
    }, 1200)
  }

  const add = requestAdd
  void add
  return (
    <div className="world" data-page={page}>
      <div className="store">
        {page === 'landing' ? (
          <LandingPage
            menuOpen={menuOpen} setMenuOpen={setMenuOpen}
            cartCount={cartCount} setCartCount={setCartCount}
            filterOpen={filterOpen} setFilterOpen={setFilterOpen}
            tone={tone} setTone={setTone}
            toast={toast} setToast={setToast}
            setPage={setPage}
            onSelectProduct={openProduct}
            arrivals={arrivals}
            onProfileClick={() => setAuthOpen(true)}
            onWishlistClick={() => {
              if (!account) { setAuthOpen(true); flash('SIGN IN TO KEEP YOUR WISHLIST') }
              else flash(`WISHLIST: ${wishlist.length} KIT${wishlist.length === 1 ? '' : 'S'} SAVED`)
            }}
          />
        ) : page === 'cart' ? (
          <CartPage
            cartItems={cartItems}
            setCartItems={setCartItems}
            cartCount={cartCount}
            userEmail={userEmail}
            setUserEmail={setUserEmail}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            onNavigate={(p) => setPage(p)}
            onBack={() => setPage('landing')}
            setToast={setToast}
          />
        ) : page === 'jerseys' ? (
          <Jerseys
            cartCount={cartCount}
            onNavigate={(label) => {
              if (label === 'New-Arrival') setPage('landing')
              if (label === 'All-Kits') setPage('jerseys')
              if (label === 'Best-Sellers') setPage('bestsellers')
              if (label === 'Retro') setPage('retro')
              setMenuOpen(false)
            }}
            onCartClick={() => setMenuOpen(false)}
            onProfileClick={() => setMenuOpen(false)}
            onSelectKit={(kit) => openProduct(kit)}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          />
        ) : page === 'bestsellers' ? (
          <BestSellers
            cartCount={cartCount}
            onNavigate={(label) => {
              if (label === 'New-Arrival') setPage('landing')
              if (label === 'All-Kits') setPage('jerseys')
              if (label === 'Best-Sellers') setPage('bestsellers')
              if (label === 'Retro') setPage('retro')
              setMenuOpen(false)
            }}
            onCartClick={() => setMenuOpen(false)}
            onProfileClick={() => setMenuOpen(false)}
            onSelectKit={(kit) => openProduct(kit)}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          />
        ) : page === 'product' ? (
          <ProductPage
            product={selectedProduct}
            catalog={catalog}
            cartCount={cartCount}
            onNavigate={(label) => {
              if (label === 'New-Arrival') setPage('landing')
              if (label === 'All-Kits') setPage('jerseys')
              if (label === 'Best-Sellers') setPage('bestsellers')
              if (label === 'Retro') setPage('retro')
              setMenuOpen(false)
            }}
            onSelectProduct={openProduct}
            onAddToCart={addToCartFromDetail}
            wishlistIds={wishlist}
            onToggleWishlist={toggleWishlist}
            onOpenAuth={() => setAuthOpen(true)}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen} />
        ) : page === 'checkout' ? (
          <CheckoutPage
            cartItems={cartItems}
            cartCount={cartCount}
            account={account}
            onPlaced={() => { setCartItems([]); flash('ORDER PLACED — CART CLEARED') }}
            onNavigate={(label) => {
              if (label === 'New-Arrival') setPage('landing')
              if (label === 'All-Kits') setPage('jerseys')
              if (label === 'Best-Sellers') setPage('bestsellers')
              if (label === 'Retro') setPage('retro')
              if (label === 'cart') setPage('cart')
              setMenuOpen(false)
            }}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen} />
        ) : (
          <Retro
            cartCount={cartCount}
            onNavigate={(label) => {
              if (label === 'New-Arrival') setPage('landing')
              if (label === 'All-Kits') setPage('jerseys')
              if (label === 'Best-Sellers') setPage('bestsellers')
              if (label === 'Retro') setPage('retro')
              setMenuOpen(false)
            }}
            onCartClick={() => setMenuOpen(false)}
            onProfileClick={() => setMenuOpen(false)}
            onSelectKit={(kit) => openProduct(kit)}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          />
        )}
      </div>
      {pendingAdd && (
        <div className="checkout-overlay" onClick={() => setPendingAdd(null)}>
          <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
            {addSuccess ? (
              <div className="qa-success">
                <div className="qa-success-check">✓</div>
                <h2 className="checkout-title" style={{ textAlign: 'center', marginBottom: 8 }}>Added!</h2>
                <p className="checkout-note" style={{ textAlign: 'center', opacity: 1, fontSize: 12 }}>
                  {pendingAdd} · {addSize} · ×{addQty} · {addDelivery === 'delivery' ? 'Delivery' : 'Pick up'}
                </p>
              </div>
            ) : (
              <>
                <button className="checkout-close" onClick={() => setPendingAdd(null)}>×</button>
                <h2 className="checkout-title">Quick Add</h2>
                <p className="checkout-note" style={{ marginBottom: 16, opacity: 1, fontSize: 12 }}>{pendingAdd}</p>

                {pendingImage && (
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                    <img src={pendingImage} alt={pendingAdd ?? ''} style={{ width: 120, height: 120, objectFit: 'contain', borderRadius: 8, background: '#111' }} />
                  </div>
                )}

                <div className="qa-field">
                  <label className="qa-label">Size</label>
                  <div className="qa-options">
                    {['XS','S','M','L','XL','XXL'].map((s) => (
                      <button key={s} className={`qa-opt ${addSize === s ? 'qa-opt-active' : ''}`} onClick={() => setAddSize(s)}>{s}</button>
                    ))}
                  </div>
                </div>

                <div className="qa-field">
                  <label className="qa-label">Quantity</label>
                  <div className="qa-qty">
                    <button className="qa-qty-btn" onClick={() => setAddQty((q) => Math.max(1, q - 1))}>−</button>
                    <span className="qa-qty-val">{addQty}</span>
                    <button className="qa-qty-btn" onClick={() => setAddQty((q) => q + 1)}>+</button>
                  </div>
                </div>

                <div className="qa-field">
                  <label className="qa-label">Fulfillment</label>
                  <div className="qa-options">
                    <button className={`qa-opt ${addDelivery === 'delivery' ? 'qa-opt-active' : ''}`} onClick={() => setAddDelivery('delivery')}>Delivery</button>
                    <button className={`qa-opt ${addDelivery === 'pickup' ? 'qa-opt-active' : ''}`} onClick={() => setAddDelivery('pickup')}>Pick up at shop</button>
                  </div>
                </div>

                <button className="checkout-confirm" onClick={confirmAdd}>
                  ADD TO CART — ${(pendingPrice * addQty).toFixed(2)}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {toast && <div className="toast"><i>+</i>{toast}</div>}
      <a className="wa-fab" href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" aria-label="Chat with us on WhatsApp">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
        <span>LET'S CHAT</span>
      </a>
      {cartCount > 0 && page !== 'cart' && page !== 'checkout' && (
        <button className="checkout-fab" onClick={() => { setPage('checkout'); window.scrollTo({ top: 0 }) }}>
          <span className="checkout-fab-icon">🛒</span>
          <span>PROCEED TO CHECKOUT</span>
          <span className="checkout-fab-count">{cartCount}</span>
        </button>
      )}

      {authOpen && (
        <div className="checkout-overlay" onClick={() => setAuthOpen(false)}>
          <div className="checkout-modal am-modal" onClick={(e) => e.stopPropagation()}>
            <button className="checkout-close" onClick={() => setAuthOpen(false)}>×</button>
            {account ? (
              <div className="am-signed">
                <div className="am-avatar"><Icon name="profile" size={22} /></div>
                <h2 className="checkout-title am-title">SIGNED IN</h2>
                <p className="am-email">{account}</p>
                <p className="am-wish">[ {wishlist.length} KIT{wishlist.length === 1 ? '' : 'S'} ON YOUR WISHLIST ]</p>
                <button className="checkout-confirm am-submit" onClick={signOut}>SIGN OUT &amp; CLEAR WISHLIST</button>
              </div>
            ) : (
              <>
                <h2 className="checkout-title am-title">{authMode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}</h2>
                <p className="am-note">WISHLISTS LIVE INSIDE YOUR ACCOUNT — THEY STAY UNTIL YOU SIGN OUT</p>
                <div className="qa-field">
                  <label className="qa-label">EMAIL</label>
                  <input className="qa-input" type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="you@email.com" />
                </div>
                <div className="qa-field">
                  <label className="qa-label">PASSWORD</label>
                  <input className="qa-input" type="password" value={authPass} onChange={(e) => setAuthPass(e.target.value)} placeholder="min 4 characters" onKeyDown={(e) => { if (e.key === 'Enter') submitAuth() }} />
                </div>
                <button className="checkout-confirm am-submit" onClick={submitAuth}>{authMode === 'signin' ? 'SIGN IN' : 'CREATE ACCOUNT'}</button>
                <button className="checkout-continue" onClick={() => setAuthMode((m) => (m === 'signin' ? 'register' : 'signin'))}>
                  {authMode === 'signin' ? 'NEW HERE? CREATE AN ACCOUNT' : 'ALREADY HAVE AN ACCOUNT? SIGN IN'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {checkoutOpen && (
        <div className="checkout-overlay" onClick={() => setCheckoutOpen(false)}>
          <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
            {orderSuccess ? (
              <div className="qa-success">
                <div className="qa-success-check" style={{ background: '#4ade80', color: '#000' }}>✓</div>
                <h2 className="checkout-title" style={{ textAlign: 'center', marginBottom: 8 }}>Order Placed!</h2>
                <p className="checkout-note" style={{ textAlign: 'center', opacity: 1, fontSize: 12 }}>
                  Thank you{userEmail ? `, ${userEmail}` : ''}. Your cart has been cleared.
                </p>
              </div>
            ) : (
              <>
                <button className="checkout-close" onClick={() => setCheckoutOpen(false)}>×</button>
                <h2 className="checkout-title">Your Cart</h2>
                {cartItems.length === 0 ? (
                  <div className="qa-success" style={{ padding: '20px 0' }}>
                    <div style={{ fontSize: 48, opacity: .3, marginBottom: 12 }}>🛒</div>
                    <p className="checkout-note" style={{ opacity: .6, fontSize: 12 }}>Your cart is empty. Add some kits!</p>
                  </div>
                ) : (
                  <>
                    <div className="checkout-items">
                      {cartItems.map((item, i) => (
                        <div className="checkout-item" key={i}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div>
                              <div className="checkout-item-name">{item.name}</div>
                              <div className="checkout-item-meta">Size {item.size} · Qty {item.qty} · {item.delivery === 'delivery' ? 'Delivery' : 'Pick up'}</div>
                            </div>
                            <button className="checkout-item-remove" onClick={() => setCartItems((prev) => prev.filter((_, idx) => idx !== i))}>×</button>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="checkout-summary">
                      <div className="checkout-row">
                        <span>Items</span>
                        <b>{cartItems.reduce((s, i) => s + i.qty, 0)}</b>
                      </div>
                      <div className="checkout-row checkout-total">
                        <span>Total</span>
                        <b>${cartItems.reduce((s, i) => s + i.qty * (i.price ?? 85), 0).toFixed(2)}</b>
                      </div>
                    </div>
                    {!userEmail && (
                      <div className="qa-field" style={{ marginBottom: 16 }}>
                        <label className="qa-label">Email (to save your cart for 72h)</label>
                        <input
                          type="email"
                          className="qa-input"
                          placeholder="you@email.com"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              const v = (e.target as HTMLInputElement).value.trim()
                              if (v) setUserEmail(v)
                            }
                          }}
                        />
                        <p className="checkout-note" style={{ marginTop: 6, opacity: .7 }}>Create an account to keep your cart beyond 72 hours.</p>
                      </div>
                    )}
                    {userEmail && (
                      <p className="checkout-note" style={{ opacity: .7, marginBottom: 12 }}>Saved to {userEmail} · cart expires in 72h</p>
                    )}
                    <button className="checkout-confirm" onClick={() => {
                      if (!userEmail) {
                        const input = document.querySelector('.qa-input') as HTMLInputElement | null
                        const v = input?.value?.trim()
                        if (v) setUserEmail(v)
                      }
                      setOrderSuccess(true)
                      window.setTimeout(() => {
                        setCartItems([])
                        setOrderSuccess(false)
                        setCheckoutOpen(false)
                      }, 1800)
                    }}>
                      COMPLETE ORDER
                    </button>
                    <button className="checkout-continue" onClick={() => setCheckoutOpen(false)}>
                      Continue Shopping
                    </button>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
