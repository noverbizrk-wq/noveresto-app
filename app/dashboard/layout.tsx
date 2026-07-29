'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

const navItems = [
  { href: '/dashboard',            icon: '📊', label: 'Dashboard'     },
  { href: '/dashboard/forecasts',  icon: '🧠', label: 'Prévisions IA' },
  { href: '/dashboard/stocks',     icon: '📦', label: 'Stocks'        },
  { href: '/dashboard/orders',     icon: '🛒', label: 'Commandes'     },
  { href: '/dashboard/reputation', icon: '⭐', label: 'Réputation'    },
  { href: '/dashboard/social',     icon: '📲', label: 'Social Media'  },
  { href: '/dashboard/fidelisation',icon:'♥',  label: 'Fidélisation'  },
  { href: '/dashboard/admin',         icon:'⚙️', label: 'Admin Panel'   },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router   = useRouter()
  const pathname = usePathname()
  const [user, setUser]     = useState<any>(null)
  const [mobile, setMobile] = useState(false)

  useEffect(() => {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('nr_user='))
    if (!cookie) { router.push('/app/login'); return }
    try { setUser(JSON.parse(decodeURIComponent(cookie.split('=')[1]))) } catch(e) { router.push('/app/login') }
  }, [])

  function logout() {
    document.cookie = 'nr_token=; path=/; max-age=0'
    document.cookie = 'nr_user=; path=/; max-age=0'
    router.push('/app/login')
  }

  const initials = user?.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0,2) || 'NR'

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#081522' }}>
      {/* SIDEBAR */}
      <aside style={{ width:220, background:'#0D2137', borderRight:'1px solid #1A3A52', display:'flex', flexDirection:'column', position:'fixed', top:0, left:0, bottom:0, zIndex:50 }}>
        {/* Logo */}
        <div style={{ padding:'20px 16px', borderBottom:'1px solid #1A3A52' }}>
          <div style={{ fontSize:20, fontWeight:800 }}>Nover<span style={{ color:'#00C48C' }}>Resto</span></div>
          <div style={{ fontSize:10, color:'#6A8FAB', marginTop:2, textTransform:'uppercase', letterSpacing:1 }}>v1.2.0</div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'12px 0', overflowY:'auto' }}>
          <div style={{ fontSize:9, color:'#6A8FAB', padding:'0 16px 8px', textTransform:'uppercase', letterSpacing:1 }}>Principal</div>
          {navItems.slice(0,5).map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{
                display:'flex', alignItems:'center', gap:10, padding:'9px 16px',
                fontSize:13, color: active ? '#fff' : '#6A8FAB',
                background: active ? '#0F2D40' : 'transparent',
                borderLeft: `3px solid ${active ? '#00C48C' : 'transparent'}`,
                textDecoration:'none', fontWeight: active ? 600 : 400,
                transition:'all .15s'
              }}>
                <span>{item.icon}</span>{item.label}
              </Link>
            )
          })}
          <div style={{ fontSize:9, color:'#6A8FAB', padding:'12px 16px 8px', textTransform:'uppercase', letterSpacing:1 }}>Croissance</div>
          {navItems.slice(5).map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href} style={{
                display:'flex', alignItems:'center', gap:10, padding:'9px 16px',
                fontSize:13, color: active ? '#fff' : '#6A8FAB',
                background: active ? '#0F2D40' : 'transparent',
                borderLeft: `3px solid ${active ? '#00C48C' : 'transparent'}`,
                textDecoration:'none', fontWeight: active ? 600 : 400,
                transition:'all .15s'
              }}>
                <span>{item.icon}</span>{item.label}
              </Link>
            )
          })}
        </nav>

        {/* User */}
        <div style={{ padding:'14px 16px', borderTop:'1px solid #1A3A52' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'#00C48C', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#081522', flexShrink:0 }}>{initials}</div>
            <div style={{ overflow:'hidden' }}>
              <div style={{ fontSize:12, fontWeight:700, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name || '...'}</div>
              <div style={{ fontSize:10, color:'#00C48C', textTransform:'uppercase', letterSpacing:.5 }}>{user?.role || 'client'}</div>
            </div>
          </div>
          <button onClick={logout} style={{ width:'100%', padding:'7px', background:'#1A3A52', border:'none', borderRadius:7, color:'#8BAABF', fontSize:12, cursor:'pointer', fontFamily:'Inter,sans-serif' }}>
            🚪 Déconnexion
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <main style={{ flex:1, marginLeft:220, minHeight:'100vh', overflow:'auto' }}>
        {/* Topbar */}
        <div style={{ background:'#0D2137', borderBottom:'1px solid #1A3A52', padding:'0 24px', height:56, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:40 }}>
          <div style={{ fontSize:13, color:'#6A8FAB' }}>
            {new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:8, height:8, borderRadius:'50%', background:'#00C48C' }}></div>
            <span style={{ fontSize:12, color:'#00C48C', fontWeight:600 }}>Burger House · Lac Tunis</span>
          </div>
        </div>
        {/* Content */}
        <div style={{ padding:24 }}>
          {children}
        </div>
      </main>
    </div>
  )
}
