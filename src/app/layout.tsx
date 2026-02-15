import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: '🧧 紅包抽獎系統',
  description: '新年紅包抽獎活動 - 每日抽紅包，累計排行榜',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-TW">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  )
}
