import { useState, useEffect } from 'react'
import Jerseys from './Jerseys'
import Retro from './Retro'
import ArchivePage from './ArchivePage'
import LeagueClubs from './LeagueClubs'
import TeamPage from './TeamPage'
import CartPage from './CartPage'
import { leagues } from './leagues'
import type { League } from './leagues'
import type { Team } from './teams'

function Icon({ name, size = 17 }: { name: 'arrow' | 'bag' | 'menu' | 'profile' | 'search' | 'x'; size?: number }) {
  const paths = {
    arrow: <><path d="M5 19 19 5" /><path d="M10 5h9v9" /></>,
    bag: <><path d="M5 8h14l-1 12H6L5 8Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    menu: <><path d="M4 7h16" /><path d="M4 17h16" /></>,
    profile: <><circle cx="12" cy="8" r="3" /><path d="M5 21v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
    x: <><path d="m6 6 12 12" /><path d="M18 6 6 18" /></>,
  }
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>
}

const gangImages = ['gang1.jpg', 'gang2.jpg', 'gang4.jpg', 'gang5.jpg', 'gang6.jpg', 'gang7.jpg', 'gang8.jpg'] as const


function LeagueCard({ league, index, onOpen }: { league: League; index: number; onOpen: (id: string) => void }) {
  return (
    <article className="product">
      <button className="product-image" onClick={() => onOpen(league.id)} aria-label={`View ${league.name} clubs`}>
        <img src={league.image} alt={league.name} />
        <span>{league.id === 'country-kits' ? 'VIEW TEAM →' : 'VIEW CLUBS →'}</span>
      </button>
      <div className="product-copy">
        <strong>{league.name}</strong>
        <small>{league.country}</small>
        <div><i>● IN STOCK</i><b>{league.price}</b></div>
      </div>
      <span className="item-no">{String(index + 1).padStart(2, '0')}</span>
    </article>
  )
}

