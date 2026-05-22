import { Search, Bell } from './icons'

interface TopBarProps {
  name: string
  date: string
}

export function TopBar({ name, date }: TopBarProps) {
  return (
    <div className="topbar">
      <div className="greeting">
        <span className="hi">{date}</span>
        <span className="biz">
          <span className="dot-live" />
          {name}
        </span>
      </div>
      <div className="actions">
        <button className="icon-btn" aria-label="Buscar">
          <Search size={18} />
        </button>
        <button className="icon-btn" aria-label="Notificações">
          <Bell size={18} />
          <span className="badge-dot" />
        </button>
      </div>
    </div>
  )
}
