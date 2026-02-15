'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import {
  supabase,
  getProject,
  getDraws,
  insertDraw,
  calculateDraw,
  todayStr,
  dateRange,
  formatMoney,
  type Project,
  type Draw,
} from '@/lib/supabase'
import { Lantern, GoldCoin, ProgressBar } from '@/components/Decorations'
import Leaderboard from '@/components/Leaderboard'
import EnvelopeAnimation from '@/components/EnvelopeAnimation'

const NAME_KEY = 'hongbao_my_name'

export default function ProjectPage() {
  const params = useParams()
  const projectId = params.id as string

  const [project, setProject] = useState<Project | null>(null)
  const [draws, setDraws] = useState<Draw[]>([])
  const [myName, setMyName] = useState('')
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [view, setView] = useState<'main' | 'history' | 'cumulative'>('main')
  const [animating, setAnimating] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [drawing, setDrawing] = useState(false)
  const [historyDate, setHistoryDate] = useState(todayStr())
  const [copied, setCopied] = useState(false)

  // Load initial data
  useEffect(() => {
    const saved = localStorage.getItem(NAME_KEY)
    if (saved) setMyName(saved)

    ;(async () => {
      try {
        const [proj, dr] = await Promise.all([
          getProject(projectId),
          getDraws(projectId),
        ])
        setProject(proj)
        setDraws(dr)
      } catch {
        setNotFound(true)
      }
      setLoading(false)
    })()
  }, [projectId])

  // Realtime subscription for draws
  useEffect(() => {
    const channel = supabase
      .channel(`draws:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'hongbao',
          table: 'draws',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          const newDraw = payload.new as Draw
          setDraws((prev) => {
            if (prev.find((d) => d.id === newDraw.id)) return prev
            return [...prev, newDraw]
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [projectId])

  // Draw handler
  const handleDraw = useCallback(async () => {
    if (!project || drawing) return
    const trimmed = myName.trim()
    if (!trimmed) { setError('請輸入你的全名'); return }

    const t = todayStr()
    if (t < project.start_date || t > project.end_date) {
      setError('今天不在活動期間內喔！'); return
    }

    const todayD = draws.filter((d) => d.draw_date === t)
    if (todayD.find((d) => d.name === trimmed)) {
      const found = todayD.find((d) => d.name === trimmed)!
      setError(`你今天已經抽過了！金額：${formatMoney(found.amount)}`)
      return
    }
    if (todayD.length >= project.total_people) {
      setError('今天的紅包已經全部抽完囉！'); return
    }

    const amount = calculateDraw(project, todayD)
    if (amount === null) { setError('無法計算紅包金額，請聯繫主辦人'); return }

    setError('')
    setDrawing(true)
    localStorage.setItem(NAME_KEY, trimmed)

    try {
      await insertDraw({
        project_id: projectId,
        name: trimmed,
        amount,
        draw_date: t,
      })
      setAnimating(amount)
    } catch (err: any) {
      if (err?.message?.includes('idx_draws_unique_per_day')) {
        setError('你今天已經抽過了！')
      } else {
        setError(err?.message || '抽獎失敗，請稍後再試')
      }
    } finally {
      setDrawing(false)
    }
  }, [project, myName, draws, drawing, projectId])

  // Copy share link
  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <div className="w-10 h-10 rounded-full border-[3px] animate-spin"
          style={{ borderColor: 'rgba(255,215,0,0.2)', borderTopColor: '#ffd700' }} />
        <p className="mt-4" style={{ color: '#ffd700' }}>載入中...</p>
      </div>
    )
  }

  if (notFound || !project) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
        <div className="text-6xl mb-4">🧧</div>
        <h1 className="text-2xl font-bold mb-2" style={{ color: '#ffd700' }}>找不到這個紅包專案</h1>
        <p className="text-sm" style={{ color: 'rgba(255,215,0,0.5)' }}>連結可能已過期或不正確</p>
        <a href="/" className="mt-6 px-6 py-3 rounded-xl text-sm font-bold tracking-wider"
          style={{ background: 'rgba(255,215,0,0.15)', color: '#ffd700', border: '1px solid rgba(255,215,0,0.3)' }}>
          回首頁建立新專案
        </a>
      </div>
    )
  }

  // Derived
  const t = todayStr()
  const todayDraws = draws.filter((d) => d.draw_date === t)
  const remaining = project.total_people - todayDraws.length
  const usedToday = todayDraws.reduce((s, d) => s + d.amount, 0)
  const leftToday = project.daily_budget - usedToday

  const isActive = t >= project.start_date && t <= project.end_date
  const isBeforeStart = t < project.start_date
  const isEnded = t > project.end_date

  const projectDays = dateRange(project.start_date, project.end_date)
  const totalDays = projectDays.length
  const elapsedDays = projectDays.filter((d) => d <= t).length
  const totalProjectBudget = project.daily_budget * totalDays

  const historyDraws = draws.filter((d) => d.draw_date === historyDate)
  const totalDistributed = draws.reduce((s, d) => s + d.amount, 0)

  // Cumulative
  const cumulativeMap: Record<string, number> = {}
  draws.forEach((d) => { cumulativeMap[d.name] = (cumulativeMap[d.name] || 0) + d.amount })
  const cumulativeList = Object.entries(cumulativeMap)
    .map(([name, total]) => ({
      name,
      total,
      count: draws.filter((d) => d.name === name).length,
    }))
    .sort((a, b) => b.total - a.total)

  return (
    <div className="min-h-screen pb-20">
      {animating !== null && (
        <EnvelopeAnimation amount={animating} onDone={() => setAnimating(null)} />
      )}

      {/* Header */}
      <div className="relative px-5 pt-10 pb-5 text-center"
        style={{ background: 'linear-gradient(180deg, rgba(204,0,0,0.4) 0%, transparent 100%)' }}>
        <Lantern side="left" delay={0} />
        <Lantern side="right" delay={0.5} />
        <div className="relative z-[2]">
          <div className="text-5xl mb-2" style={{ animation: 'float 3s ease-in-out infinite' }}>🧧</div>
          <h1 className="text-2xl font-black tracking-widest"
            style={{ color: '#ffd700', textShadow: '0 2px 8px rgba(255,215,0,0.3)' }}>
            {project.title}
          </h1>
          <p className="mt-2 text-sm tracking-wider" style={{ color: 'rgba(255,215,0,0.7)' }}>
            {project.start_date.slice(5).replace('-', '/')} ~ {project.end_date.slice(5).replace('-', '/')}
            &nbsp;・&nbsp;每日 {formatMoney(project.daily_budget)} ・ {project.total_people} 人
          </p>
          <div className="mt-1.5 text-xs tracking-wider" style={{ color: 'rgba(255,215,0,0.5)' }}>
            {isBeforeStart ? '🔜 活動尚未開始' : isEnded ? '🏁 活動已結束' : `🔥 活動進行中（第 ${elapsedDays}/${totalDays} 天）`}
          </div>

          {/* Share */}
          <button
            onClick={handleCopy}
            className="mt-3 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wider transition-all"
            style={{
              background: copied ? 'rgba(255,215,0,0.2)' : 'rgba(255,215,0,0.08)',
              color: copied ? '#ffd700' : 'rgba(255,215,0,0.6)',
              border: '1px solid rgba(255,215,0,0.2)',
            }}
          >
            {copied ? '✓ 已複製連結' : '🔗 複製分享連結'}
          </button>
        </div>
      </div>

      {/* Nav */}
      <div className="flex px-4 mt-1">
        {([
          { key: 'main' as const, label: '🎯 抽紅包' },
          { key: 'history' as const, label: '📅 每日紀錄' },
          { key: 'cumulative' as const, label: '🏆 累計排行' },
        ]).map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setView(tab.key); setError('') }}
            className="flex-1 py-2.5 text-sm font-semibold tracking-wider transition-all border-b-2"
            style={{
              color: view === tab.key ? '#ffd700' : 'rgba(255,215,0,0.5)',
              borderBottomColor: view === tab.key ? '#ffd700' : 'rgba(255,215,0,0.15)',
              background: 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-w-lg mx-auto px-4 mt-4">

        {/* ═══ Main ═══ */}
        {view === 'main' && (
          <>
            {/* Status */}
            <div className="flex items-center rounded-2xl px-2 py-3.5 mb-4 border"
              style={{ background: 'rgba(255,215,0,0.08)', borderColor: 'rgba(255,215,0,0.12)' }}>
              <div className="flex-1 text-center">
                <div className="text-lg font-black" style={{ color: '#ffd700' }}>{remaining}</div>
                <div className="text-[11px] mt-0.5 tracking-wider" style={{ color: 'rgba(255,215,0,0.6)' }}>今日剩餘</div>
              </div>
              <div className="w-px h-8" style={{ background: 'rgba(255,215,0,0.15)' }} />
              <div className="flex-1 text-center">
                <div className="text-lg font-black" style={{ color: '#ffd700' }}>{formatMoney(leftToday)}</div>
                <div className="text-[11px] mt-0.5 tracking-wider" style={{ color: 'rgba(255,215,0,0.6)' }}>今日餘額</div>
              </div>
              <div className="w-px h-8" style={{ background: 'rgba(255,215,0,0.15)' }} />
              <div className="flex-1 text-center">
                <div className="text-lg font-black" style={{ color: '#ffd700' }}>{todayDraws.length}</div>
                <div className="text-[11px] mt-0.5 tracking-wider" style={{ color: 'rgba(255,215,0,0.6)' }}>已抽人數</div>
              </div>
            </div>

            {/* Progress */}
            <Card className="!py-3.5 !px-4 mb-4">
              <div className="flex justify-between mb-1.5">
                <span className="text-xs" style={{ color: 'rgba(255,215,0,0.6)' }}>活動進度</span>
                <span className="text-xs" style={{ color: 'rgba(255,215,0,0.8)' }}>{elapsedDays} / {totalDays} 天</span>
              </div>
              <ProgressBar current={elapsedDays} total={totalDays} />
              <div className="flex justify-between mt-2">
                <span className="text-xs" style={{ color: 'rgba(255,215,0,0.6)' }}>今日發放</span>
                <span className="text-xs" style={{ color: 'rgba(255,215,0,0.8)' }}>{formatMoney(usedToday)} / {formatMoney(project.daily_budget)}</span>
              </div>
              <ProgressBar current={usedToday} total={project.daily_budget} color="#ff6644" />
            </Card>

            {/* Draw */}
            <Card>
              <h2 className="text-[17px] font-bold tracking-wider mb-4" style={{ color: '#ffd700' }}>
                🎊 輸入姓名抽紅包
              </h2>
              <div className="mb-3.5">
                <label className="block mb-1.5 text-sm font-semibold tracking-wider" style={{ color: 'rgba(255,215,0,0.7)' }}>
                  你的全名
                </label>
                <input
                  className="w-full px-3.5 py-2.5 rounded-xl text-white text-[15px] transition-all"
                  style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(255,215,0,0.2)' }}
                  value={myName}
                  onChange={(e) => setMyName(e.target.value)}
                  placeholder="請輸入全名（例：王小明）"
                  onKeyDown={(e) => e.key === 'Enter' && handleDraw()}
                />
              </div>
              {error && (
                <p className="text-sm my-2 px-3 py-2 rounded-lg"
                  style={{ color: '#ff6b6b', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)' }}>
                  {error}
                </p>
              )}
              <button
                className="w-full py-4 mt-2 rounded-2xl text-xl font-black tracking-[0.2em] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: 'linear-gradient(135deg, #cc0000 0%, #ff2200 50%, #cc0000 100%)',
                  backgroundSize: '200% 100%',
                  color: '#ffd700',
                  border: '2px solid rgba(255,215,0,0.3)',
                  boxShadow: isActive && remaining > 0 ? '0 6px 30px rgba(204,0,0,0.5)' : 'none',
                  animation: isActive && remaining > 0 ? 'shimmer 3s linear infinite' : 'none',
                }}
                onClick={handleDraw}
                disabled={!isActive || remaining <= 0 || drawing}
              >
                {drawing ? '抽獎中...' : isBeforeStart ? '活動尚未開始' : isEnded ? '活動已結束' : remaining <= 0 ? '今日紅包已抽完' : '🧧 開始抽紅包！'}
              </button>
            </Card>

            {/* Today leaderboard */}
            <Card>
              <h2 className="text-[17px] font-bold tracking-wider mb-4" style={{ color: '#ffd700' }}>
                📊 今日排行
              </h2>
              <Leaderboard draws={todayDraws} />
            </Card>
          </>
        )}

        {/* ═══ History ═══ */}
        {view === 'history' && (
          <Card>
            <h2 className="text-[17px] font-bold tracking-wider mb-4" style={{ color: '#ffd700' }}>
              📅 每日紀錄
            </h2>
            <div className="flex gap-1.5 flex-wrap mb-3.5">
              {projectDays.map((date) => {
                const hasDraws = draws.some((d) => d.draw_date === date)
                const isPast = date <= t
                return (
                  <button
                    key={date}
                    onClick={() => setHistoryDate(date)}
                    className="px-3 py-1.5 rounded-full text-xs transition-all"
                    style={{
                      background: historyDate === date ? 'rgba(255,215,0,0.15)' : 'rgba(0,0,0,0.2)',
                      border: `1px solid ${historyDate === date ? '#ffd700' : 'rgba(255,215,0,0.2)'}`,
                      color: historyDate === date ? '#ffd700' : 'rgba(255,215,0,0.6)',
                      opacity: !isPast ? 0.25 : !hasDraws ? 0.4 : 1,
                      fontStyle: !isPast ? 'italic' : 'normal',
                    }}
                  >
                    {date === t ? `今天 (${date.slice(5).replace('-', '/')})` : date.slice(5).replace('-', '/')}
                    {hasDraws && (
                      <span className="block w-1 h-1 rounded-full mx-auto mt-0.5" style={{ background: '#ffd700' }} />
                    )}
                  </button>
                )
              })}
            </div>
            <div className="mb-3">
              <div className="text-[15px] font-bold" style={{ color: '#ffd700' }}>{historyDate}</div>
              <div className="text-xs mt-0.5" style={{ color: 'rgba(255,215,0,0.5)' }}>
                {historyDraws.length} 人已抽 ・ 共 {formatMoney(historyDraws.reduce((s, d) => s + d.amount, 0))} / {formatMoney(project.daily_budget)}
              </div>
            </div>
            {historyDraws.length === 0 ? (
              <p className="text-center py-5 text-sm" style={{ color: 'rgba(255,215,0,0.4)' }}>
                {historyDate > t ? '這天還沒到喔' : '這天沒有抽獎紀錄'}
              </p>
            ) : (
              <Leaderboard draws={historyDraws} showTime />
            )}
          </Card>
        )}

        {/* ═══ Cumulative ═══ */}
        {view === 'cumulative' && (
          <>
            {/* Total */}
            <Card className="text-center">
              <div className="text-sm tracking-wider mb-1" style={{ color: 'rgba(255,215,0,0.6)' }}>專案累計發放</div>
              <div className="text-3xl font-black"
                style={{ color: '#ffd700', textShadow: '0 2px 8px rgba(255,215,0,0.3)' }}>
                {formatMoney(totalDistributed)}
              </div>
              <div className="text-xs mt-1" style={{ color: 'rgba(255,215,0,0.4)' }}>
                / {formatMoney(totalProjectBudget)} 預算 ・ {draws.length} 次抽獎
              </div>
              <div className="mt-2.5">
                <ProgressBar current={totalDistributed} total={totalProjectBudget} />
              </div>
            </Card>

            {/* Cumulative leaderboard */}
            <Card>
              <h2 className="text-[17px] font-bold tracking-wider mb-4" style={{ color: '#ffd700' }}>
                🏆 累計金額排行
              </h2>
              {cumulativeList.length === 0 ? (
                <p className="text-center py-5 text-sm" style={{ color: 'rgba(255,215,0,0.4)' }}>尚無抽獎紀錄</p>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {cumulativeList.map((d, i) => {
                    const cls = i === 0
                      ? 'bg-gradient-to-r from-yellow-500/15 to-yellow-500/5 border-yellow-500/25'
                      : i === 1
                      ? 'bg-white/5 border-gray-400/15'
                      : i === 2
                      ? 'bg-orange-800/10 border-orange-700/15'
                      : 'bg-white/[0.03] border-yellow-500/5'
                    return (
                      <div key={d.name} className={`flex items-center px-3 py-2.5 rounded-xl border ${cls}`}>
                        <div className="w-9 text-center text-lg">
                          {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`}
                        </div>
                        <div className="flex-1">
                          <div className="text-[15px] font-semibold text-white/90">{d.name}</div>
                          <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                            抽了 {d.count} 次 ・ 平均 {formatMoney(Math.round(d.total / d.count))}
                          </div>
                        </div>
                        <div className="font-bold ml-2"
                          style={{ color: i === 0 ? '#ffd700' : '#ff8866', fontSize: i === 0 ? 22 : 18 }}>
                          {formatMoney(d.total)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            {/* Detail table */}
            {cumulativeList.length > 0 && (
              <Card>
                <h2 className="text-[17px] font-bold tracking-wider mb-4" style={{ color: '#ffd700' }}>
                  📋 每人每日明細
                </h2>
                <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
                  <table className="w-full border-collapse text-sm" style={{ minWidth: 400 }}>
                    <thead>
                      <tr>
                        <th className="px-1.5 py-2 text-center text-[11px] font-semibold whitespace-nowrap border-b"
                          style={{ color: 'rgba(255,215,0,0.6)', borderColor: 'rgba(255,215,0,0.12)' }}>
                          姓名
                        </th>
                        {projectDays.filter((d) => d <= t).map((date) => (
                          <th key={date} className="px-1.5 py-2 text-center text-[11px] font-semibold whitespace-nowrap border-b"
                            style={{ color: 'rgba(255,215,0,0.6)', borderColor: 'rgba(255,215,0,0.12)' }}>
                            {date.slice(5).replace('-', '/')}
                          </th>
                        ))}
                        <th className="px-1.5 py-2 text-center text-[11px] font-bold whitespace-nowrap border-b"
                          style={{ color: '#ffd700', borderColor: 'rgba(255,215,0,0.12)' }}>
                          合計
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {cumulativeList.map((person) => (
                        <tr key={person.name}>
                          <td className="px-1.5 py-2 text-left text-xs font-semibold whitespace-nowrap border-b text-white/70"
                            style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                            {person.name}
                          </td>
                          {projectDays.filter((d) => d <= t).map((date) => {
                            const draw = draws.find((d) => d.name === person.name && d.draw_date === date)
                            return (
                              <td key={date} className="px-1.5 py-2 text-center text-xs whitespace-nowrap border-b"
                                style={{ color: draw ? '#ff8866' : 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.04)' }}>
                                {draw ? formatMoney(draw.amount) : '—'}
                              </td>
                            )
                          })}
                          <td className="px-1.5 py-2 text-center text-xs font-bold whitespace-nowrap border-b"
                            style={{ color: '#ffd700', borderColor: 'rgba(255,255,255,0.04)' }}>
                            {formatMoney(person.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="fixed bottom-0 left-0 right-0 text-center py-4 text-sm tracking-widest"
        style={{ background: 'linear-gradient(transparent, rgba(26,0,0,0.95))', color: 'rgba(255,215,0,0.4)' }}>
        <GoldCoin />
        <span className="ml-2">恭喜發財 ・ 紅包拿來</span>
      </div>
    </div>
  )
}

// Reusable card wrapper
function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-2xl p-5 mb-4 border ${className}`}
      style={{
        background: 'rgba(255,255,255,0.05)',
        borderColor: 'rgba(255,215,0,0.1)',
        backdropFilter: 'blur(10px)',
      }}
    >
      {children}
    </div>
  )
}
