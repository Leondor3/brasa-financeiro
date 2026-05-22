'use client'

import { useState } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px',
      background: `
        radial-gradient(900px 600px at 80% -10%, rgba(255,106,0,0.12), transparent 60%),
        radial-gradient(700px 500px at -10% 100%, rgba(255,176,32,0.08), transparent 55%),
        #0a0807
      `,
    }}>
      <div style={{ width: '100%', maxWidth: 360 }}>
        {/* Brand */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 18,
            background: 'radial-gradient(circle at 30% 30%, var(--gold-400), var(--brasa-500) 55%, #5a1300 95%)',
            boxShadow: '0 0 0 1px rgba(255,200,100,0.25), 0 10px 30px rgba(255,106,0,0.4)',
            margin: '0 auto 16px',
          }} />
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Brasa</div>
          <div style={{ fontSize: 13, color: 'var(--text-mute)', marginTop: 4 }}>
            Espetinho da Cocada · Financeiro
          </div>
        </div>

        {/* Card */}
        <div className="card card-elev" style={{ padding: 24 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.18em', marginBottom: 16 }}>
            Entrar
          </div>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                E-mail
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                style={{
                  width: '100%', padding: '12px 14px',
                  background: 'rgba(255,245,230,0.04)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 12, color: 'var(--text)',
                  fontSize: 15, fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: 6 }}>
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '12px 14px',
                  background: 'rgba(255,245,230,0.04)',
                  border: '1px solid var(--border-strong)',
                  borderRadius: 12, color: 'var(--text)',
                  fontSize: 15, fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            </div>

            {error && (
              <div style={{
                padding: '10px 12px', borderRadius: 10,
                background: 'rgba(255,90,77,0.12)', border: '1px solid rgba(255,90,77,0.3)',
                color: 'var(--red-400)', fontSize: 13, fontWeight: 500,
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', marginTop: 4, padding: '14px', fontSize: 15, opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Entrando...' : 'Entrar 🔥'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
