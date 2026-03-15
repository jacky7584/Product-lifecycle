'use client'

import { useEffect, useRef, useCallback } from 'react'
import gsap from 'gsap'

/**
 * Fade-in + slide-up animation for a container and its children with stagger.
 * Usage: const ref = useGsapFadeIn()  →  <div ref={ref}>...</div>
 */
export function useGsapFadeIn(options?: { delay?: number; stagger?: number; y?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const children = el.querySelectorAll('.gsap-item')
    const targets = children.length > 0 ? children : [el]

    gsap.fromTo(targets,
      { opacity: 0, y: options?.y ?? 30 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', stagger: options?.stagger ?? 0.1, delay: options?.delay ?? 0.1 }
    )

    return () => { gsap.killTweensOf(targets) }
  }, [options?.delay, options?.stagger, options?.y])

  return ref
}

/**
 * Scale-in animation (pop effect).
 */
export function useGsapScaleIn(options?: { delay?: number; stagger?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const children = el.querySelectorAll('.gsap-item')
    const targets = children.length > 0 ? children : [el]

    gsap.fromTo(targets,
      { opacity: 0, scale: 0.8 },
      { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.4)', stagger: options?.stagger ?? 0.08, delay: options?.delay ?? 0.1 }
    )

    return () => { gsap.killTweensOf(targets) }
  }, [options?.delay, options?.stagger])

  return ref
}

/**
 * Slide-in from left animation.
 */
export function useGsapSlideLeft(options?: { delay?: number }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    gsap.fromTo(el,
      { opacity: 0, x: -40 },
      { opacity: 1, x: 0, duration: 0.6, ease: 'power2.out', delay: options?.delay ?? 0.1 }
    )

    return () => { gsap.killTweensOf(el) }
  }, [options?.delay])

  return ref
}

/**
 * Staggered list animation – animates children as they enter.
 * Good for project cards, task rows, kanban columns.
 */
export function useGsapStaggerList(deps: unknown[] = []) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const items = el.children
    if (items.length === 0) return

    gsap.fromTo(items,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.06, delay: 0.15 }
    )

    return () => { gsap.killTweensOf(items) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}

/**
 * Scroll-triggered reveal using IntersectionObserver + GSAP.
 */
export function useGsapScrollReveal() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const items = el.querySelectorAll('.gsap-reveal')
    gsap.set(items, { opacity: 0, y: 40 })

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.fromTo(entry.target,
              { opacity: 0, y: 40 },
              { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }
            )
            observer.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    )

    items.forEach((item) => observer.observe(item))

    return () => observer.disconnect()
  }, [])

  return ref
}

/**
 * Magnetic hover effect for buttons/cards.
 * Attach to a container, it will track mouse and apply subtle movement.
 */
export function useGsapMagnetic(strength = 0.3) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const handleMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect()
      const x = (e.clientX - rect.left - rect.width / 2) * strength
      const y = (e.clientY - rect.top - rect.height / 2) * strength
      gsap.to(el, { x, y, duration: 0.3, ease: 'power2.out' })
    }

    const handleLeave = () => {
      gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: 'elastic.out(1, 0.4)' })
    }

    el.addEventListener('mousemove', handleMove)
    el.addEventListener('mouseleave', handleLeave)

    return () => {
      el.removeEventListener('mousemove', handleMove)
      el.removeEventListener('mouseleave', handleLeave)
      gsap.killTweensOf(el)
    }
  }, [strength])

  return ref
}

/**
 * Counter animation – animates a number from 0 to target.
 */
export function useGsapCounter(target: number, deps: unknown[] = []) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.textContent = String(target)
      return
    }

    const obj = { val: 0 }
    gsap.to(obj, {
      val: target,
      duration: 0.8,
      ease: 'power2.out',
      delay: 0.2,
      onUpdate: () => {
        el.textContent = String(Math.round(obj.val))
      },
    })

    return () => { gsap.killTweensOf(obj) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, ...deps])

  return ref
}

/**
 * Page transition – fade + slide wrapper for entire pages.
 * The element should have style={{ opacity: 0 }} inline to prevent flash.
 */
export function useGsapPageTransition() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.style.opacity = '1'
      return
    }

    gsap.fromTo(el,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    )

    return () => { gsap.killTweensOf(el) }
  }, [])

  return ref
}
