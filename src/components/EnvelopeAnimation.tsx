'use client'

import { useState, useEffect } from 'react'
import { formatMoney } from '@/lib/supabase'

export default function EnvelopeAnimation({
  amount,
  tierName,
  onDone,
}: {
  amount: number
  tierName?: string
  onDone: () => void
}) {
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 600)
    const t2 = setTimeout(() => setPhase(2), 1400)
    const t3 = setTimeout(() => setPhase(3), 2000)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
      clearTimeout(t3)
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      onClick={phase >= 3 ? onDone : undefined}
    >
      {/* Envelope */}
      <div
        className="relative"
        style={{
          width: 240,
          height: 340,
          transform: phase >= 1 ? 'scale(1)' : 'scale(0.3)',
          opacity: phase >= 0 ? 1 : 0,
          transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <div
          className="w-full h-full rounded-2xl relative overflow-hidden"
          style={{
            background:
              'linear-gradient(170deg, #ff3322 0%, #cc0000 50%, #990000 100%)',
            boxShadow:
              '0 20px 60px rgba(255,0,0,0.4), 0 0 80px rgba(255,50,0,0.2)',
          }}
        >
          {/* Gold border */}
          <div
            className="absolute rounded-xl"
            style={{
              inset: 8,
              border: '2px solid rgba(255,215,0,0.5)',
            }}
          />

          {/* Center circle */}
          <div
            className="absolute flex items-center justify-center rounded-full"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 100,
              height: 100,
              background:
                'radial-gradient(circle, #ffd700 0%, #b8860b 100%)',
              boxShadow: '0 0 30px rgba(255,215,0,0.5)',
            }}
          >
            {phase < 2 ? (
              <span className="text-5xl font-black" style={{ color: '#8B0000' }}>
                福
              </span>
            ) : (
              <div className="text-center animate-popIn">
                <div className="text-sm font-semibold" style={{ color: '#8B0000' }}>
                  {tierName || '恭喜'}
                </div>
                <div className="text-xl font-black" style={{ color: '#8B0000' }}>
                  {formatMoney(amount)}
                </div>
              </div>
            )}
          </div>

          {/* Bottom text */}
          <div
            className="absolute text-xs tracking-widest"
            style={{
              bottom: 20,
              left: '50%',
              transform: 'translateX(-50%)',
              color: 'rgba(255,215,0,0.3)',
            }}
          >
            ✦ 恭喜發財 ✦
          </div>
        </div>
      </div>

      {/* Particles */}
      {phase >= 2 &&
        Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="fixed animate-particle"
            style={{
              left: `${50 + (Math.random() - 0.5) * 60}%`,
              top: `${50 + (Math.random() - 0.5) * 60}%`,
              width: 8,
              height: 8,
              background: i % 2 === 0 ? '#ffd700' : '#ff4444',
              borderRadius: i % 3 === 0 ? '50%' : '2px',
              '--tx': `${(Math.random() - 0.5) * 80}px`,
              '--ty': `${(Math.random() - 0.5) * 80}px`,
              animationDelay: `${Math.random() * 0.3}s`,
            } as React.CSSProperties}
          />
        ))}

      {phase >= 3 && (
        <div className="fixed bottom-16 text-white/60 text-sm animate-fadeIn">
          點擊任意處關閉
        </div>
      )}
    </div>
  )
}
