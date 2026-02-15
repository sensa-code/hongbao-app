import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'hongbao' },
})

// ─── Types ───
export interface Project {
  id: string
  title: string
  total_people: number
  daily_budget: number
  min_amount: number
  max_amount: number
  start_date: string
  end_date: string
  created_at: string
}

export interface Draw {
  id: string
  project_id: string
  name: string
  amount: number
  draw_date: string
  created_at: string
}

// ─── API helpers ───

export async function createProject(data: Omit<Project, 'id' | 'created_at'>) {
  const { data: project, error } = await supabase
    .from('projects')
    .insert(data)
    .select()
    .single()

  if (error) throw error
  return project as Project
}

export async function getProject(id: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Project
}

export async function getProjectsByIds(ids: string[]): Promise<Project[]> {
  if (ids.length === 0) return []
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .in('id', ids)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data || []) as Project[]
}

export async function getDraws(projectId: string) {
  const { data, error } = await supabase
    .from('draws')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data || []) as Draw[]
}

export async function insertDraw(draw: {
  project_id: string
  name: string
  amount: number
  draw_date: string
}) {
  const { data, error } = await supabase
    .from('draws')
    .insert(draw)
    .select()
    .single()

  if (error) throw error
  return data as Draw
}

// ─── Draw calculation (same logic, server-friendly) ───
export function calculateDraw(
  config: Pick<Project, 'total_people' | 'daily_budget' | 'min_amount' | 'max_amount'>,
  dayDraws: Draw[]
): number | null {
  const { total_people, daily_budget, min_amount, max_amount } = config
  const drawn = dayDraws.length
  const remaining = total_people - drawn
  if (remaining <= 0) return null

  const usedAmount = dayDraws.reduce((s, d) => s + d.amount, 0)
  const leftAmount = daily_budget - usedAmount

  // 剩餘金額不夠發最低金額時，把剩餘全部給這個人
  if (leftAmount <= min_amount) {
    return Math.max(1, Math.round(leftAmount))
  }

  if (remaining === 1) return Math.round(leftAmount)

  // 計算合理的上下限，確保後面的人至少能拿到 min_amount
  const otherMin = (remaining - 1) * min_amount
  const lo = Math.max(min_amount, leftAmount - (remaining - 1) * max_amount)
  const hi = Math.min(max_amount, leftAmount - otherMin)

  // 如果正常範圍算不出來（前面的人抽太多），使用均分 ± 浮動的降級策略
  if (lo > hi) {
    const avg = leftAmount / remaining
    // 如果均分都不到最低金額，就直接給均分值
    if (avg < min_amount) {
      return Math.max(1, Math.round(avg))
    }
    // 均分值在合理範圍，加一點隨機浮動（±30%）
    const fluctuation = avg * 0.3
    const fallbackLo = Math.max(min_amount, avg - fluctuation)
    const fallbackHi = Math.min(max_amount, avg + fluctuation)
    // 但不能超過「剩餘金額 - 其他人每人 $1」的上限
    const safeHi = Math.min(fallbackHi, leftAmount - (remaining - 1))
    const safeLo = Math.min(fallbackLo, safeHi)
    return Math.round(safeLo + Math.random() * (safeHi - safeLo))
  }

  return Math.round(lo + Math.random() * (hi - lo))
}

// ─── Date helpers (台灣時區 UTC+8) ───
export function todayStr(): string {
  const now = new Date()
  const offset = now.getTimezoneOffset()
  const local = new Date(now.getTime() - offset * 60000)
  return local.toISOString().slice(0, 10)
}

export function dateRange(start: string, end: string): string[] {
  const days: string[] = []
  // 用純字串運算避免 UTC 偏移
  const [sy, sm, sd] = start.split('-').map(Number)
  const [ey, em, ed] = end.split('-').map(Number)
  const startD = new Date(sy, sm - 1, sd)
  const endD = new Date(ey, em - 1, ed)
  const cur = new Date(startD)
  while (cur <= endD) {
    const y = cur.getFullYear()
    const m = String(cur.getMonth() + 1).padStart(2, '0')
    const d = String(cur.getDate()).padStart(2, '0')
    days.push(`${y}-${m}-${d}`)
    cur.setDate(cur.getDate() + 1)
  }
  return days
}

export const formatMoney = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
