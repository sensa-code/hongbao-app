'use client'

export function Lantern({ side, delay = 0 }: { side: 'left' | 'right'; delay?: number }) {
  return (
    <div
      className="absolute -top-2.5 z-[1]"
      style={{
        [side]: 20,
        animation: `sway 3s ease-in-out ${delay}s infinite alternate`,
      }}
    >
      <div className="w-1 h-5 mx-auto rounded-sm" style={{ background: '#b8860b' }} />
      <div
        className="w-11 h-14 rounded-full relative flex items-center justify-center"
        style={{
          background: 'linear-gradient(180deg, #ff2200 0%, #cc0000 100%)',
          boxShadow: '0 0 20px rgba(255,50,0,0.4), inset 0 -8px 16px rgba(0,0,0,0.2)',
        }}
      >
        <span className="text-lg font-black" style={{ color: '#ffd700' }}>福</span>
        <div
          className="absolute flex gap-0.5"
          style={{ bottom: -12, left: '50%', transform: 'translateX(-50%)' }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="rounded-sm"
              style={{
                width: 2,
                height: 14 + i * 3,
                background: '#ffd700',
                animation: `tassle 2s ease-in-out ${i * 0.3}s infinite alternate`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export function GoldCoin() {
  return (
    <div
      className="inline-flex items-center justify-center rounded-full text-xs font-black"
      style={{
        width: 24,
        height: 24,
        background: 'radial-gradient(circle at 35% 35%, #ffe066, #b8860b)',
        border: '2px solid #8B6914',
        color: '#8B6914',
        boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
        verticalAlign: 'middle',
      }}
    >
      元
    </div>
  )
}

export function ProgressBar({
  current,
  total,
  color = '#ffd700',
}: {
  current: number
  total: number
  color?: string
}) {
  const pct = total > 0 ? Math.min(100, (current / total) * 100) : 0
  return (
    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.08)' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}
