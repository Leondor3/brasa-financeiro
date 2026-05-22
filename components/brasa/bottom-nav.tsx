'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Box, Plus, Users, TrendUp } from './icons'

const TABS = [
  { href: '/dashboard',   label: 'Hoje',      Icon: Home,    fab: false },
  { href: '/compras',     label: 'Compras',   Icon: Box,     fab: false },
  { href: '/vendas/nova', label: 'Vender',    Icon: Plus,    fab: true  },
  { href: '/clientes',    label: 'Clientes',  Icon: Users,   fab: false },
  { href: '/relatorios',  label: 'Relatório', Icon: TrendUp, fab: false },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="bottom-nav">
      {TABS.map(({ href, label, Icon, fab }) => {
        const isActive = pathname === href || (pathname.startsWith(href + '/') && href !== '/')
        if (fab) {
          return (
            <Link key={href} href={href} className="nav-fab-wrap">
              <div className={'nav-fab' + (isActive ? ' is-active' : '')}>
                <Icon size={28} sw={2.6} />
              </div>
              <span className="nav-fab-label">{label}</span>
            </Link>
          )
        }
        return (
          <Link key={href} href={href} className={'nav-item' + (isActive ? ' is-active' : '')}>
            <Icon size={20} sw={2} />
            <span>{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
