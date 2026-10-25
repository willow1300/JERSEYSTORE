/**
 * landingMotion.ts  (v2: smoother + more cinematic)
 * Landing page ONLY. No JSX/state changes needed: App.tsx keeps the same single line:
 *     useLandingMotion(page === 'landing')
 *
 * Needs:  npm i gsap lenis
 * Pair with the updated landingMotion.css (new .lm-* classes).
 */
import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import './landingMotion.css'

gsap.registerPlugin(ScrollTrigger)
ScrollTrigger.config({ ignoreMobileResize: true })

/* ───────────── Easy-to-edit settings ───────────── */
const SEASON_MESSAGES = [
  '[ FOOTBALL CULTURE 25.1 ] [ SERIES 01 ]',
  '[ 26/27 COLLECTION ] [ NEW DROP ]',
  '[ AUTHENTIC + RETRO ] [ ALL LEAGUES ]',
  '[ WORLDWIDE DELIVERY ] [ PAY WITH M-PESA ]',
]
const PRELOADER_ENABLED = true       // logo + counter + curtain on first visit
const PRELOADER_MIN_SECONDS = 1.8    // shortest time the preloader stays up
const CURSOR_ENABLED = true          // lens cursor on mouse devices
const VELOCITY_SKEW_ENABLED = true   // cards lean slightly with scroll speed
const CLEAR = 'transform,opacity,clipPath,filter'

// Preloader plays once per page load, not every time you come back to the landing page.
let preloaderPlayed = false

/* ───────────── Text scramble helpers ───────────── */
const activeScrambles = new Map<Text, gsap.core.Tween>()

function cancelScramble(node: Text) {
  const tween = activeScrambles.get(node)
  if (tween) {
    tween.kill()
    activeScrambles.delete(node)
  }
}

function getTextNode(el: HTMLElement | null, label: string): Text | null {
  if (!el || el.firstChild?.nodeType !== Node.TEXT_NODE) return null
  let count = 0
  for (const n of Array.from(el.childNodes)) if (n.nodeType === Node.TEXT_NODE) count++
  if (count > 1) {
    console.warn('[landingMotion] ' + label + ' has multiple text nodes; skipping scramble', el)
    return null
  }
  return el.firstChild as Text
}

function scrambleTo(node: Text, target: string, duration = 0.9, keep = /[\s\[\]\/\-—.$,]/): () => void {
  cancelScramble(node)
  const proxy = { p: 0 }
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const tween = gsap.to(proxy, {
    p: 1,
    duration,
    ease: 'none',
    onUpdate: () => {
      const revealed = Math.floor(proxy.p * target.length)
      let out = ''
      for (let i = 0; i < target.length; i++) {
        const ch = target[i]
        out += keep.test(ch) || i < revealed ? ch : alphabet[Math.floor(Math.random() * alphabet.length)]
      }
      node.nodeValue = out
    },
    onComplete: () => {
      node.nodeValue = target
      activeScrambles.delete(node)
    },
  })
  activeScrambles.set(node, tween)
  return () => {
    if (activeScrambles.get(node) === tween) {
      tween.kill()
      activeScrambles.delete(node)
    }
  }
}

