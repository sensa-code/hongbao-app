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
  if (remaining === 1) return Math.round(leftAmount)

  const otherMin = (remaining - 1) * min_amount
  const otherMax = (remaining - 1) * max_amount
  const lo = Math.max(min_amount, leftAmount - otherMax)
  const hi = Math.min(max_amount, leftAmount - otherMin)
  if (lo > hi) return null
  return Math.round(lo + Math.random() * (hi - lo))
}

// ─── Date helpers ───
export const todayStr = () => new Date().toISOString().slice(0, 10)

export function dateRange(start: string, end: string): string[] {
  const days: string[] = []
  const d = new Date(start + 'T00:00:00')
  const endD = new Date(end + 'T00:00:00')
  while (d <= endD) {
    days.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 1)
  }
  return days
}

export const formatMoney = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