function LandingPage({
  menuOpen, setMenuOpen, cartCount, setCartCount,
  filterOpen, setFilterOpen, tone, setTone,
  toast, setToast, openLeague, setPage,
}: {
  menuOpen: boolean; setMenuOpen: (v: boolean) => void
  cartCount: number; setCartCount: (v: number) => void
  filterOpen: boolean; setFilterOpen: (v: boolean) => void
  tone: string; setTone: (v: string) => void
  toast: string; setToast: (v: string) => void
  openLeague: (id: string) => void
  setPage: (v: string) => void
}) {
  const [featureIdx, setFeatureIdx] = useState(0);
  const [featureFade, setFeatureFade] = useState(false);

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
        <a className="logo" href="#top">MJ<span>//</span></a>
        <nav>
          <a onClick={() => setPage('landing')}>[ COLLECTION ]</a>
          <a onClick={() => setPage('jerseys')}>[ JERSEYS ]</a>
          <a onClick={() => setPage('retro')}>[ RETRO ]</a>
          <a onClick={() => setPage('archive')}>[ ARCHIVE ]</a>
        </nav>
        <div className="tools">
          <button className="profile-trigger" aria-label="Profile"><Icon name="profile" size={15} /></button>
          <button className="cart-trigger" aria-label={`Bag with ${cartCount} items`}><Icon name="bag" size={15} /><b key={cartCount}>{cartCount}</b></button>
          <button className="menu-trigger" onClick={() => setMenuOpen(!menuOpen)} aria-label="Open navigation"><Icon name={menuOpen ? 'x' : 'menu'} /></button>
        </div>
      </header>

      {menuOpen && <nav className="mobile-nav">
  <a onClick={() => { setPage('landing'); setMenuOpen(false); }} style={{ cursor: 'pointer' }}>[ Collection ]</a>
  <a onClick={() => { setPage('jerseys'); setMenuOpen(false); }} style={{ cursor: 'pointer' }}>[ Jerseys ]</a>
  <a onClick={() => { setPage('retro'); setMenuOpen(false); }} style={{ cursor: 'pointer' }}>[ Retro ]</a>
  <a onClick={() => { setPage('archive'); setMenuOpen(false); }} style={{ cursor: 'pointer' }}>[ Archive ]</a>
  <a onClick={() => setMenuOpen(false)} style={{ cursor: 'pointer' }}>[ PROFILE ]</a>
</nav>}

      <main id="top">
        <section className="campaign" id="drop">
            <img className="campaign-bg" src="https://images.unsplash.com/photo-1606484527234-71e5b89ffcc6?auto=format&fit=crop&w=1600&q=90" alt="" />
            <div className="blue-wash" />
            <div className="season-code">[ FOOTBALL CULTURE 25.1 ] [ SERIES 01 ]</div>
            <div className="campaign-title">
              <p>COLLECTION</p>
              <h1>JERSEY<br />HUB</h1>
              <div className="specs">
                <span>SIZE<br /><b>S—XXL</b></span>
                <span>FIT<br /><b>RELAXED</b></span>
                <span>Now<br /><b>Eza</b></span>
              </div>
              <div className="buy-lockup">
                <button onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })} aria-label="Shop collection"><Icon name="arrow" size={22} /></button>
                <span>ADD TO KIT<br /><strong>FROM $12.00</strong></span>
              </div>
            </div>
            <img className="hero-player" src="/hero1.png" alt="Hero player" />
            <div className="preview-stack">
              {[gangImages[0], gangImages[1]].map((img, i) => (
                <figure key={img}>
                  <img src={`/${img}`} alt={`Gang ${img}`} />
                  <figcaption>{String(i + 1).padStart(2, '0')}</figcaption>
                </figure>
              ))}
            </div>
            <div className="slide-count"><b>01</b><i /><span>07</span></div>
            <div className="socials"><span>IG</span><span>TK</span><span>X</span></div>
          </section>

          <section className="catalog" id="shop">
            <div className="catalog-head">
              <div><span>[ 26/27 COLLECTION ]</span><h2>NEW COLLECTION</h2></div>
              <div className="catalog-data">[ ALL LEAGUES ]<br />[ AUTHENTIC + RETRO ]<br />[ WORLDWIDE DELIVERY ]</div>
              <button style={{ cursor: 'default' }}>CLUBS +</button>
            </div>
            <div className="grid-container">
              <div className="feature-grid">
                <article className="feature-card">
                  <img
  src={`/images/campaignbg/feature${featureIdx + 1}.jpg`}
  alt="Footballer juggling a ball"
  style={{ opacity: featureFade ? 0 : 1, transition: 'opacity 600ms ease-in-out' }}
