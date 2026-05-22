import { ReactNode } from 'react'

interface PageHeadProps {
  kicker: string
  title: string
  sub?: string
  right?: ReactNode
}

export function PageHead({ kicker, title, sub, right }: PageHeadProps) {
  return (
    <div className="page-head">
      <div className="page-head-row">
        <div>
          <div className="kicker">{kicker}</div>
          <h1>{title}</h1>
          {sub && <div className="sub">{sub}</div>}
        </div>
        {right && <div style={{ marginTop: 4 }}>{right}</div>}
      </div>
    </div>
  )
}
