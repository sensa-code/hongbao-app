'use client'

import { Draw, formatMoney } from '@/lib/supabase'

const rankStyles = [
  'bg-gradient-to-r from-yellow-500/15 to-yellow-500/5 border-yellow-500/25',
  'bg-white/5 border-gray-400/15',
  'bg-orange-800/10 border-orange-700/15',
]

export default function Leaderboard({
  draws,
  showTime = false,
  showTier = false,
}: {
  draws: Draw[]
  showTime?: boolean
  showTier?: boolean
}) {
  if (draws.length === 0) {
    return (
      <p className="text-center py-5 text-sm" style={{ color: 'rgba(255,215,0,0.4)' }}>
        還沒有人抽紅包，快來當第一個！
      </p>
    )
  }

  const sorted = [...draws].sort((a, b) => b.amount - a.amount)

  return (
    <div className="flex flex-col gap-1.5">
      {sorted.map((d, i) => (
        <div
          key={d.id}
          className={`flex items-center px-3 py-2.5 rounded-xl border transition-all ${
            i < 3 ? rankStyles[i] : 'bg-white/[0.03] border-yellow-500/5'
          }`}
        >
          <div className="w-9 text-center text-lg">
            {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[15px] font-semibold text-white/90 truncate">{d.name}</div>
            {showTier && d.tier_name && (
              <span className="text-[10px] px-1.5 py-0.5 rounded mt-0.5 inline-block"
                style={{ background: 'rgba(255,215,0,0.12)', color: 'rgba(255,215,0,0.8)' }}>
                {d.tier_name}
              </span>
            )}
          </div>
          <div
            className="font-bold ml-2"
            style={{
              color: i === 0 ? '#ffd700' : '#ff8866',
              fontSize: i === 0 ? 20 : 16,
            }}
          >
            {formatMoney(d.amount)}
          </div>
          {showTime && (
            <div className="text-[11px] text-white/30 ml-2.5 min-w-[44px] text-right">
              {new Date(d.created_at).toLocaleTimeString('zh-TW', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