/>
                  <div><span>FIELD TESTED</span><strong>MJ<br />JERSEYS<sup>™</sup></strong><small>[ 001 / 025 ]</small></div>
                </article>
                {leagues.slice(0, 3).map((league, index) => <LeagueCard league={league} index={index} onOpen={openLeague} key={league.id} />)}
              </div>
              <div className="product-grid">
                {leagues.slice(3).map((league, index) => <LeagueCard league={league} index={index + 3} onOpen={openLeague} key={league.id} />)}
              </div>
            </div>
          </section>

          <section className="manifesto" id="story">
            <img src="https://images.unsplash.com/photo-1549494592-af5ed0eadf2a?auto=format&fit=crop&w=1600&q=92" alt="A steep snow-covered mountain" />
            <img className="manifesto-player" src="/travis-scott.png" alt="" />
            <div className="manifesto-wash" />
            <div className="tag-wall" aria-hidden="true">FULLTIME</div>
            <p className="manifesto-note">GOOD KITS WERE NEVER<br />MADE TO STAY FOLDED.<br />WE SOURCE SHIRTS<br />WITH A PAST.</p>
            <h2>BUILT FOR THE TERRACE.<br />MADE FOR THE CITY.<br />FORGED TO LAST.</h2>
            <div className="peak-note">FOR THOSE WHO<br />SHOW UP. HOME<br />OR AWAY.</div>
            <div className="barcode" aria-label="Full Time Supply Company">|||| || ||| ||||| ||</div>
          </section>
        </main>

        <footer id="archive">
          <div className="logo">MJ<span>//#</span></div>
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
  const [leagueId, setLeagueId] = useState<string | null>(null)
  const [teamId, setTeamId] = useState<string | null>(null)
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

  const openLeague = (id: string) => {
    setLeagueId(id)
    setPage('league')
    window.scrollTo({ top: 0 })
  }

  const openTeam = (id: string) => {
    setTeamId(id)
    setPage('team')
    window.scrollTo({ top: 0 })
  }


  useEffect(() => {
    const timer = setInterval(() => {
      setGangIndex((prev) => (prev + 1) % gangImages.length)
    }, 3000)
    return () => clearInterval(timer)
  }, [])

  const STORAGE_KEY = 'mj_cart'
  const EXPIRY_HOURS = 72

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

  return (
    <div className="world" data-page={page}>
      <div className="world-mark" aria-hidden="true">FT//25</div>
      <div className="store" style={{ background: page === 'league' || page === 'team' ? 'transparent' : undefined }}>
        {page === 'landing' ? (
          <LandingPage
            menuOpen={menuOpen} setMenuOpen={setMenuOpen}
            cartCount={cartCount} setCartCount={setCartCount}
            filterOpen={filterOpen} setFilterOpen={setFilterOpen}
            tone={tone} setTone={setTone}
            toast={toast} setToast={setToast}
            openLeague={openLeague} setPage={setPage}
          />
        ) : page === 'league' ? (
          <LeagueClubs
            league={leagues.find((l) => l.id === leagueId) ?? leagues[0]}
            cartCount={cartCount}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            onNavigate={(p) => setPage(p)}
            onBack={() => setPage('landing')}
            onSelect={openTeam}
          />
        ) : page === 'team' ? (
          <TeamPage
            teamId={teamId ?? ''}
            cartCount={cartCount}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            onNavigate={(p) => setPage(p)}
            onBack={() => setPage('league')}
            onAdd={add}
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
              if (label === 'Collection') setPage('landing')
              if (label === 'Archive') setPage('archive')
              if (label === 'Retro') setPage('retro')
              setMenuOpen(false)
            }}
            onCartClick={() => setMenuOpen(false)}
            onProfileClick={() => setMenuOpen(false)}
            onAdd={add}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
          />
        ) : page === 'archive' ? (
          <ArchivePage
            cartCount={cartCount}
            menuOpen={menuOpen}
            setMenuOpen={setMenuOpen}
            onNavigate={(label) => {
              if (label === 'Collection') setPage('landing')
              if (label === 'Jerseys') setPage('jerseys')
              if (label === 'Retro') setPage('retro')
              if (label === 'Archive') setPage('archive')
              setMenuOpen(false)
            }}
            onSelect={openTeam}
            onAdd={add}
            onNotify={(email, entry) => { console.log('notify', email, entry.id) }}
            onCartClick={() => setMenuOpen(false)}
            onProfileClick={() => setMenuOpen(false)}
          />
        ) : (
          <Retro
            cartCount={cartCount}
            onNavigate={(label) => {
              if (label === 'Collection') setPage('landing')
              if (label === 'Archive') setPage('archive')
              if (label === 'Jerseys') setPage('jerseys')
              setMenuOpen(false)
            }}
            onCartClick={() => setMenuOpen(false)}
            onProfileClick={() => setMenuOpen(false)}
            onAdd={add}
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
                  ADD TO CART — £{85 * addQty}.00
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {toast && <div className="toast"><i>+</i>{toast}</div>}
      {cartCount > 0 && page !== 'cart' && (
        <button className="checkout-fab" onClick={() => { setPage('cart'); window.scrollTo({ top: 0 }) }}>
          <span className="checkout-fab-icon">🛒</span>
          <span>PROCEED TO CHECKOUT</span>
          <span className="checkout-fab-count">{cartCount}</span>
        </button>
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
                        <b>£{cartItems.reduce((s, i) => s + i.qty, 0) * 85}.00</b>
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
