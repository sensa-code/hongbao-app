# 🧧 紅包抽獎系統

新年紅包抽獎活動系統 — 建立專案、分享連結、每日抽紅包、累計排行榜。

## 功能

- **建立紅包專案**：自訂活動名稱、日期範圍、每日獎金、人數、每包最低/最高金額
- **每日抽紅包**：活動期間內每人每天可抽一次，開紅包動畫
- **即時同步**：使用 Supabase Realtime，多人同時抽獎即時更新排行
- **每日紀錄**：查看活動期間每天的抽獎紀錄
- **累計排行榜**：顯示所有人從第一天到現在的總金額排行 + 每人每日明細表
- **手機優先**：響應式設計，適合手機上使用
- **名字記憶**：localStorage 記住上次輸入的名字

## 部署步驟

### 1. Supabase 設定

進入你的 Supabase Dashboard (`https://ozzhgginibhydrkkonmn.supabase.co`)：

#### a) 執行 SQL Migration

到 **SQL Editor**，貼上 `supabase-migration.sql` 的完整內容並執行。

#### b) 暴露 hongbao schema

到 **Settings → API → Exposed schemas**，加入 `hongbao`。

或者如果上面的 SQL migration 中的 `ALTER ROLE` 指令已成功執行，重新整理即可。

#### c) 啟用 Realtime

到 **Database → Replication**，確保 `hongbao.draws` 表的 **INSERT** 事件已啟用。

或在 SQL Editor 執行：
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE hongbao.draws;
```

#### d) 取得 API Key

到 **Settings → API**，複製：
- Project URL: `https://ozzhgginibhydrkkonmn.supabase.co`
- anon public key

### 2. 本地開發

```bash
# 複製專案
cd hongbao-app

# 建立環境變數
cp .env.local.example .env.local
# 編輯 .env.local，填入你的 Supabase anon key

# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev
```

打開 http://localhost:3000

### 3. 部署到 Vercel

```bash
# 安裝 Vercel CLI（如果還沒有）
npm i -g vercel

# 部署
vercel

# 設定環境變數
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY

# 重新部署
vercel --prod
```

或直接在 [vercel.com](https://vercel.com) 連結 GitHub repo，在 Settings → Environment Variables 加入：
- `NEXT_PUBLIC_SUPABASE_URL` = `https://ozzhgginibhydrkkonmn.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` = 你的 anon key

## 使用方式

1. 主辦人打開首頁，填寫紅包設定，按「建立紅包」
2. 頁面會跳轉到 `/p/{project-id}`，點「複製分享連結」
3. 把連結傳給所有參加者
4. 參加者打開連結，輸入全名，按「開始抽紅包」
5. 所有人都能看到即時排行榜和歷史紀錄

## Schema 隔離

所有資料表都在 `hongbao` schema 下，與 `public` schema 完全隔離：
- `hongbao.projects` — 紅包專案設定
- `hongbao.draws` — 抽獎紀錄（有 unique constraint 防止重複抽獎）

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + Tailwind CSS
- **Backend**: Supabase (PostgreSQL + Realtime + RLS)
- **Deploy**: Vercel
