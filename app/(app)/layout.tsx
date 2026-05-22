import { BottomNav } from '@/components/brasa/bottom-nav'
import { QueryProvider } from '@/components/shared/query-provider'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <div className="brasa-app">
        <div className="brasa-scroll">
          <div style={{ maxWidth: 430, margin: '0 auto' }}>
            {children}
          </div>
        </div>
        <BottomNav />
      </div>
    </QueryProvider>
  )
}
