'use client'

import { useState, useEffect, useRef } from 'react'

interface CountUpProps {
  value: number
  format?: (v: number) => string
  duration?: number
  className?: string
  style?: React.CSSProperties
}

export function CountUp({ value, format = (v) => v.toFixed(2), duration = 800, className, style }: CountUpProps) {
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const startRef = useRef<number | null>(null)
  const rafRef = useRef<number>(0)
  const targetRef = useRef(value)

  useEffect(() => {
    if (value === targetRef.current) return
    fromRef.current = display
    targetRef.current = value
    startRef.current = null
    cancelAnimationFrame(rafRef.current)
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const t = Math.min(1, (ts - startRef.current) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(fromRef.current + (targetRef.current - fromRef.current) * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value, duration])

  return <span className={className} style={style}>{format(display)}</span>
}

function FormattedBRL({ value }: { value: number }) {
  const [v, setV] = useState(value)
  const rafRef = useRef<number>(0)
  const startRef = useRef<number | null>(null)

  useEffect(() => {
    if (value === v) return
    const start = v
    const end = value
    const dur = 900
    startRef.current = null
    cancelAnimationFrame(rafRef.current)
    const step = (ts: number) => {
      if (!startRef.current) startRef.current = ts
      const t = Math.min(1, (ts - startRef.current) / dur)
      const eased = 1 - Math.pow(1 - t, 3)
      setV(start + (end - start) * eased)
      if (t < 1) rafRef.current = requestAnimationFrame(step)
    }
    rafRef.current = requestAnimationFrame(step)
    return () => cancelAnimationFrame(rafRef.current)
  }, [value])

  const fixed = v.toFixed(2)
  const [int, cents] = fixed.split('.')
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return (
    <>
      <span>{intFmt}</span>
      <span className="cents">,{cents}</span>
    </>
  )
}

interface HeroVendidoProps {
  value: number
  bumpKey: number | null | undefined
}

export function HeroVendido({ value, bumpKey }: HeroVendidoProps) {
  const [bumping, setBumping] = useState(false)

  useEffect(() => {
    if (bumpKey == null) return
    setBumping(true)
    const id = setTimeout(() => setBumping(false), 700)
    return () => clearTimeout(id)
  }, [bumpKey])

  return (
    <div className={'hero-num' + (bumping ? ' bumping' : '')}>
      <span className="currency">R$</span>
      <FormattedBRL value={value} />
    </div>
  )
}
