'use client'

import Link from 'next/link'
import { ReactNode, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { useAuth } from '@/contexts/AuthContext'
import gsap from 'gsap'
import { useGsapMagnetic } from '@/hooks/useGsap'
import GlassIcons from '@/components/GlassIcons'
import StarBorder from '@/components/StarBorder'
import GlareHover from '@/components/GlareHover'

const DarkVeil = dynamic(() => import('@/components/DarkVeil'), { ssr: false })

export default function LandingPage() {
  const { user } = useAuth()
  const heroRef = useRef<HTMLDivElement>(null)
  const featuresRef = useRef<HTMLDivElement>(null)
  const stepsRef = useRef<HTMLDivElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const stagesRef = useRef<HTMLDivElement>(null)
  const ctaBtnRef = useGsapMagnetic(0.2)
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (wrapperRef.current) wrapperRef.current.style.visibility = 'visible'
      return
    }

    const ctx = gsap.context(() => {
      if (wrapperRef.current) gsap.set(wrapperRef.current, { visibility: 'visible' })

      const heroTl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      heroTl
        .fromTo('.hero-title', { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: 0.8 })
        .fromTo('.hero-subtitle', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6 }, '-=0.4')
        .fromTo('.hero-divider', { scaleX: 0 }, { scaleX: 1, duration: 0.6 }, '-=0.3')
        .fromTo('.hero-desc', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.5, stagger: 0.15 }, '-=0.3')
        .fromTo('.hero-cta', { opacity: 0, y: 20, scale: 0.9 }, { opacity: 1, y: 0, scale: 1, duration: 0.5 }, '-=0.2')

      gsap.to('.orb-1', { y: -20, x: 10, duration: 3, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      gsap.to('.orb-2', { y: 15, x: -10, duration: 3.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.5 })

      if (stagesRef.current) {
        const badges = stagesRef.current.querySelectorAll('.stage-badge')
        const arrows = stagesRef.current.querySelectorAll('.stage-arrow')
        gsap.set([badges, arrows], { opacity: 0, scale: 0.5 })
        const obs = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              gsap.to(badges, { opacity: 1, scale: 1, duration: 0.5, ease: 'back.out(1.7)', stagger: 0.12 })
              gsap.to(arrows, { opacity: 1, scale: 1, duration: 0.3, ease: 'power2.out', stagger: 0.12, delay: 0.2 })
              obs.disconnect()
            }
          })
        }, { threshold: 0.3 })
        obs.observe(stagesRef.current)
      }

      if (featuresRef.current) {
        const cards = featuresRef.current.querySelectorAll('.feature-card')
        gsap.set(cards, { opacity: 0, y: 50, rotateX: 10 })
        const obs = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              gsap.to(cards, { opacity: 1, y: 0, rotateX: 0, duration: 0.7, ease: 'power2.out', stagger: 0.15 })
              obs.disconnect()
            }
          })
        }, { threshold: 0.15 })
        obs.observe(featuresRef.current)
      }

      if (stepsRef.current) {
        const stepItems = stepsRef.current.querySelectorAll('.step-item')
        const stepsTitle = stepsRef.current.querySelectorAll('.steps-title')
        gsap.set(stepItems, { opacity: 0, x: -30 })
        gsap.set(stepsTitle, { opacity: 0, y: 20 })
        const obs = new IntersectionObserver((entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) {
              gsap.to(stepsTitle, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.1 })
              gsap.to(stepItems, { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out', stagger: 0.12, delay: 0.2 })
              obs.disconnect()
            }
          })
        }, { threshold: 0.15 })
        obs.observe(stepsRef.current)
      }

      if (ctaRef.current) {
        const ctaBox = ctaRef.current.querySelector('.cta-box')
        if (ctaBox) {
          gsap.set(ctaBox, { opacity: 0, scale: 0.9, y: 30 })
          const obs = new IntersectionObserver((entries) => {
            entries.forEach((e) => {
              if (e.isIntersecting) {
                gsap.to(ctaBox, { opacity: 1, scale: 1, y: 0, duration: 0.7, ease: 'power2.out' })
                obs.disconnect()
              }
            })
          }, { threshold: 0.3 })
          obs.observe(ctaRef.current)
        }
      }
    })

    return () => ctx.revert()
  }, [])

  const glassIconItems = [
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" /></svg>,
      color: 'blue',
      label: '看板面板',
    },
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
      color: 'purple',
      label: '團隊協作',
    },
    {
      icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-full h-full"><path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" /></svg>,
      color: 'indigo',
      label: '全流程追蹤',
    },
  ]

  return (
    <div ref={wrapperRef} className="flex flex-col items-center overflow-hidden" style={{ visibility: 'hidden' }}>
      {/* Hero Section with DarkVeil background */}
      <section
        ref={heroRef}
        className="relative text-center py-24 px-4 max-w-3xl mx-auto w-full"
        aria-label="Hero"
      >
        {/* DarkVeil background */}
        <div className="absolute inset-0 opacity-20 rounded-2xl overflow-hidden pointer-events-none">
          <DarkVeil speed={0.3} noiseIntensity={0.03} warpAmount={0.5} />
        </div>

        {/* Decorative gradient orbs */}
        <div className="orb-1 absolute -top-20 -left-32 w-72 h-72 bg-blue-200/30 rounded-full blur-3xl pointer-events-none" />
        <div className="orb-2 absolute -bottom-16 -right-28 w-64 h-64 bg-indigo-200/30 rounded-full blur-3xl pointer-events-none" />

        <div className="relative">
          <h1 className="hero-title text-4xl sm:text-5xl lg:text-6xl font-bold mb-3">
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 bg-clip-text text-transparent animate-gradient">
              產品生命週期管理
            </span>
          </h1>
          <p className="hero-subtitle text-xl text-text-tertiary mb-6 tracking-wide">
            Product Lifecycle Management
          </p>

          <div className="flex justify-center mb-6">
            <div className="hero-divider h-0.5 bg-gradient-to-r from-transparent via-blue-500 to-transparent max-w-[120px] w-full origin-center" />
          </div>

          <p className="hero-desc text-lg text-text-secondary mb-4 max-w-2xl mx-auto leading-relaxed">
            一套輕量的看板式項目追蹤系統，幫助團隊管理從啟動到上線的完整開發流程。
          </p>
          <p className="hero-desc text-base text-text-tertiary mb-10 max-w-2xl mx-auto leading-relaxed">
            建立項目、開工單、指派工程師，透過拖曳在 Start / Dev / QA / Finish 四個階段間流轉，讓每張工單的進展一目了然。
          </p>

          <div className="hero-cta flex items-center justify-center gap-4" ref={ctaBtnRef}>
            {user ? (
              <StarBorder as="div" color="#2E9DFF" speed="5s" className="cursor-pointer">
                <Link href="/dashboard" className="text-sm font-semibold">
                  開始使用
                </Link>
              </StarBorder>
            ) : (
              <>
                <StarBorder as="div" color="#2E9DFF" speed="5s" className="cursor-pointer">
                  <Link href="/register" className="text-sm font-semibold">
                    免費註冊
                  </Link>
                </StarBorder>
                <Link
                  href="/login"
                  className="px-8 py-3.5 text-sm font-semibold text-text-secondary bg-bg-default border border-border-primary rounded-lg hover:bg-bg-secondary hover:border-border-primary transition-all duration-300 cursor-pointer hover:scale-105 active:scale-100 hover:shadow-md"
                >
                  登入
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Stage Flow Visualization */}
      <section ref={stagesRef} className="w-full max-w-3xl mx-auto px-4 pb-8">
        <div className="flex items-center justify-center gap-2 sm:gap-4">
          {[
            { label: 'START', color: 'bg-bg-tertiary text-text-secondary' },
            { label: 'DEV', color: 'bg-blue-200 text-blue-700' },
            { label: 'QA', color: 'bg-amber-200 text-amber-700' },
            { label: 'FINISH', color: 'bg-green-200 text-green-700' },
          ].map((stage, i) => (
            <div key={stage.label} className="flex items-center gap-2 sm:gap-4">
              <span className={`stage-badge px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold rounded-lg ${stage.color} transition-transform duration-200 hover:scale-110`}>
                {stage.label}
              </span>
              {i < 3 && (
                <svg className="stage-arrow w-4 h-4 text-text-tertiary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* GlassIcons Feature Section */}
      <section className="py-8 px-4 max-w-md mx-auto w-full">
        <GlassIcons items={glassIconItems} className="!grid-cols-3 !gap-8 !py-4" />
      </section>

      {/* Feature Cards */}
      <section
        ref={featuresRef}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 py-12 px-4 max-w-5xl mx-auto w-full"
        aria-label="Features"
      >
        <FeatureCard
          title="看板面板 Kanban"
          description="拖曳式看板，直觀展示工單在 Start、Dev、QA、Finish 各階段的流轉狀態。"
        />
        <FeatureCard
          title="團隊協作 Collaboration"
          description="管理工程師團隊，將工單分配給指定成員，追蹤每個人的工作負載。"
        />
        <FeatureCard
          title="全流程追蹤 Tracking"
          description="從需求啟動到功能上線，四個階段覆蓋完整開發週期，支援描述與附件。"
        />
      </section>

      {/* How It Works */}
      <section
        ref={stepsRef}
        className="py-16 px-4 max-w-3xl mx-auto text-center w-full"
        aria-label="How it works"
      >
        <h2 className="steps-title text-2xl font-bold text-text-primary mb-2">如何使用</h2>
        <p className="steps-title text-sm text-text-tertiary mb-8">How It Works</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
          <Step number="1" title="建立項目" description="為你的產品或功能建立一個項目空間。" />
          <Step number="2" title="新增工單" description="在項目中建立工單，填寫描述、上傳截圖。" />
          <Step number="3" title="指派工程師" description="將工單分配給團隊成員，明確責任人。" />
          <Step number="4" title="拖曳流轉" description="透過拖曳將工單在四個階段間移動，追蹤進度。" />
        </div>
      </section>

      {/* Bottom CTA */}
      <section
        ref={ctaRef}
        className="py-16 px-4 max-w-2xl mx-auto text-center w-full"
        aria-label="Call to action"
      >
        <div className="cta-box relative bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-10 text-white overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative">
            <h2 className="text-2xl font-bold mb-3">
              {user ? '歡迎回來！' : '準備好開始了嗎？'}
            </h2>
            <p className="text-blue-100 mb-6 text-sm">
              {user ? '前往看板，繼續管理你的項目。' : '免費建立帳號，立即體驗看板式項目管理。'}
            </p>
            <StarBorder as="div" color="white" speed="5s" className="inline-block cursor-pointer">
              <Link
                href={user ? '/dashboard' : '/register'}
                className="text-sm font-semibold"
              >
                {user ? '開始使用' : '免費註冊'}
              </Link>
            </StarBorder>
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <GlareHover
      width="100%"
      height="auto"
      background="var(--color-bg-default)"
      borderRadius="0.75rem"
      borderColor="var(--color-border-primary)"
      glareColor="#2E9DFF"
      glareOpacity={0.2}
      glareSize={300}
      className="feature-card !place-items-stretch"
    >
      <div className="p-6 text-center relative z-10">
        <h3 className="text-lg font-semibold text-text-primary mb-2">{title}</h3>
        <p className="text-sm text-text-tertiary leading-relaxed">{description}</p>
      </div>
    </GlareHover>
  )
}

function Step({ number, title, description }: { number: string; title: string; description: string }) {
  return (
    <GlareHover
      width="100%"
      height="auto"
      background="var(--color-bg-default)"
      borderRadius="0.75rem"
      borderColor="var(--color-border-primary)"
      glareColor="#818cf8"
      glareOpacity={0.15}
      glareSize={250}
      className="step-item !place-items-stretch"
    >
      <div className="p-4 flex gap-4 relative z-10 text-left w-full group">
        <span className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-bold flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-sm">
          {number}
        </span>
        <div>
          <h4 className="text-sm font-semibold text-text-primary mb-0.5">{title}</h4>
          <p className="text-sm text-text-tertiary">{description}</p>
        </div>
      </div>
    </GlareHover>
  )
}