/* ───────────── The hook ───────────── */
export function useLandingMotion(active: boolean) {
  useLayoutEffect(() => {
    if (!active) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const store = document.querySelector('.store') as HTMLElement | null
    if (!store) return

    let cancelled = false
    const scrollTriggers: ScrollTrigger[] = []
    const cleanups: Array<() => void> = []
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const showPreloader = PRELOADER_ENABLED && !preloaderPlayed

    /* ── 1. Smooth scrolling (Lenis) ── */
    const lenis = new Lenis({
      lerp: 0.085,
      wheelMultiplier: 0.9,
      anchors: true,
      prevent: (node: HTMLElement) => !!node.closest('.checkout-overlay, .mobile-nav'),
    })
    lenis.on('scroll', ScrollTrigger.update)
    const onTick = (time: number) => { lenis.raf(time * 1000) }
    gsap.ticker.add(onTick)
    gsap.ticker.lagSmoothing(0)

    if (showPreloader) {
      window.scrollTo(0, 0)
      lenis.stop()
    }

    /* ── 2. Text nodes we scramble (edited in place so React never notices) ── */
    const seasonNode = getTextNode(store.querySelector('.season-code') as HTMLElement | null, '.season-code')
    const originalSeasonText = seasonNode?.nodeValue ?? ''

    const priceNode = getTextNode(store.querySelector('.buy-lockup strong') as HTMLElement | null, '.buy-lockup strong')
    const priceOriginal = priceNode?.nodeValue ?? ''

    const catSpanNode = getTextNode(store.querySelector('.catalog-head span') as HTMLElement | null, '.catalog-head span')
    const catSpanOriginal = catSpanNode?.nodeValue ?? ''

    const navLinks = Array.from(store.querySelectorAll('.topbar nav a')) as HTMLElement[]
    const navTextNodes: Text[] = []
    const navOriginals: string[] = []
    const navOwners: HTMLElement[] = []
    navLinks.forEach((link) => {
      const node = getTextNode(link, '.topbar nav a')
      if (node) {
        navTextNodes.push(node)
        navOriginals.push(node.nodeValue ?? '')
        navOwners.push(link)
      }
    })
    const buyLockup = store.querySelector('.buy-lockup') as HTMLElement | null

    /* ── 3. Rotating campaign line ── */
    let introDone = false
    let seasonIndex = 0
    let seasonTimer: number | null = null
    let campaignInView = true

    const stopSeasonRotation = () => {
      if (seasonTimer !== null) { window.clearInterval(seasonTimer); seasonTimer = null }
    }
    const startSeasonRotation = () => {
      if (seasonTimer !== null || !seasonNode || !introDone || !campaignInView || document.hidden) return
      seasonTimer = window.setInterval(() => {
        if (!campaignInView || document.hidden) { stopSeasonRotation(); return }
        seasonIndex = (seasonIndex + 1) % SEASON_MESSAGES.length
        scrambleTo(seasonNode, SEASON_MESSAGES[seasonIndex])
      }, 4500)
    }

    const campaignEl = store.querySelector('.campaign') as HTMLElement | null
    const campaignObserver = new IntersectionObserver((entries) => {
      campaignInView = entries[0]?.isIntersecting ?? true
      if (campaignInView && introDone && !document.hidden) startSeasonRotation()
      else stopSeasonRotation()
    }, { threshold: 0.1 })
    if (campaignEl) campaignObserver.observe(campaignEl)

    const onVisibility = () => {
      if (!document.hidden && introDone && campaignInView) startSeasonRotation()
      else stopSeasonRotation()
    }
    document.addEventListener('visibilitychange', onVisibility)

    /* ── 4. Hero intro (built paused; the preloader releases it) ── */
    const heroTl = gsap.timeline({ paused: true, defaults: { ease: 'expo.out' } })

    if (seasonNode) heroTl.add(() => { scrambleTo(seasonNode, originalSeasonText, 1.1) }, 0)

    const q = (s: string) => store.querySelectorAll(s)
    const slideCount = store.querySelector('.slide-count') as HTMLElement | null
    const socials = store.querySelector('.socials') as HTMLElement | null

    heroTl.fromTo(q('.campaign-title > p'), { y: 28, opacity: 0, clipPath: 'inset(0 100% 0 0)' }, { y: 0, opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.9, clearProps: CLEAR }, 0.1)
    heroTl.fromTo(q('.campaign-title h1'), { y: 60, opacity: 0, clipPath: 'inset(100% 0 0 0)', filter: 'blur(10px)' }, { y: 0, opacity: 1, clipPath: 'inset(0% 0 0 0)', filter: 'blur(0px)', duration: 1.3, clearProps: CLEAR }, 0.2)
    heroTl.fromTo(q('.specs span'), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, stagger: 0.1, clearProps: CLEAR }, 0.6)
    heroTl.fromTo(q('.buy-lockup'), { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.8, clearProps: CLEAR }, 0.75)
    heroTl.fromTo(q('.hero-player'), { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 1.4, clearProps: 'clipPath' }, 0.2)
    heroTl.fromTo(q('.preview-stack figure'), { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, stagger: 0.14, clearProps: CLEAR }, 0.5)
    if (slideCount) heroTl.fromTo(slideCount, { opacity: 0 }, { opacity: 1, duration: 0.8, clearProps: CLEAR }, 1)
    if (socials) heroTl.fromTo(socials, { opacity: 0 }, { opacity: 1, duration: 0.8, clearProps: CLEAR }, 1)

    heroTl.eventCallback('onComplete', () => {
      if (priceNode) scrambleTo(priceNode, priceOriginal)
      introDone = true
      if (campaignInView && !document.hidden) startSeasonRotation()
    })

    /* ── 5. Preloader: logo + real image-load counter + curtain wipe ── */
    let preloaderEl: HTMLElement | null = null
    const preCtx = gsap.context(() => {})
    let failSafe: number | undefined

    const finishPreloader = () => {
      preloaderPlayed = true
      preloaderEl?.remove()
      preloaderEl = null
      lenis.start()
      ScrollTrigger.refresh()
    }

    if (showPreloader) {
      const pre = document.createElement('div')
      pre.className = 'lm-preloader'
      pre.innerHTML =
        '<div class="lm-preloader-logo">MJ<span>//</span></div>' +
        '<div class="lm-preloader-count">[ <b>000</b> ]</div>' +
        '<div class="lm-preloader-bar"></div>'
      document.body.appendChild(pre)
      preloaderEl = pre

      const logo = pre.querySelector('.lm-preloader-logo') as HTMLElement
      const count = pre.querySelector('.lm-preloader-count') as HTMLElement
      const countNum = pre.querySelector('b') as HTMLElement
      const bar = pre.querySelector('.lm-preloader-bar') as HTMLElement
      const counter = { v: 0 }
      const render = () => {
        countNum.textContent = String(Math.round(counter.v)).padStart(3, '0')
        bar.style.transform = 'scaleX(' + counter.v / 100 + ')'
      }

      preCtx.add(() => {
        gsap.fromTo(logo, { y: 40, opacity: 0, filter: 'blur(12px)' }, { y: 0, opacity: 1, filter: 'blur(0px)', duration: 1, ease: 'expo.out' })
      })

      // wait for the hero images (max 4s) AND the minimum time
      const heroImgs = Array.from(store.querySelectorAll('.campaign img')) as HTMLImageElement[]
      const imagesReady = Promise.race([
        Promise.all(heroImgs.map((img) =>
          img.complete
            ? Promise.resolve()
            : new Promise<void>((res) => {
                img.addEventListener('load', () => res(), { once: true })
                img.addEventListener('error', () => res(), { once: true })
              })
        )),
        new Promise<void>((res) => window.setTimeout(res, 4000)),
      ])
      const minTime = new Promise<void>((res) => {
        preCtx.add(() => {
          gsap.to(counter, { v: 90, duration: PRELOADER_MIN_SECONDS, ease: 'power2.inOut', onUpdate: render, onComplete: () => res() })
        })
      })

      Promise.all([imagesReady, minTime]).then(() => {
        if (cancelled) return
        preCtx.add(() => {
          gsap.timeline({ onComplete: finishPreloader })
            .to(counter, { v: 100, duration: 0.35, ease: 'power1.out', onUpdate: render })
            .to([logo, count], { opacity: 0, y: -24, duration: 0.45, ease: 'power2.in' }, '+=0.15')
            .to(pre, { clipPath: 'inset(0 0 100% 0)', duration: 1.1, ease: 'expo.inOut' }, '>-0.1')
            .add(() => { heroTl.play() }, '>-0.6')
        })
      })

      // safety net: never trap a visitor behind the overlay
      failSafe = window.setTimeout(() => {
        if (preloaderEl) { finishPreloader(); heroTl.play() }
      }, 9000)
    } else {
      heroTl.delay(0.1).play()
    }

    /* ── 6. Scroll parallax (scrub: 1 = buttery lag instead of instant) ── */
    const parallaxTl = gsap.timeline({
      scrollTrigger: campaignEl
        ? { trigger: campaignEl, start: 'top top', end: 'bottom top', scrub: 1 }
        : undefined,
    })
    if (campaignEl) {
      parallaxTl.to(q('.campaign-title'), { yPercent: -40, opacity: 0, ease: 'none' }, 0)
      parallaxTl.to(q('.hero-player'), { yPercent: 25, ease: 'none' }, 0)
      parallaxTl.to(q('.preview-stack'), { yPercent: -25, ease: 'none' }, 0)
      parallaxTl.to(q('.campaign-bg'), { scale: 1.14, ease: 'none' }, 0)
    }

    /* ── 7. Catalog ── */
    const catalogHead = store.querySelector('.catalog-head') as HTMLElement | null
    if (catalogHead) {
      const tween = gsap.fromTo(catalogHead, { y: 40, opacity: 0 }, {
        y: 0, opacity: 1, duration: 1, ease: 'expo.out', clearProps: CLEAR,
        scrollTrigger: { trigger: catalogHead, start: 'top 85%' },
      })
      if (tween.scrollTrigger) scrollTriggers.push(tween.scrollTrigger)

      if (catSpanNode) {
        scrollTriggers.push(ScrollTrigger.create({
          trigger: catalogHead,
          start: 'top 85%',
          once: true,
          onEnter: () => { scrambleTo(catSpanNode, catSpanOriginal, 0.8) },
        }))
      }
    }

    const batchTargets = q('.catalog .feature-card, .catalog .product')
    if (batchTargets.length) {
      gsap.set(batchTargets, { opacity: 0, y: 60, scale: 0.96 })
      scrollTriggers.push(...ScrollTrigger.batch(batchTargets, {
        start: 'top 90%',
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, { y: 0, opacity: 1, scale: 1, duration: 1, stagger: 0.09, ease: 'expo.out', clearProps: 'transform,opacity', overwrite: true })
        },
      }))
    }

    /* ── 8. Scroll-speed lean on the catalog grid (mouse devices) ── */
    if (VELOCITY_SKEW_ENABLED && fine) {
      const grid = store.querySelector('.catalog .grid-container') as HTMLElement | null
      if (grid) {
        const skewTo = gsap.quickTo(grid, 'skewY', { duration: 0.7, ease: 'power3' })
        let settle: number | undefined
        lenis.on('scroll', (l: Lenis) => {
          skewTo(gsap.utils.clamp(-2, 2, l.velocity * 0.08))
          window.clearTimeout(settle)
          settle = window.setTimeout(() => skewTo(0), 90)
        })
        cleanups.push(() => { window.clearTimeout(settle); gsap.set(grid, { clearProps: 'transform' }) })
      }
    }

    /* ── 9. Hover / pointer effects (mouse devices only) ── */
    const mm = gsap.matchMedia()

    mm.add('(hover: hover) and (pointer: fine)', () => {
      const undo: Array<() => void> = []

      // card tilt
      Array.from(store.querySelectorAll('.catalog .product-image') as NodeListOf<HTMLElement>).forEach((img) => {
        const move = (e: PointerEvent) => {
          const r = img.getBoundingClientRect()
          const x = (e.clientX - r.left) / r.width - 0.5
          const y = (e.clientY - r.top) / r.height - 0.5
          gsap.to(img, { rotationY: x * 12, rotationX: -y * 12, transformPerspective: 900, duration: 0.3, ease: 'power2.out' })
        }
        const leave = () => gsap.to(img, { rotationX: 0, rotationY: 0, duration: 0.6, ease: 'power3.out', clearProps: 'transform' })
        img.addEventListener('pointermove', move)
        img.addEventListener('pointerleave', leave)
        undo.push(() => {
          img.removeEventListener('pointermove', move)
          img.removeEventListener('pointerleave', leave)
          gsap.set(img, { clearProps: 'transform' })
        })
      })

      // scramble on nav hover
      navTextNodes.forEach((node, i) => {
        const link = navOwners[i]
        const original = navOriginals[i]
        const onEnter = () => {
          const t = activeScrambles.get(node)
          if (t && t.isActive()) return
          scrambleTo(node, original, 0.5)
        }
        link.addEventListener('pointerenter', onEnter)
        undo.push(() => link.removeEventListener('pointerenter', onEnter))
      })

      // scramble price on hover
      if (priceNode && buyLockup) {
        const onEnter = () => {
          const t = activeScrambles.get(priceNode)
          if (t && t.isActive()) return
          scrambleTo(priceNode, priceOriginal)
        }
        buyLockup.addEventListener('pointerenter', onEnter)
        undo.push(() => buyLockup.removeEventListener('pointerenter', onEnter))
      }

      // magnetic buy button
      const buyBtn = store.querySelector('.buy-lockup button') as HTMLElement | null
      if (buyBtn) {
        const mx = gsap.quickTo(buyBtn, 'x', { duration: 0.6, ease: 'elastic.out(1, 0.5)' })
        const my = gsap.quickTo(buyBtn, 'y', { duration: 0.6, ease: 'elastic.out(1, 0.5)' })
        const move = (e: PointerEvent) => {
          const r = buyBtn.getBoundingClientRect()
          mx((e.clientX - (r.left + r.width / 2)) * 0.35)
          my((e.clientY - (r.top + r.height / 2)) * 0.35)
        }
        const leave = () => { mx(0); my(0) }
        buyBtn.addEventListener('pointermove', move)
        buyBtn.addEventListener('pointerleave', leave)
        undo.push(() => {
          buyBtn.removeEventListener('pointermove', move)
          buyBtn.removeEventListener('pointerleave', leave)
          gsap.set(buyBtn, { clearProps: 'transform' })
        })
      }

      // hero mouse parallax (starts after the intro finishes)
      const player = store.querySelector('.hero-player') as HTMLElement | null
      const previews = store.querySelector('.preview-stack') as HTMLElement | null
      if (campaignEl && (player || previews)) {
        const px = player ? gsap.quickTo(player, 'x', { duration: 1, ease: 'power3' }) : null
        const py = player ? gsap.quickTo(player, 'y', { duration: 1, ease: 'power3' }) : null
        const vx = previews ? gsap.quickTo(previews, 'x', { duration: 1, ease: 'power3' }) : null
        const vy = previews ? gsap.quickTo(previews, 'y', { duration: 1, ease: 'power3' }) : null
        const move = (e: PointerEvent) => {
          if (!introDone) return
          const r = campaignEl.getBoundingClientRect()
          const nx = (e.clientX - r.left) / r.width - 0.5
          const ny = (e.clientY - r.top) / r.height - 0.5
          px?.(nx * -26); py?.(ny * -14)
          vx?.(nx * 20); vy?.(ny * 12)
        }
        const leave = () => { px?.(0); py?.(0); vx?.(0); vy?.(0) }
        campaignEl.addEventListener('pointermove', move)
        campaignEl.addEventListener('pointerleave', leave)
        undo.push(() => {
          campaignEl.removeEventListener('pointermove', move)
          campaignEl.removeEventListener('pointerleave', leave)
        })
      }

      return () => undo.forEach((fn) => fn())
    })

    /* ── 10. Manifesto ── */
    mm.add('(min-width: 900px)', () => {
      const section = store.querySelector('.manifesto') as HTMLElement | null
      if (!section) return

      const bg = section.querySelector(':scope > img:first-child') as HTMLElement | null
      const tagWall = section.querySelector('.tag-wall') as HTMLElement | null
      const player = section.querySelector('.manifesto-player') as HTMLElement | null
      const note = section.querySelector('.manifesto-note') as HTMLElement | null
      const heading = section.querySelector('h2') as HTMLElement | null
      const peak = section.querySelector('.peak-note') as HTMLElement | null
      const barcode = section.querySelector('.barcode') as HTMLElement | null

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: () => (section.offsetHeight > window.innerHeight ? 'bottom bottom' : 'top top'),
          end: '+=130%',
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })

      if (bg) tl.fromTo(bg, { scale: 1.18 }, { scale: 1, ease: 'none' }, 0)
      if (tagWall) tl.to(tagWall, { xPercent: -18, ease: 'none' }, 0)
      if (player) tl.to(player, { scale: 1.1, ease: 'none' }, 0)
      if (note) tl.fromTo(note, { y: 24, opacity: 0 }, { y: 0, opacity: 1, ease: 'none' }, 0.15)
      if (heading) tl.fromTo(heading, { clipPath: 'inset(100% 0 0 0)', y: 40 }, { clipPath: 'inset(0% 0 0 0)', y: 0, ease: 'none' }, 0.25)
      if (peak) tl.fromTo(peak, { y: 24, opacity: 0 }, { y: 0, opacity: 1, ease: 'none' }, 0.4)
      if (barcode) tl.fromTo(barcode, { opacity: 0 }, { opacity: 1, ease: 'none' }, 0.5)

      return () => {
        if (tl.scrollTrigger) tl.scrollTrigger.kill()
        tl.kill()
      }
    })

    mm.add('(max-width: 899px)', () => {
      const section = store.querySelector('.manifesto') as HTMLElement | null
      if (!section) return
      const targets = section.querySelectorAll('.tag-wall, .manifesto-player, .manifesto-note, h2, .peak-note, .barcode')
      const tween = gsap.fromTo(targets, { y: 24, opacity: 0 }, {
        y: 0, opacity: 1, duration: 0.9, stagger: 0.08, ease: 'expo.out', clearProps: 'transform,opacity',
        scrollTrigger: { trigger: section, start: 'top 80%' },
      })
      return () => { tween.scrollTrigger?.kill(); tween.kill() }
    })

    /* ── 11. Lens cursor (mouse devices) ── */
    if (CURSOR_ENABLED && fine) {
      const cur = document.createElement('div')
      cur.className = 'lm-cursor'
      document.body.appendChild(cur)
      const xTo = gsap.quickTo(cur, 'x', { duration: 0.4, ease: 'power3' })
      const yTo = gsap.quickTo(cur, 'y', { duration: 0.4, ease: 'power3' })
      const sTo = gsap.quickTo(cur, 'scale', { duration: 0.45, ease: 'power3' })
      let shown = false

      const onMove = (e: PointerEvent) => {
        if (!shown) {
          shown = true
          gsap.set(cur, { x: e.clientX, y: e.clientY })
          gsap.to(cur, { opacity: 1, duration: 0.3 })
        }
        xTo(e.clientX); yTo(e.clientY)
      }
      const onOver = (e: PointerEvent) => {
        const t = e.target as HTMLElement | null
        if (!t || t.closest?.('.checkout-overlay')) { sTo(1); return }
        if (t.closest('.product-image, .feature-card')) sTo(3.4)
        else if (t.closest('a, button, input')) sTo(2)
        else sTo(1)
      }
      const onLeaveDoc = () => { gsap.to(cur, { opacity: 0, duration: 0.2 }); shown = false }

      document.addEventListener('pointermove', onMove)
      document.addEventListener('pointerover', onOver)
      document.documentElement.addEventListener('pointerleave', onLeaveDoc)
      cleanups.push(() => {
        document.removeEventListener('pointermove', onMove)
        document.removeEventListener('pointerover', onOver)
        document.documentElement.removeEventListener('pointerleave', onLeaveDoc)
        gsap.killTweensOf(cur)
        cur.remove()
      })
    }

    /* ── 12. Scroll progress line along the top ── */
    {
      const bar = document.createElement('div')
      bar.className = 'lm-progress'
      document.body.appendChild(bar)
      const tween = gsap.to(bar, {
        scaleX: 1, ease: 'none',
        scrollTrigger: { start: 0, end: 'max', scrub: 0.3 },
      })
      if (tween.scrollTrigger) scrollTriggers.push(tween.scrollTrigger)
      cleanups.push(() => { tween.kill(); bar.remove() })
    }

    /* ── 13. Keep trigger positions right as images/layout settle ── */
    const handleLoad = () => ScrollTrigger.refresh()
    window.addEventListener('load', handleLoad)
    let resizeTimer = 0
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 150)
    })
    ro.observe(store)
    ScrollTrigger.refresh()

    /* ───────────── Cleanup ───────────── */
    return () => {
      cancelled = true
      window.clearTimeout(failSafe)
      window.removeEventListener('load', handleLoad)
      window.clearTimeout(resizeTimer)
      ro.disconnect()

      cleanups.forEach((fn) => fn())
      mm.revert()
      preCtx.revert()
      preloaderEl?.remove()

      scrollTriggers.forEach((st) => st.kill())
      if (parallaxTl.scrollTrigger) parallaxTl.scrollTrigger.kill()
      parallaxTl.kill()
      heroTl.kill()

      stopSeasonRotation()
      campaignObserver.disconnect()
      document.removeEventListener('visibilitychange', onVisibility)

      lenis.destroy()
      gsap.ticker.remove(onTick)
      gsap.ticker.lagSmoothing(500, 33)

      activeScrambles.forEach((t) => t.kill())
      activeScrambles.clear()
      if (seasonNode) seasonNode.nodeValue = originalSeasonText
      if (priceNode) priceNode.nodeValue = priceOriginal
      if (catSpanNode) catSpanNode.nodeValue = catSpanOriginal
      navTextNodes.forEach((node, i) => { node.nodeValue = navOriginals[i] })
    }
  }, [active])
}

