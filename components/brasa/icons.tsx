import { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number; sw?: number }

const I = ({ children, size = 20, sw = 1.75, fill = 'none', ...rest }: IconProps & { children: React.ReactNode }) => (
  <svg
    width={size} height={size} viewBox="0 0 24 24"
    fill={fill} stroke="currentColor" strokeWidth={sw}
    strokeLinecap="round" strokeLinejoin="round"
    {...rest}
  >{children}</svg>
)

export const Home     = (p: IconProps) => <I {...p}><path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1Z"/></I>
export const Box      = (p: IconProps) => <I {...p}><path d="m21 8-9-5-9 5 9 5 9-5Z"/><path d="m3 8 9 5 9-5"/><path d="M12 13v8"/><path d="M3 8v8l9 5 9-5V8"/></I>
export const Plus     = (p: IconProps) => <I {...p}><path d="M12 5v14M5 12h14"/></I>
export const Coin     = (p: IconProps) => <I {...p}><circle cx="12" cy="12" r="9"/><path d="M9 9.5h3.5a1.75 1.75 0 0 1 0 3.5H9M9 13h4a1.75 1.75 0 0 1 0 3.5H9V9.5"/></I>
export const TrendUp  = (p: IconProps) => <I {...p}><path d="m22 7-8.5 8.5-5-5L2 17"/><path d="M16 7h6v6"/></I>
export const ArrowRight = (p: IconProps) => <I {...p}><path d="M5 12h14M13 5l7 7-7 7"/></I>
export const Check    = (p: IconProps) => <I {...p}><path d="M5 12.5 10 17 20 7"/></I>
export const X        = (p: IconProps) => <I {...p}><path d="M18 6 6 18M6 6l12 12"/></I>
export const Bell     = (p: IconProps) => <I {...p}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></I>
export const Search   = (p: IconProps) => <I {...p}><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></I>
export const Calendar = (p: IconProps) => <I {...p}><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></I>
export const Users    = (p: IconProps) => <I {...p}><circle cx="9" cy="7" r="3.5"/><path d="M2 21v-1.5a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5V21"/><path d="M17 11a3 3 0 1 0 0-6"/><path d="M22 21v-1.5a4 4 0 0 0-3-3.85"/></I>
