'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createProject, getProjectsByIds, todayStr, dateRange, formatMoney, type Project } from '@/lib/supabase'
import { Lantern, GoldCoin } from '@/components/Decorations'

const MY_PROJECTS_KEY = 'hongbao_my_projects'

function getSavedProjectIds(): string[] {
  try {
    const raw = localStorage.getItem(MY_PROJECTS_KEY)
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveProjectId(id: string) {
  const ids = getSavedProjectIds()
  if (!ids.includes(id)) {
    ids.unshift(id)
    localStorage.setItem(MY_PROJECTS_KEY, JSON.stringify(ids))
  }
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + n)
  return d.toISOString().slice(0, 10)
}

export default function HomePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [myProjects, setMyProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(true)

  useEffect(() => {
    const ids = getSavedProjectIds()
    if (ids.length === 0) { setLoadingProjects(false); return }
    getProjectsByIds(ids)
      .then(setMyProjects)
      .catch(() => {})
      .finally(() => setLoadingProjects(false))
  }, [])

  const [form, setForm] = useState({
    title: '2026 新年紅包抽獎',
    totalPeople: 10,
    dailyBudget: 10000,
    minAmount: 200,
    maxAmount: 2000,
    startDate: todayStr(),
    endDate: addDays(todayStr(), 6),
  })

  const days =
    form.startDate && form.endDate && form.startDate <= form.endDate
      ? dateRange(form.startDate, form.endDate)
      : []

  const handleCreate = async () => {
    const { totalPeople, dailyBudget, minAmount, maxAmount, startDate, endDate, title } = form
    if (totalPeople < 1 || dailyBudget < 1) { setError('請填寫有效的人數和金額'); return }
    if (minAmount > maxAmount) { setError('最低金額不能大於最高金額'); return }
    if (minAmount * totalPeople > dailyBudget) { setError('最低金額 × 人數 不能超過每日獎金'); return }
    if (maxAmount * totalPeople < dailyBudget) { setError('最高金額 × 人數 不能小於每日獎金'); return }
    if (startDate > endDate) { setError('開始日期不能晚於結束日期'); return }

    setError('')
    setLoading(true)
    try {
      const project = await createProject({
        title: title || '紅包抽獎',
        total_people: totalPeople,
        daily_budget: dailyBudget,
        min_amount: minAmount,
        max_amount: maxAmount,
        start_date: startDate,
        end_date: endDate,
      })
      saveProjectId(project.id)
      router.push(`/p/${project.id}`)
    } catch (err: any) {
      setError(err?.message || '建立失敗，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  const set = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }))

  return (
    <div className="min-h-screen pb-20">
      {/* Header */}
      <div className="relative px-5 pt-10 pb-6 text-center"
        style={{ background: 'linear-gradient(180deg, rgba(204,0,0,0.4) 0%, transparent 100%)' }}>
        <Lantern side="left" delay={0} />
        <Lantern side="right" delay={0.5} />
        <div className="relative z-[2]">
          <div className="text-5xl mb-2" style={{ animation: 'float 3s ease-in-out infinite' }}>🧧</div>
          <h1 className="text-3xl font-black tracking-widest"
            style={{ color: '#ffd700', textShadow: '0 2px 8px rgba(255,215,0,0.3)' }}>
            紅包抽獎系統
          </h1>
          <p className="mt-2 text-sm tracking-wider" style={{ color: 'rgba(255,215,0,0.6)' }}>
            建立專案，分享連結，開始抽獎！
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-lg mx-auto px-4 mt-4">
        <div className="rounded-2xl p-5 border"
          style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,215,0,0.1)', backdropFilter: 'blur(10px)' }}>
          <h2 className="text-lg font-bold tracking-wider mb-4" style={{ color: '#ffd700' }}>
            ✨ 建立紅包專案
          </h2>

          {/* Title */}
          <div className="mb-3.5">
            <label className="block mb-1.5 text-sm font-semibold tracking-wider" style={{ color: 'rgba(255,215,0,0.7)' }}>
              專案名稱
            </label>
            <input
              className="w-full px-3.5 py-2.5 rounded-xl text-white text-[15px] transition-all"
              style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(255,215,0,0.2)' }}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="例：2026 新年紅包"
            />
          </div>

          {/* Dates */}
          <div className="flex gap-3 mb-3.5">
            <div className="flex-1">
              <label className="block mb-1.5 text-sm font-semibold tracking-wider" style={{ color: 'rgba(255,215,0,0.7)' }}>
                開始日期
              </label>
              <input
                type="date"
                className="w-full px-3.5 py-2.5 rounded-xl text-white text-[15px] transition-all"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(255,215,0,0.2)', colorScheme: 'dark' }}
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
              />
            </div>
            <div className="flex-1">
              <label className="block mb-1.5 text-sm font-semibold tracking-wider" style={{ color: 'rgba(255,215,0,0.7)' }}>
                結束日期
              </label>
              <input
                type="date"
                className="w-full px-3.5 py-2.5 rounded-xl text-white text-[15px] transition-all"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(255,215,0,0.2)', colorScheme: 'dark' }}
                value={form.endDate}
                onChange={(e) => set('endDate', e.target.value)}
              />
            </div>
          </div>

          {/* People & budget */}
          <div className="flex gap-3 mb-3.5">
            <div className="flex-1">
              <label className="block mb-1.5 text-sm font-semibold tracking-wider" style={{ color: 'rgba(255,215,0,0.7)' }}>
                每日參加人數
              </label>
              <input
                type="number"
                className="w-full px-3.5 py-2.5 rounded-xl text-white text-[15px] transition-all"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(255,215,0,0.2)' }}
                value={form.totalPeople}
                onChange={(e) => set('totalPeople', +e.target.value || 0)}
              />
            </div>
            <div className="flex-1">
              <label className="block mb-1.5 text-sm font-semibold tracking-wider" style={{ color: 'rgba(255,215,0,0.7)' }}>
                每日獎金總額
              </label>
              <input
                type="number"
                className="w-full px-3.5 py-2.5 rounded-xl text-white text-[15px] transition-all"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(255,215,0,0.2)' }}
                value={form.dailyBudget}
                onChange={(e) => set('dailyBudget', +e.target.value || 0)}
              />
            </div>
          </div>

          {/* Min / Max */}
          <div className="flex gap-3 mb-3.5">
            <div className="flex-1">
              <label className="block mb-1.5 text-sm font-semibold tracking-wider" style={{ color: 'rgba(255,215,0,0.7)' }}>
                每包最低
              </label>
              <input
                type="number"
                className="w-full px-3.5 py-2.5 rounded-xl text-white text-[15px] transition-all"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(255,215,0,0.2)' }}
                value={form.minAmount}
                onChange={(e) => set('minAmount', +e.target.value || 0)}
              />
            </div>
            <div className="flex-1">
              <label className="block mb-1.5 text-sm font-semibold tracking-wider" style={{ color: 'rgba(255,215,0,0.7)' }}>
                每包最高
              </label>
              <input
                type="number"
                className="w-full px-3.5 py-2.5 rounded-xl text-white text-[15px] transition-all"
                style={{ background: 'rgba(0,0,0,0.3)', border: '1.5px solid rgba(255,215,0,0.2)' }}
                value={form.maxAmount}
                onChange={(e) => set('maxAmount', +e.target.value || 0)}
              />
            </div>
          </div>

          {/* Preview */}
          {days.length > 0 && (
            <div className="rounded-xl px-3.5 py-2.5 mb-3"
              style={{ background: 'rgba(255,215,0,0.06)', border: '1px solid rgba(255,215,0,0.12)' }}>
              <span className="text-sm" style={{ color: 'rgba(255,215,0,0.7)' }}>
                📊 專案共 {days.length} 天，預算總計 {formatMoney((form.dailyBudget || 0) * days.length)}
              </span>
            </div>
          )}

          {error && (
            <p className="text-sm my-2 px-3 py-2 rounded-lg"
              style={{ color: '#ff6b6b', background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.2)' }}>
              {error}
            </p>
          )}

          <button
            className="w-full py-3.5 mt-2 rounded-xl text-lg font-bold tracking-widest transition-all disabled:opacity-50"
            style={{
              background: 'linear-gradient(135deg, #cc0000 0%, #ff2200 100%)',
              color: '#ffd700',
              boxShadow: '0 4px 20px rgba(204,0,0,0.4)',
              border: 'none',
            }}
            onClick={handleCreate}
            disabled={loading}
          >
            {loading ? '建立中...' : '🧧 建立紅包'}
          </button>
        </div>
      </div>

      {/* My Projects */}
      <div className="max-w-lg mx-auto px-4 mt-4">
        <div className="rounded-2xl p-5 border"
          style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,215,0,0.1)', backdropFilter: 'blur(10px)' }}>
          <h2 className="text-lg font-bold tracking-wider mb-4" style={{ color: '#ffd700' }}>
            📋 我的紅包專案
          </h2>
          {loadingProjects ? (
            <p className="text-center py-4 text-sm" style={{ color: 'rgba(255,215,0,0.4)' }}>載入中...</p>
          ) : myProjects.length === 0 ? (
            <p className="text-center py-4 text-sm" style={{ color: 'rgba(255,215,0,0.4)' }}>
              還沒建立過紅包專案，建立第一個吧！
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {myProjects.map((p) => {
                const t = todayStr()
                const status = t < p.start_date ? '🔜 尚未開始' : t > p.end_date ? '🏁 已結束' : '🔥 進行中'
                return (
                  <a key={p.id} href={`/p/${p.id}`}
                    className="flex items-center justify-between px-4 py-3 rounded-xl border transition-all hover:border-yellow-500/40"
                    style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,215,0,0.15)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="text-[15px] font-semibold text-white/90 truncate">{p.title}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: 'rgba(255,215,0,0.5)' }}>
                        {p.start_date.slice(5).replace('-', '/')} ~ {p.end_date.slice(5).replace('-', '/')}
                        &nbsp;・&nbsp;每日 {formatMoney(p.daily_budget)} ・ {p.total_people} 人
                      </div>
                    </div>
                    <div className="text-xs ml-3 whitespace-nowrap" style={{ color: 'rgba(255,215,0,0.7)' }}>
                      {status}
                    </div>
                  </a>
                )
              })}
            </div>
          )}
        </div>
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
