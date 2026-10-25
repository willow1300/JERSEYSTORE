import { useLayoutEffect } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import './landingMotion.css'

gsap.registerPlugin(ScrollTrigger)

const SEASON_MESSAGES = [
  "[ FOOTBALL CULTURE 25.1 ] [ SERIES 01 ]",
  "[ 26/27 COLLECTION ] [ NEW DROP ]",
  "[ AUTHENTIC + RETRO ] [ ALL LEAGUES ]",
  "[ WORLDWIDE DELIVERY ] [ PAY WITH M-PESA ]",
]

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
  for (const n of Array.from(el.childNodes)) {
    if (n.nodeType === Node.TEXT_NODE) count++
  }
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
        keep.lastIndex = 0
        if (keep.test(ch) || i < revealed) {
          out += ch
        } else {
          out += alphabet[Math.floor(Math.random() * alphabet.length)]
        }
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

export function useLandingMotion(active: boolean) {
  useLayoutEffect(() => {
    if (!active) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const store = document.querySelector('.store') as HTMLElement | null
    if (!store) return

    const scrollTriggers: ScrollTrigger[] = []

    const lenis = new Lenis({
      lerp: 0.1,
      anchors: true,
      prevent: (node: HTMLElement) => !!node.closest('.checkout-overlay, .mobile-nav'),
    })
    lenis.on('scroll', ScrollTrigger.update)
    const onTick = (time: number) => {
      lenis.raf(time * 1000)
    }
    gsap.ticker.add(onTick)
    gsap.ticker.lagSmoothing(0)

    const seasonCode = store.querySelector('.season-code') as HTMLElement | null
    const seasonNode = getTextNode(seasonCode, '.season-code')
    const originalSeasonText = seasonNode?.nodeValue ?? ''

    const priceStrong = store.querySelector('.buy-lockup strong') as HTMLElement | null
    const priceNode = getTextNode(priceStrong, '.buy-lockup strong')
    const priceOriginal = priceNode?.nodeValue ?? ''

    const navLinks = Array.from(store.querySelectorAll('.topbar nav a')) as HTMLElement[]
    const navTextNodes: Text[] = []
    const navOriginals: string[] = []
    navLinks.forEach((link) => {
      const node = getTextNode(link, '.topbar nav a')
      if (node) {
        navTextNodes.push(node)
        navOriginals.push(node.nodeValue ?? '')
      } else {
        console.warn('[landingMotion] nav link has no single text node; skipping scramble', link)
      }
    })

    const buyLockup = store.querySelector('.buy-lockup') as HTMLElement | null

    let introDone = false
    let seasonIndex = 0
    let seasonTimer: number | null = null
    let campaignInView = true
    let pageVisible = !document.hidden

    const startSeasonRotation = () => {
      if (seasonTimer !== null) return
      if (!seasonNode || !introDone || !campaignInView || document.hidden) return
      seasonTimer = window.setInterval(() => {
        if (!campaignInView || document.hidden) {
          if (seasonTimer !== null) {
            window.clearInterval(seasonTimer)
            seasonTimer = null
          }
          return
        }
        seasonIndex = (seasonIndex + 1) % SEASON_MESSAGES.length
        scrambleTo(seasonNode, SEASON_MESSAGES[seasonIndex])
      }, 4500)
    }

    const stopSeasonRotation = () => {
      if (seasonTimer !== null) {
        window.clearInterval(seasonTimer)
        seasonTimer = null
      }
    }

    const campaignEl = store.querySelector('.campaign') as HTMLElement | null
    const campaignObserver = new IntersectionObserver((entries) => {
      campaignInView = entries[0]?.isIntersecting ?? true
      if (campaignInView && introDone && !document.hidden) {
        startSeasonRotation()
      } else {
        stopSeasonRotation()
      }
    }, { threshold: 0.1 })
    if (campaignEl) campaignObserver.observe(campaignEl)

    const onVisibilityChange = () => {
      pageVisible = !document.hidden
      if (pageVisible && introDone && campaignInView) {
        startSeasonRotation()
      } else {
        stopSeasonRotation()
      }
    }
    document.addEventListener('visibilitychange', onVisibilityChange)

    const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    if (seasonNode) {
      const proxy = { p: 0 }
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789[] .'
      heroTl.to(proxy, {
        p: 1,
        duration: 1.1,
        ease: 'none',
        onUpdate: () => {
          const revealed = Math.floor(proxy.p * originalSeasonText.length)
          let out = ''
          for (let i = 0; i < originalSeasonText.length; i++) {
            const ch = originalSeasonText[i]
            if (i < revealed || /\s|[^A-Za-z0-9]/.test(ch)) {
              out += ch
            } else {
              out += chars[Math.floor(Math.random() * chars.length)]
            }
          }
          seasonNode.nodeValue = out
        },
        onComplete: () => {
          seasonNode.nodeValue = originalSeasonText
        },
      }, 0)
    }

    const titleP = store.querySelectorAll('.campaign-title > p')
    const titleH1 = store.querySelectorAll('.campaign-title h1')
    const specs = store.querySelectorAll('.specs span')
    const buyLockupAnim = store.querySelectorAll('.buy-lockup')
    const heroPlayer = store.querySelectorAll('.hero-player')
    const previewFigures = store.querySelectorAll('.preview-stack figure')
    const slideCount = store.querySelector('.slide-count') as HTMLElement | null
    const socials = store.querySelector('.socials') as HTMLElement | null

    heroTl.fromTo(titleP, { y: 28, opacity: 0, clipPath: 'inset(0 100% 0 0)' }, { y: 0, opacity: 1, clipPath: 'inset(0 0% 0 0)', duration: 0.7, clearProps: 'all' }, 0.1)
    heroTl.fromTo(titleH1, { y: 40, opacity: 0, clipPath: 'inset(100% 0 0 0)' }, { y: 0, opacity: 1, clipPath: 'inset(0% 0 0 0)', duration: 0.9, clearProps: 'all' }, 0.2)
    heroTl.fromTo(specs, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, stagger: 0.08, clearProps: 'all' }, 0.5)
    heroTl.fromTo(buyLockupAnim, { y: 18, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, clearProps: 'all' }, 0.6)
    heroTl.fromTo(heroPlayer, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', duration: 0.9, clearProps: 'all' }, 0.2)
    heroTl.fromTo(previewFigures, { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, stagger: 0.12, clearProps: 'all' }, 0.4)
    if (slideCount) heroTl.fromTo(slideCount, { opacity: 0 }, { opacity: 1, duration: 0.6, clearProps: 'all' }, 0.8)
    if (socials) heroTl.fromTo(socials, { opacity: 0 }, { opacity: 1, duration: 0.6, clearProps: 'all' }, 0.8)

    heroTl.eventCallback('onComplete', () => {
      if (priceNode) scrambleTo(priceNode, priceOriginal)
      introDone = true
      if (campaignInView && !document.hidden) startSeasonRotation()
    })

    const campaign = store.querySelector('.campaign') as HTMLElement | null
    const parallaxTl = gsap.timeline({
      scrollTrigger: campaign
        ? {
            trigger: campaign,
            start: 'top top',
            end: 'bottom top',
            scrub: true,
          }
        : undefined,
    })
    if (campaign) {
      parallaxTl.to(store.querySelectorAll('.campaign-title'), { yPercent: -40, opacity: 0, ease: 'none' }, 0)
      parallaxTl.to(store.querySelectorAll('.hero-player'), { yPercent: 25, ease: 'none' }, 0)
      parallaxTl.to(store.querySelectorAll('.preview-stack'), { yPercent: -25, ease: 'none' }, 0)
      parallaxTl.to(store.querySelectorAll('.campaign-bg'), { scale: 1.12, ease: 'none' }, 0)
    }

    const catalogHead = store.querySelector('.catalog-head') as HTMLElement | null
    if (catalogHead) {
      const tween = gsap.fromTo(catalogHead, { y: 30, opacity: 0 }, {
        y: 0,
        opacity: 1,
        duration: 0.8,
        clearProps: 'all',
        scrollTrigger: {
          trigger: catalogHead,
          start: 'top 85%',
        },
      })
      if (tween.scrollTrigger) scrollTriggers.push(tween.scrollTrigger)
    }

    const batchTargets = store.querySelectorAll('.catalog .feature-card, .catalog .product')
    if (batchTargets.length) {
      gsap.set(batchTargets, { opacity: 0, y: 40 })
      const batchSTs = ScrollTrigger.batch(batchTargets, {
        start: 'top 88%',
        once: true,
        onEnter: (batch) => {
          gsap.to(batch, { y: 0, opacity: 1, duration: 0.65, stagger: 0.08, clearProps: 'transform,opacity', overwrite: true })
        },
      })
      scrollTriggers.push(...batchSTs)
    }

    const mm = gsap.matchMedia()

    mm.add('(hover: hover) and (pointer: fine)', () => {
      const imgs = Array.from(store.querySelectorAll('.catalog .product-image')) as HTMLElement[]
      const handlers = new Map<HTMLElement, { move: (e: PointerEvent) => void; leave: () => void }>()

      imgs.forEach((img) => {
        const move = (e: PointerEvent) => {
          const rect = img.getBoundingClientRect()
          const x = (e.clientX - rect.left) / rect.width - 0.5
          const y = (e.clientY - rect.top) / rect.height - 0.5
          gsap.to(img, { rotationY: x * 12, rotationX: -y * 12, transformPerspective: 900, duration: 0.2, ease: 'power2.out' })
        }
        const leave = () => {
          gsap.to(img, { rotationX: 0, rotationY: 0, duration: 0.45, ease: 'power2.out', clearProps: 'transform' })
        }
        img.addEventListener('pointermove', move)
        img.addEventListener('pointerleave', leave)
        handlers.set(img, { move, leave })
      })

      return () => {
        handlers.forEach((h, img) => {
          img.removeEventListener('pointermove', h.move)
          img.removeEventListener('pointerleave', h.leave)
        })
        gsap.set(imgs, { clearProps: 'transform' })
      }
    })


    mm.add('(hover: hover) and (pointer: fine)', () => {
      const cleanups: Array<() => void> = []

      navTextNodes.forEach((node, i) => {
        const link = navLinks[i]
        const original = navOriginals[i]
        const onEnter = () => {
          const t = activeScrambles.get(node)
          if (t && t.isActive()) return
          scrambleTo(node, original, 0.5)
        }
        link.addEventListener('pointerenter', onEnter)
        cleanups.push(() => link.removeEventListener('pointerenter', onEnter))
      })

      if (priceNode && buyLockup) {
        const onPriceEnter = () => {
          const t = activeScrambles.get(priceNode)
          if (t && t.isActive()) return
          scrambleTo(priceNode, priceOriginal)
        }
        buyLockup.addEventListener('pointerenter', onPriceEnter)
        cleanups.push(() => buyLockup.removeEventListener('pointerenter', onPriceEnter))
      }

      return () => {
        cleanups.forEach((fn) => fn())
      }
    })


    mm.add('(min-width: 900px)', () => {
      const section = store.querySelector('.manifesto') as HTMLElement | null
      if (!section) return

      const tagWall = section.querySelector('.tag-wall') as HTMLElement | null
      const player = section.querySelector('.manifesto-player') as HTMLElement | null
      const note = section.querySelector('.manifesto-note') as HTMLElement | null
      const heading = section.querySelector('h2') as HTMLElement | null
      const peak = section.querySelector('.peak-note') as HTMLElement | null
      const barcode = section.querySelector('.barcode') as HTMLElement | null

      const pinStart = section.offsetHeight > window.innerHeight ? 'bottom bottom' : 'top top'

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: pinStart,
          end: '+=120%',
          pin: true,
          scrub: true,
          invalidateOnRefresh: true,
        },
      })

      if (tagWall) tl.to(tagWall, { xPercent: -18, ease: 'none' }, 0)
      if (player) tl.to(player, { scale: 1.1, ease: 'none' }, 0)
      if (note) tl.fromTo(note, { y: 20, opacity: 0 }, { y: 0, opacity: 1, ease: 'none' }, 0.15)
      if (heading) tl.fromTo(heading, { clipPath: 'inset(100% 0 0 0)' }, { clipPath: 'inset(0% 0 0 0)', ease: 'none' }, 0.25)
      if (peak) tl.fromTo(peak, { y: 20, opacity: 0 }, { y: 0, opacity: 1, ease: 'none' }, 0.35)
      if (barcode) tl.fromTo(barcode, { opacity: 0 }, { opacity: 1, ease: 'none' }, 0.45)

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
        y: 0,
        opacity: 1,
        duration: 0.7,
        stagger: 0.08,
        clearProps: 'all',
        scrollTrigger: {
          trigger: section,
          start: 'top 80%',
        },
      })
      if (tween.scrollTrigger) scrollTriggers.push(tween.scrollTrigger)
      return () => {
        tween.kill()
      }
    })


    const handleLoad = () => {
      ScrollTrigger.refresh()
    }
    window.addEventListener('load', handleLoad)

    let resizeTimer = 0
    const ro = new ResizeObserver(() => {
      window.clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(() => {
        ScrollTrigger.refresh()
      }, 150)
    })
    ro.observe(store)

    ScrollTrigger.refresh()

    return () => {
      window.removeEventListener('load', handleLoad)
      window.clearTimeout(resizeTimer)
      ro.disconnect()

      mm.revert()

      scrollTriggers.forEach((st) => {
        st.kill()
      })

      if (parallaxTl.scrollTrigger) parallaxTl.scrollTrigger.kill()
      parallaxTl.kill()
      heroTl.kill()

      lenis.destroy()
      gsap.ticker.remove(onTick)
      gsap.ticker.lagSmoothing(500, 33)

       stopSeasonRotation()
       campaignObserver.disconnect()
       document.removeEventListener('visibilitychange', onVisibilityChange)

       activeScrambles.forEach((t) => t.kill())
       activeScrambles.clear()

       if (seasonNode) seasonNode.nodeValue = originalSeasonText
       if (priceNode) priceNode.nodeValue = priceOriginal
       navTextNodes.forEach((node, i) => {
         node.nodeValue = navOriginals[i]
       })
    }
  }, [active])
}

